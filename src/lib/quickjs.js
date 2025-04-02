import variant from "https://cdn.jsdelivr.net/npm/@jitl/quickjs-singlefile-browser-release-sync@0.31.0/+esm";
import { newQuickJSWASMModuleFromVariant } from "https://cdn.jsdelivr.net/npm/quickjs-emscripten-core@0.31.0/+esm";
import Handlebars from "https://cdn.jsdelivr.net/npm/handlebars@4.7.8/+esm";
import { DiceRoll } from "https://cdn.jsdelivr.net/npm/@dice-roller/rpg-dice-roller@5.5.1/+esm";

import { parse } from "smol-toml";
import { isEntry } from "@/components/messages/actions";

export class ScriptEvalError extends Error {
	constructor({ name, message }) {
		super(message);
		this.name = name;
	}
}

export default class QuickJS {
	runtime;
	context;
	evalResult;

	constructor() {}

	// help function to set the global 'console.log'
	setupConsole(configs) {
		if (this.context === undefined) return;
		const ctx = this.context;
		const consoleHandle = ctx.newObject();

		Handlebars.registerHelper("withConfig", function (path, options) {
			let config = {};

			try {
				config = configs.find((conf) => conf.name === path);
				const parsed = parse(config.content);
				// Makes config available inside the block
				return options.fn(parsed);
			} catch (err) {
				throw new Error(`Error loading config at ${path}:` + err);
			}
		});

		Handlebars.registerHelper("eachKey", function (obj, options) {
			let result = "";
			for (const key in obj) {
				if (obj.hasOwnProperty(key)) {
					result += options.fn({ key: key, value: obj[key] });
				}
			}
			return result;
		});

		const log = ctx.newFunction("log", (...args) => {
			const nativeArgs = args.map((arg) => ctx.dump(arg));
			console.log("[QuickJS]", ...nativeArgs);
		});

		// load config from configs by name
		const loadConfig = ctx.newFunction("load", (name) => {
			const configName = ctx.dump(name);
			const config = configs.find((conf) => conf.name === configName);
			if (!config) {
				throw new ScriptEvalError({
					name: "Config Not Found",
					message: `Config not found: ${configName}, please check the config name.`,
				});
			}
			// parse the toml content
			const parsed = parse(config.content);
			return ctx.newString(JSON.stringify(parsed));
		});

		// render the message's content with handlebars
		const renderTemplate = ctx.newFunction("render", (content, data) => {
			const contentStr = ctx.dump(content);
			const dataObj = ctx.dump(data);
			const template = Handlebars.compile(contentStr);
			return ctx.newString(template(dataObj));
		});

		const rollDice = ctx.newFunction("roll", (content) => {
			const rollStr = ctx.dump(content);
			const roll = new DiceRoll(rollStr);
			const jsonString = roll.export();
			return ctx.newString(jsonString);
		});

		ctx.setProp(consoleHandle, "log", log);
		ctx.setProp(consoleHandle, "load", loadConfig);
		ctx.setProp(consoleHandle, "render", renderTemplate);
		ctx.setProp(consoleHandle, "roll", rollDice);
		ctx.setProp(ctx.global, "console", consoleHandle);

		log.dispose();
		rollDice.dispose();
		loadConfig.dispose();
		renderTemplate.dispose();
		consoleHandle.dispose();
	}

	async initial(scripts, configs) {
		this.destroy();

		const core = await newQuickJSWASMModuleFromVariant(variant);
		this.runtime = core.newRuntime();

		// set module loader
		this.runtime.setModuleLoader((scriptName) => {
			const script = scripts.find(
				(mod) => mod.name === scriptName.split("/").pop(),
			);
			if (!script) {
				throw new ScriptEvalError({
					name: "Script Not Found",
					message: `Script not found: ${scriptName}, please check the import script name.`,
				});
			}
			return script.content;
		});

		this.context = this.runtime.newContext();
		this.setupConsole(configs);
	}

	async run(scripts, configs) {
		await this.initial(scripts, configs);
		const entryModule = scripts.find((s) => isEntry(s.content));
		// console.log(entryModule);

		if (!entryModule) {
			throw new ScriptEvalError({
				name: "Entry Module Not Found",
				message: "Entry module not found, please set/create the entry module.",
			});
		}

		const execRes = this.context.evalCode(
			entryModule.content,
			entryModule.name + ".js",
			{
				type: "module",
			},
		);

		try {
			// no need to dispose the execRes if unwrapped
			const unwrapped = this.context.unwrapResult(execRes);
			this.evalResult = unwrapped;
			// console.log(this.context.dump(this.evalResult));
		} catch (e) {
			this.destroy();
			throw new ScriptEvalError({
				name: "Script Eval Error",
				message: e.message,
			});
		}
	}

	callMethod(fnName, data) {
		if (!this.context) {
			throw new ScriptEvalError({
				name: "Context Not Initialized",
				message: "Context not initialized, please run the script first.",
			});
		}

		if (!this.evalResult) {
			throw new ScriptEvalError({
				name: "Eval Result Not Found",
				message: "Eval result not found, please run the script first.",
			});
		}

		const scriptHandle = this.context.getProp(this.evalResult, "default");
		if (!this.context.dump(scriptHandle)) {
			scriptHandle.dispose();
			throw new ScriptEvalError({
				name: "Default Script Not Exported",
				message: "Default instance of the entry not exported",
			});
		}
		let dataHandle;
		try {
			if (data) {
				const dataStr = JSON.stringify(data);
				dataHandle = this.context.newString(dataStr);
			}
		} catch (e) {
			throw new ScriptEvalError({
				name: "JSON Data Parse Error",
				message: e.message,
			});
		}

		try {
			const callResult = dataHandle
				? this.context.callMethod(scriptHandle, fnName, [dataHandle])
				: this.context.callMethod(scriptHandle, fnName);
			// if there is an error in code eval,
			// the 'callResult' disposed automatically when you unwrap it
			const unwrapped = this.context.unwrapResult(callResult);
			const dumpedData = this.context.dump(unwrapped);
			callResult.dispose();
			return dumpedData;
		} catch (e) {
			if (e.message === "not a function") {
				throw new ScriptEvalError({
					name: "Method Not Found",
					message: `Method not found: ${fnName}`,
				});
			} else {
				throw new ScriptEvalError({
					name: "Method Call Error",
					message: e.message,
				});
			}
		} finally {
			if (dataHandle) dataHandle.dispose();
			scriptHandle.dispose();
		}
	}

	destroy() {
		if (this.runtime) {
			this.evalResult?.dispose();
			this.context?.dispose();
			this.runtime.dispose();

			this.context = undefined;
			this.evalResult = undefined;
			this.runtime = undefined;
		} else {
			// console.log("Already destroyed or not initialized");
		}
	}
}
