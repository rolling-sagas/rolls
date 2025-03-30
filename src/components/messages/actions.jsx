import { nanoid } from "nanoid";
import { useStore } from "@/lib/store";
import { stream } from "@/lib/ai/index";
import QuickJS from "@/lib/quickjs";

export class MessageActionError extends Error {
	constructor({ type, name, message }) {
		super(message);
		this.type = type || "MessageActionError";
		this.name = name || "Message Action Error";
	}
}

export async function recover() {
	const sandbox = useStore.getState().sandbox;
	if (sandbox) {
		await start(false);
	}
}

export function isEntry(content) {
	return content.trim().split("\n")[0].toLowerCase().startsWith("// @entry");
}

// Sandbox Management
export async function initializeSandbox(modules, configs) {
	const entryModule = modules.find((s) => isEntry(s.content));

	if (!entryModule) {
		// console.warn("No entry module found");
		useStore.setState({ sandbox: null });
		throw new MessageActionError({
			type: "EntryNotFound",
			name: "Entry Module Not Found",
			message: "Entry module not found, create or set the entry module.",
		});
	}

	// Clean up existing sandbox
	const currentSandbox = useStore.getState().sandbox;
	currentSandbox?.destroy();

	try {
		// Create and initialize new sandbox
		const newSandbox = new QuickJS();
		await newSandbox.run(modules, configs);
		useStore.setState({ sandbox: newSandbox });

		// Start processing based on existing messages
		const messages = useStore.getState().messages;
		await start(messages.length === 0);
	} catch (error) {
		useStore.setState({ sandbox: null });
		throw error;
	}
}

// Message Validation
function validateMessage(role, content) {
	const validRoles = ["system", "user", "assistant", "divider"];
	if (!validRoles.includes(role)) {
		throw new Error(`Invalid role: ${role}`);
	}
	if (typeof content !== "string") {
		throw new Error("Content must be a string");
	}
}

export function setAvatar(avatar) {
	useStore.setState(() => ({
		avatar: avatar,
	}));
}

// Message Processing
export async function start(newMessage = false) {
	const sandbox = useStore.getState().sandbox;
	if (!sandbox) return;

	const startSnapshot = getLastSnapshot();
	const messages = await sandbox.callMethod("onStart", startSnapshot);

	if (messages && messages.length > 0 && newMessage) {
		let id;
		for (const msg of messages) {
			validateMessage(msg.role, msg.content);
			id = addMessage(msg.role, msg.content, msg.snapshot);
		}
		await generateFromId(id);
	}
}

export async function submit(data) {
	const sandbox = useStore.getState().sandbox;
	if (!sandbox) return;

	const messages = sandbox.callMethod("onSubmit", data);
	if (messages && messages.length > 0) {
		let id;
		for (const msg of messages) {
			validateMessage(msg.role, msg.content);
			id = addMessage(msg.role, msg.content, msg.snapshot);
		}
		await generateFromId(id);
	}
}

export async function generate(messages, skipCache = false) {
	const id = nanoid();
	const newMessage = {
		role: "assistant",
		content: "",
		id,
		updatedAt: new Date(),
		status: "loading",
	};

	// Add initial message
	useStore.setState((state) => ({
		messages: [...state.messages, newMessage],
	}));

	// Update message content as it streams
	const onMessage = (content) => {
		useStore.setState((state) => ({
			messages: state.messages.map((msg) =>
				msg.id === id
					? {
							...msg,
							content: msg.content + content,
							status: "generating",
							updatedAt: new Date(),
						}
					: msg,
			),
		}));
	};

	await stream(messages, onMessage, skipCache);

	// send to sandbox
	const sandbox = useStore.getState().sandbox;
	let lastMessage = useStore.getState().messages.slice(-1)[0];
	lastMessage =
		(await sandbox?.callMethod("onGenerate", lastMessage)) || lastMessage;

	// Mark as finished
	useStore.setState((state) => ({
		messages: state.messages.map((msg) =>
			msg.id === id ? { ...lastMessage, status: "finished" } : msg,
		),
	}));
}

