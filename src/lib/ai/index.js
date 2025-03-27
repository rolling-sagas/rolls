import { useStore } from "../store";
import OpenAI from "https://cdn.jsdelivr.net/npm/openai@4.89.0/+esm";
import Anthropic from "https://cdn.jsdelivr.net/npm/@anthropic-ai/sdk@0.39.0/+esm";

export const models = [
	{ name: "GPT-4o Mini", provider: "openai", value: "gpt-4o-mini" },
	{ name: "DeepSeek v3", provider: "deepseek", value: "deepseek-chat" },
	{
		name: "Claude 3.5 Haiku",
		provider: "anthropic",
		value: "claude-3-5-haiku-latest",
	},
];

export async function stream(messages, onMessage, skipCache) {
	const modelName = useStore.getState().model;
	const model = models.find((model) => model.name === modelName);
	if (!model) {
		throw { title: "Stream Error", message: `Model not found: ${modelName}` };
	}

	const key = useStore.getState()[`${model.provider}_api_key`].trim();
	if (!key) {
		throw {
			title: "Stream Error",
			message: `API key not found for ${model.provider}, Add it in the key list`,
		};
	}

	const filtered = filterMessages(messages);
	switch (model.provider) {
		case "openai":
			await streamOpenAI(filtered, onMessage, key, model.value);
			break;
		case "deepseek":
			await streamDeepSeek(filtered, onMessage, key, model.value);
			break;
		case "anthropic":
			await streamAnthropic(filtered, onMessage, key, model.value);
			break;
		default:
			throw {
				title: "Stream Error",
				message: `Model provider not found: ${model.provider}`,
			};
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

async function streamOpenAI(messages, onMessage, key, model) {
	const client = new OpenAI({
		apiKey: key, // This is the default and can be omitted
		dangerouslyAllowBrowser: true,
	});

	const runner = await client.beta.chat.completions.stream({
		model: model,
		messages: messages,
		stream: true,
		response_format: { type: "json_object" },
	});

	for await (const chunk of runner) {
		if (
			chunk.choices[0].delta.content &&
			chunk.choices[0].delta.content.trim()
		) {
			onMessage(chunk.choices[0].delta.content);
		}
	}
}

async function streamDeepSeek(messages, onMessage, key, model) {
	const client = new OpenAI({
		baseURL: "https://api.deepseek.com",
		apiKey: key, // This is the default and can be omitted
		dangerouslyAllowBrowser: true,
	});

	const runner = await client.beta.chat.completions.stream({
		model: model,
		messages: messages,
		stream: true,
		response_format: { type: "json_object" },
	});

	for await (const chunk of runner) {
		if (
			chunk.choices[0].delta.content &&
			chunk.choices[0].delta.content.trim()
		) {
			onMessage(chunk.choices[0].delta.content);
		}
	}
}

async function streamAnthropic(messages, onMessage, key, model) {
	const client = new Anthropic({
		apiKey: key,
		dangerouslyAllowBrowser: true,
	});

	// if message's role is SYSTEM, use user instead
	messages = messages.map((msg) => {
		if (msg.role === "system") {
			return { ...msg, role: "user" };
		}
		return msg;
	});

	const stream = await client.messages.create({
		messages: messages,
		max_tokens: 4096,
		model: model,
		stream: true,
	});

	for await (const event of stream) {
		if (event.type === "content_block_delta") {
			onMessage(event.delta.text);
		}
	}
}
