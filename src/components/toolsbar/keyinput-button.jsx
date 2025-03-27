import { useStore } from "@/lib/store";
import JSZip from "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm";
import fileSaver from "https://cdn.jsdelivr.net/npm/file-saver@2.0.5/+esm";
import { ToolButton } from "./tool-button";
import { useModalStore } from "@/components/modal";
import { useRef } from "react";

const saveKeys = (openai, deepseek, anthropic) => {
	useStore.setState({
		openai_api_key: openai,
		deepseek_api_key: deepseek,
		anthropic_api_key: anthropic,
	});
};

const KeyInputDialog = ({ onCancel }) => {
	const closeModal = useModalStore((state) => state.closeModal);
	const formRef = useRef(null);

	const openai = useStore((state) => state.openai_api_key);
	const deepseek = useStore((state) => state.deepseek_api_key);
	const anthropic = useStore((state) => state.anthropic_api_key);

	const onSave = () => {
		const form = formRef.current;
		if (!form) return;

		const formData = new FormData(form);
		const formObject = Object.fromEntries(formData.entries());
		saveKeys(formObject.openai, formObject.deepseek, formObject.anthropic);

		closeModal();
	};

	return (
		<div
			className="rs-bg-primary z-50 w-full max-w-[480px] rounded-3xl flex flex-col border-[0.5px] rs-outline-column"
			onClick={(evt) => evt.stopPropagation()}
		>
			<div className="h-[60px] w-full items-center flex justify-center font-bold text-[16px] px-6 pt-6">
				<div className="mb-4">Input Your API Keys</div>
			</div>
			<form
				className="min-h-[60px] w-full items-start flex flex-col justify-center rs-text-charcoal px-6 pb-6 text-center"
				ref={formRef}
			>
				<label className="text-xs rs-text-charcoal mb-2">
					OpenAI (gpt-4o-mini)
				</label>
				<input
					type="text"
					name="openai"
					defaultValue={openai}
					placeholder="Enter your OpenAI API key"
					className="w-full border-[0.5px] rs-outline-primary px-3 py-2 rounded-xl outline-none mb-4"
				/>
				<label className="text-xs rs-text-charcoal mb-2">
					Deepseek (deepseek-v3)
				</label>
				<input
					type="text"
					name="deepseek"
					defaultValue={deepseek}
					placeholder="Enter your Deepseek API key"
					className="w-full border-[0.5px] rs-outline-primary px-3 py-2 rounded-xl outline-none mb-4"
				/>
				<label className="text-xs rs-text-charcoal mb-2">
					Anthropic (claude-3.5-sonnet)
				</label>
				<input
					type="text"
					name="anthropic"
					defaultValue={anthropic}
					placeholder="Enter your Anthropic API key"
					className="w-full border-[0.5px] rs-outline-primary px-3 py-2 rounded-xl outline-none mb-4"
				/>
			</form>
			<div className="border-t flex min-h-[60px] h-full text-lg">
				<div
					className="flex-1 not-last:border-r flex items-center justify-center cursor-pointer"
					onClick={closeModal}
				>
					Cancel
				</div>
				<div
					className="flex-1 flex items-center justify-center font-bold cursor-pointer"
					onClick={onSave}
				>
					Save
				</div>
			</div>
		</div>
	);
};

export const KeyInputButton = () => {
	const openModal = useModalStore((state) => state.openModal);
	const handleEdit = () => {
		openModal(<KeyInputDialog />);
	};

	return (
		<ToolButton label="API Key" onClick={handleEdit}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				width={20}
				height={20}
				fill={"none"}
			>
				<path
					d="M15.5 14.5C18.8137 14.5 21.5 11.8137 21.5 8.5C21.5 5.18629 18.8137 2.5 15.5 2.5C12.1863 2.5 9.5 5.18629 9.5 8.5C9.5 9.38041 9.68962 10.2165 10.0303 10.9697L3.08579 17.9142C2.71071 18.2893 2.5 18.798 2.5 19.3284V21.5H5.5V19.5H7.5V17.5H9.5L13.0303 13.9697C13.7835 14.3104 14.6196 14.5 15.5 14.5Z"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M17.5 6.5L16.5 7.5"
					stroke="currentColor"
					strokeWidth="1.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</ToolButton>
	);
};
