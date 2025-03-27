import OpenAI from "https://cdn.jsdelivr.net/npm/openai@4.89.0/+esm";

export default async function generate() {
	const client = new OpenAI({
		apiKey: process.env["OPENAI_API_KEY"], // This is the default and can be omitted
	});
}
