export class SandboxError extends Error {
	constructor({ message, stack }) {
		super(message);

		this.type = "SandboxError";
		this.title = "Sandbox Executing Error";
		this.message = message;
		this.stack = stack;
	}
}
