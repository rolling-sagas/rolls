import { useStore } from "../store";
import OpenAI from "https://cdn.jsdelivr.net/npm/openai@4.89.0/+esm";
import Anthropic from "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.39.0/+esm";

export class LlmStreamError extends Error {
	constructor(message) {
		super(message);
	}
}

export const models = [
	{ name: "GPT-4o Mini", provider: "openai", value: "gpt-4o-mini" },
	{ name: "DeepSeek v3", provider: "deepseek", value: "deepseek-chat" },
	{
		name: "Claude 3.5 Haiku",
		provider: "anthropic",
		value: "claude-3-5-haiku-latest",
	},
];

const TIMEOUT_DURATION = 30000; // 30 seconds timeout duration

export async function stream(messages, onMessage, skipCache) {
	const modelName = useStore.getState().model;
	const model = models.find((model) => model.name === modelName);
	if (!model) {
		throw new LlmStreamError(`Model not found: ${modelName}`);
	}

	const key = useStore.getState()[`${model.provider}_api_key`].trim();
	if (!key) {
		throw new LlmStreamError(
			`API key not found for ${model.provider}, Add it in the key list`,
		);
	}

	const filtered = filterMessages(messages);
	switch (model.provider) {
		case "openai":
			await streamWithTimeout(() =>
				streamOpenAI(filtered, onMessage, key, model.value),
			);
			break;
		case "deepseek":
			await streamWithTimeout(() =>
				streamDeepSeek(filtered, onMessage, key, model.value),
			);
			break;
		case "anthropic":
			await streamWithTimeout(() =>
				streamAnthropic(filtered, onMessage, key, model.value),
			);
			break;
		default:
			throw new LlmStreamError(`Model provider not found: ${model.provider}`);
	}
}

function filterMessages(messages) {
	return messages.map((msg) => {
		let content = msg.content;
		if (msg.role === "user") {
			const lines = content.split("\n");
			const newLines = lines.map((line) => {
				if (line.startsWith("IGNORE: ")) {
					return "";
				}
				return line;
			});
			content = newLines.join("\n");
		}
		return { role: msg.role, content };
	});
}

async function streamWithTimeout(streamFunction) {
	return await Promise.race([
		streamFunction(),
		new Promise((_, reject) =>
			setTimeout(
				() =>
					reject(
						new LlmStreamError(
							`Streaming took longer than ${TIMEOUT_DURATION / 1000} seconds.`,
						),
					),
				TIMEOUT_DURATION,
			),
		),
	]);
}

async function streamOpenAI(messages, onMessage, key, model) {
	const client = new OpenAI({ apiKey: key, dangerouslyAllowBrowser: true });

	try {
		const stream = await client.responses.create({
			model,
			input: messages,
			stream: true,
			text: { format: { type: "json_object" } },
		});

		for await (const event of stream) {
			switch (event.type) {
				case "response.output_text.delta":
					onMessage(event.delta);
					break;
				case "error" || "response.error":
					throw new LlmStreamError(event.code + ": " + event.message);
				case "response.failed":
					throw new LlmStreamError("Response failed");
			}
		}
	} catch (error) {
		console.error(error);
		throw error;
	}
}

async function streamDeepSeek(messages, onMessage, key, model) {
	const client = new OpenAI({
		baseURL: "https://api.deepseek.com",
		apiKey: key,
		dangerouslyAllowBrowser: true,
	});

	try {
		const stream = await client.responses.create({
			model,
			input: messages,
			stream: true,
			text: { format: { type: "json_object" } },
		});

		for await (const event of stream) {
			switch (event.type) {
				case "response.output_text.delta":
					onMessage(event.delta);
					break;
				case "error" || "response.error":
					throw new LlmStreamError(event.code + ": " + event.message);
				case "response.failed":
					throw new LlmStreamError("Response failed");
			}
		}
	} catch (error) {
		console.error(error);
		throw error;
	}
}

async function streamAnthropic(messages, onMessage, key, model) {
	const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });

	messages = messages.map((msg) =>
		msg.role === "system" ? { ...msg, role: "user" } : msg,
	);

	try {
		const stream = await client.messages.create({
			messages,
			max_tokens: 4096,
			model,
			stream: true,
		});

		for await (const event of stream) {
			if (event.type === "content_block_delta") {
				onMessage(event.delta.text);
			}
			if (event.error) {
				throw new LlmStreamError(event.error.type + ": " + event.error.message);
			}
		}
	} catch (error) {
		console.error(error);
		throw error;
	}
}
