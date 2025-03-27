import { useStore } from "@/lib/store";
import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";
import fileSaver from "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/+esm";
import { ToolButton } from "./tool-button";

export const ExportButton = () => {
	const handleExport = () => {
		const exportObj = {
			messages: useStore.getState().messages,
			modules: useStore.getState().modules,
			configs: useStore.getState().configs,
		};

		const zip = new JSZip();
		// for messages
		for (const [index, message] of exportObj.messages.entries()) {
			zip.folder("messages").file(`${index}.json`, JSON.stringify(message), {
				date: new Date(Date.parse(message.updatedAt)),
			});
		}

		// for modules
		for (const module of exportObj.modules) {
			zip.folder("modules").file(`${module.name}.js`, module.content, {
				date: new Date(Date.parse(module.updatedAt)),
			});
		}
		// for configs
		for (const config of exportObj.configs) {
			zip.folder("configs").file(`${config.name}.toml`, config.content, {
				date: new Date(Date.parse(config.updatedAt)),
			});
		}

		zip
			.generateAsync({ type: "blob" })
			.then((content) => {
				fileSaver.saveAs(content, "rs_template.zip");
			})
			.catch((e) => console.error(e));
	};

	return (
		<ToolButton label="Export" onClick={handleExport}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				width={20}
				height={20}
				fill={"none"}
			>
				<path
					d="M19 14V9L12 2H5C3.89543 2 3 2.89543 3 4V20C3 21.1046 3.89543 22 5 22H10"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M12 2V7C12 8.10457 12.8954 9 14 9H19"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinejoin="round"
				/>
				<path
					d="M16 22L19 19L16 16M11 19H18.3912"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</ToolButton>
	);
};