export function getMessageById(id) {
	return useStore.getState().messages.find((msg) => msg.id === id);
}

export async function restartFromId(id) {
	const sandbox = useStore.getState().sandbox;
	if (!sandbox) return;

	const message = getMessageById(id);
	truncateMessagesAfter(id);

	const messages = await sandbox.callMethod("onStart", getLastSnapshot());
	if (message.role === "divider") {
		truncateMessagesAfter(message.id, true);
		let id;
		for (const msg of messages) {
			id = addMessage(msg.role, msg.content, msg.snapshot);
		}
		await generateFromId(id);
	} else if (message.role === "user" || message.role === "system") {
		await generateFromId(message.id);
	}
}

export async function restart() {
	useStore.setState({ messages: [] });
	await start(true);
}

// Generation Utilities
export async function regenerate(id) {
	const messages = getMessagesBeforeId(id, true);
	truncateMessagesAfter(id, true);
	await generate(messages, true);
}

export async function generateFromId(id) {
	const messages = getMessagesBeforeId(id);
	truncateMessagesAfter(id);
	if (
		messages.length > 0 &&
		messages[messages.length - 1].role === "assistant"
	) {
		return;
	}
	await generate(messages);
}

export function getLastAvatar(id, role) {
	const messages = getMessagesBeforeId(id, false);
	for (let i = messages.length - 1; i >= 0; i--) {
		const message = messages[i];
		if (message.snapshot?.avatar?.[role]) {
			return message.snapshot.avatar[role];
		}
	}
}

// Message Utilities
export function getMessagesBeforeId(id, exclude = false) {
	const messages = useStore.getState().messages;
	const index = messages.findIndex((msg) => msg.id === id);
	if (index === -1) throw new Error(`Message not found: ${id}`);

	const sliceEnd = index + (exclude ? 0 : 1);
	const relevantMessages = messages.slice(0, sliceEnd);
	const dividerIndex = relevantMessages.findLastIndex(
		(msg) => msg.role === "divider",
	);

	return dividerIndex === -1
		? relevantMessages
		: relevantMessages.slice(dividerIndex + 1);
}

export function getLastSnapshot() {
	const messages = useStore.getState().messages;
	if (!messages?.length) return null;
	const lastSnapshotMsg = messages.findLast((msg) => msg.snapshot);
	return lastSnapshotMsg?.snapshot || null;
}

export function getLastDivider(id) {
	const messages = useStore.getState().messages;
	const index = messages.findIndex((msg) => msg.id === id);
	if (index < 0) return null;

	const slice = messages.slice(0, index + 1);
	const lastDividerMsg = slice.findLast((msg) => msg.role === "divider");
	return lastDividerMsg.content;
}

export function addMessage(role, content, snapshot) {
	validateMessage(role, content);
	const id = nanoid();
	useStore.setState((state) => ({
		messages: [
			...state.messages,
			{
				role,
				content,
				id,
				updatedAt: new Date(),
				snapshot,
			},
		],
	}));
	return id;
}

export function updateMessage(id, role, content) {
	useStore.setState((state) => ({
		messages: state.messages.map((msg) =>
			msg.id === id
				? { ...msg, id, role, content, updatedAt: new Date() }
				: msg,
		),
	}));
}

export function deleteMessage(id) {
	useStore.setState((state) => ({
		messages: state.messages.filter((msg) => msg.id !== id),
	}));
}

function truncateMessagesAfter(id, exclude = false) {
	const messages = useStore.getState().messages;
	const index = messages.findIndex((msg) => msg.id === id);
	const sliceEnd = exclude ? index : index + 1;
	useStore.setState((state) => ({
		messages: state.messages.slice(0, sliceEnd),
	}));
}

export function changeModel(modelName) {
	useStore.setState(() => ({
		model: modelName,
	}));
}
