import { useStore } from "@/lib/store";
import { AlertDialog, useModalStore } from "@/components/modal";
import { nanoid } from "nanoid";
import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";
import { ToolButton } from "./tool-button";
import { toast } from "sonner";

export const ImportButton = () => {
	const openModal = useModalStore((state) => state.openModal);

	function handleImport() {
		const el = document.getElementById("uploadInputElem");
		el.addEventListener("change", (evt) => {
			const file = evt.target.files[0];
			openModal(
				<AlertDialog
					title="Are you sure?"
					message="Importing this file will overwrite all content and cannot be undone."
					onContinue={async () => {
						useStore.setState({
							messages: [],
							modules: [],
							configs: [],
							sandbox: null,
						});
						if (file?.name.endsWith(".json")) {
							const fr = new FileReader();
							fr.onload = function (e) {
								var result = JSON.parse(e.target.result);
								useStore.setState(() => ({
									messages: result.messages,
									templates: result.templates,
									modules: result.modules,
									configs: result.configs,
								}));
							};
							fr.readAsText(file);
						} else if (file?.name.endsWith(".zip")) {
							try {
								const zip = new JSZip();
								const contents = await zip.loadAsync(file);

								const messages = [];
								const modules = [];
								const configs = [];
								// Read files inside zip
								for (const [relativePath, zipEntry] of Object.entries(
									contents.files,
								)) {
									if (zipEntry.dir) continue;
									const content = await zipEntry.async("text");
									if (
										relativePath.includes("messages") &&
										relativePath.endsWith(".json")
									) {
										const obj = JSON.parse(content);
										messages.push({
											id: nanoid(),
											updatedAt: zipEntry.date,
											...obj,
										});
									} else if (
										relativePath.includes("modules") &&
										relativePath.endsWith(".js")
									) {
										// strip the file extension and folder
										const fileName = relativePath
											.split("/")
											.pop()
											.split(".")[0];
										modules.push({
											id: nanoid(),
											name: fileName,
											content: content,
											updatedAt: zipEntry.date,
										});
									} else if (
										relativePath.includes("configs") &&
										relativePath.endsWith(".toml")
									) {
										const fileName = relativePath
											.split("/")
											.pop()
											.split(".")[0];
										configs.push({
											id: nanoid(),
											name: fileName,
											content: content,
											updatedAt: zipEntry.date,
										});
									}
								}

								useStore.setState({
									messages: messages,
									modules: modules,
									configs: configs,
									library: "modules",
								});
							} catch (e) {
								toast.error(e.message);
							}
						}
					}}
				/>,
			);
		});
		el.click();
	}

	return (
		<ToolButton label="Import" onClick={handleImport}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				width={20}
				height={20}
				fill={"none"}
			>
				<path
					d="M19 15V9L12 2H5C3.89543 2 3 2.89543 3 4V20C3 21.1046 3.89543 22 5 22H9"
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
					d="M14 22L11 19L14 16M19 19H11.6088"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</ToolButton>
	);
};
