import { useState, useRef, useEffect } from "react";

import prettier from "https://cdn.jsdelivr.net/npm/prettier@3.5.3/+esm";
import parserBabel from "https://cdn.jsdelivr.net/npm/prettier@3.5.3/plugins/babel/+esm";
import pluginEstree from "https://cdn.jsdelivr.net/npm/prettier@3.5.3/plugins/estree/+esm";

import parserToml from "https://cdn.jsdelivr.net/npm/prettier-plugin-toml@2.0.2/+esm";

import CodeEditor from "@/components/editor";
import { Button } from "@/components/button";

import { useMemo } from "react";
import { addItem, updateItem } from "./actions";
import { AlertDialog, useModalStore } from "@/components/modal";
import { useStore } from "@/lib/store";
import { useCallback } from "react";

export const Editor = ({ id, library }) => {
	const lib = useStore((state) => state[library.name]);
	const item = lib.find((item) => item.id === id);

	const openModal = useModalStore((state) => state.openModal);
	const closeModal = useModalStore((state) => state.closeModal);
	const inputRef = useRef();

	const [content, setContent] = useState(item?.content || "");
	const [name, setName] = useState(
		item?.name || `New ${library.name.slice(0, -1)}`,
	);
	const [errors, setErrors] = useState([]);

	const isChanged = useMemo(() => {
		return !item || (item && (item.name !== name || item.content !== content));
	}, [name, content, lib]);

	const canSave = useMemo(() => {
		return (
			name.trim().length > 0 &&
			content.trim().length > 0 &&
			errors.filter((err) => err.type === "error").length === 0 &&
			isChanged
		);
	});

	const onFormat = useCallback(async () => {
		let formatted;
		switch (library.lang) {
			case "toml":
				formatted = await prettier.format(content, {
					parser: "toml",
					plugins: [parserToml],
				});
				setContent(formatted);
				break;
			case "javascript":
				formatted = await prettier.format(content, {
					parser: "babel",
					plugins: [parserBabel, pluginEstree],
					semi: true,
					singleQuote: false,
					tabWidth: 2,
				});
				setContent(formatted);
				break;
			default:
				break;
		}
	}, [library.lang, content]);

	function onSave() {
		try {
			if (!item) {
				addItem(name, content);
				closeModal();
			} else {
				if (item.name === name && item.content === content) {
					return;
				}
				updateItem(item.id, name, content);
			}
		} catch (e) {
			openModal(<AlertDialog title="Can't save" message={e.message} />);
		}
	}

	useEffect(() => {
		if (!item) {
			inputRef.current.focus();
			inputRef.current.select();
		}
	}, [inputRef.current, item]);

	return (
		<div
			className="flex flex-col max-w-[640px] min-w-[420px] w-full max-h-[calc(100%-24px)] h-full rs-bg-primary rounded-3xl border"
			onClick={(evt) => evt.stopPropagation()}
		>
			<div className="w-full h-[60px] border-b-[0.5px] grid grid-cols-[minmax(64px,100px)_minmax(0,1fr)_minmax(64px,100px)] content-center">
				<button
					className="justify-self-start w-full h-full"
					onClick={closeModal}
				>
					<div className="flex items-center justify-start ml-5 text-[17px] font-[400]">
						Close
					</div>
				</button>
				<div className="font-semibold justify-self-center w-full">
					<input
						ref={inputRef}
						type="text"
						className="w-full text-center outline-none font-[16px]"
						value={name}
						onClick={(evt) => evt.target.select()}
						onChange={(evt) => setName(evt.target.value)}
					/>
				</div>
				<button className="justify-self-start w-full h-full" onClick={onFormat}>
					<div className="flex items-center justify-start ml-5 text-[17px] font-[400]">
						Format
					</div>
				</button>
			</div>
			<div className="flex-grow">
				<CodeEditor
					lang={library.lang}
					code={content}
					onChange={setContent}
					onError={setErrors}
				/>
			</div>
			<div className="flex items-center p-6">
				<div className="flex-grow">
					<span className="text-gray-500">{library.lang}</span>
				</div>
				<Button onClick={onSave} disabled={!canSave}>
					Save
				</Button>
			</div>
		</div>
	);
};
