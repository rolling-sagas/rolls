import { useState } from "react";
import CodeEditor from "@/components/editor";
import { useModalStore } from "@/components/modal";
import {
	DropdownContent,
	DropdownMenu,
	DropdownItem,
	DropdownTrigger,
} from "@/components/dropdown-menu";

import { Button } from "@/components/button";

import { useMemo } from "react";
import { addMessage, generateFromId, updateMessage } from "./actions";
import { useStore } from "@/lib/store";

export const Editor = ({ message }) => {
	const playMode = useStore((state) => state.playMode);
	const closeModal = useModalStore((state) => state.closeModal);

	const [content, setContent] = useState(message?.content || "");
	const [role, setRole] = useState(message?.role || "user");
	const [errors, setErrors] = useState([]);

	const lang = useMemo(() => {
		if (message?.role === "assistant") {
			return "json";
		}
		return "plain_text";
	});

	const canSave = useMemo(() => {
		return (
			content.trim().length > 0 &&
			errors.filter((err) => err.type === "error").length === 0
		);
	});

	async function onSave() {
		closeModal();

		if (!message) {
			const newMessageId = addMessage(role, content);
			await generateFromId(newMessageId);
		} else {
			if (message.content === content && message.role === role) {
				return;
			}
			updateMessage(message.id, role, content);
			if (message.role === "user" || message.role === "system") {
				await generateFromId(message.id);
			}
		}
	}

	return (
		<div
			className="flex flex-col max-w-[640px] min-w-[420px] w-full max-h-[calc(100%-24px)] h-full rs-bg-primary rounded-3xl border"
			onClick={(evt) => evt.stopPropagation()}
		>
			<div className="w-full h-[60px] border-b-[0.5px] rs-outline-column text-lg grid grid-cols-[minmax(64px,100px)_minmax(0,1fr)_minmax(64px,100px)] content-center">
				<button className="justify-self-start " onClick={closeModal}>
					<div className="flex items-center justify-start ml-5">Cancel</div>
				</button>
				<div className="font-semibold justify-self-center">
					{message ? "Edit message" : "New message"}
				</div>
				<div className="justify-self-center">
					{!playMode ? (
						<DropdownMenu offsetY={12}>
							<DropdownTrigger className="flex items-center justify-end mr-5">
								<span className="rounded-lg text-lg capitalize cursor-pointer underline">
									{role}
								</span>
							</DropdownTrigger>
							<DropdownContent>
								{["system", "user", "assistant"].map((value) => (
									<DropdownItem onClick={() => setRole(value)} key={value}>
										<span className="capitalize flex-grow">{value}</span>
									</DropdownItem>
								))}
							</DropdownContent>
						</DropdownMenu>
					) : (
						<span className="text-lg capitalize cursor-default">{role}</span>
					)}
				</div>
			</div>
			<div className="flex-grow">
				<CodeEditor
					lang={lang}
					code={content}
					onChange={setContent}
					onError={setErrors}
				/>
			</div>
			<div className="flex items-center p-6">
				<div className="flex-grow">
					<span className="text-gray-500">{lang}</span>
				</div>
				<Button onClick={onSave} disabled={!canSave}>
					Save
				</Button>
			</div>
		</div>
	);
};
