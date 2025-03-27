import { useRef, useEffect, useMemo, useState, useCallback } from "react";

import {
	ColumnBody,
	ColumnHeader,
	Column,
	RightDropdownMenu,
} from "@/components/columns";
import { useStore } from "@/lib/store";
import {
	DropdownItem,
	DropdownDivider,
	DropdownCheckboxItem,
} from "@/components/dropdown-menu";
import { useModalStore, AlertDialog } from "@/components/modal";
import { Item } from "./item";
import { Editor } from "./editor";
import {
	restart,
	initializeSandbox,
	getLastDivider,
	changeModel,
} from "./actions";
import { models } from "@/lib/ai/index";

import "./index.css";
import { ArrowDown } from "../logo";

// hooks/useScrollManagement.js
const useScrollManagement = (scrollContainerRef, messagesEndRef) => {
	const [isAtBottom, setIsAtBottom] = useState(true);

	const scrollToBottom = useCallback(() => {
		if (messagesEndRef.current) {
			messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, []);

	const checkScrollPosition = useCallback(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const isBottom =
			container.scrollHeight - container.scrollTop - container.clientHeight < 1;
		setIsAtBottom(isBottom);
	}, []);

	return { isAtBottom, scrollToBottom, checkScrollPosition };
};

// hooks/useMessageHeight.js
const useMessageHeight = (lastMessageRef, secondLastMessageRef, messages) => {
	useEffect(() => {
		if (lastMessageRef.current && secondLastMessageRef.current) {
			const adjustLastMessageHeight = () => {
				const screenHeight = window.innerHeight;
				const secondLastMessageHeight =
					secondLastMessageRef.current.offsetHeight;
				const newHeight = screenHeight - secondLastMessageHeight;

				lastMessageRef.current.style.minHeight = `${Math.max(newHeight - 68, 0)}px`;
			};

			adjustLastMessageHeight();
		}
	}, [messages, lastMessageRef.current, secondLastMessageRef.current]);
};

// components/MessageHeader.jsx
const MessageHeader = ({
	title,
	playMode,
	modelName,
	onRestart,
	openModal,
}) => (
	<ColumnHeader>
		<RightDropdownMenu>
			<DropdownItem onClick={onRestart}>Restart</DropdownItem>
			{!playMode && (
				<DropdownItem onClick={() => openModal(<Editor />)}>
					Create
				</DropdownItem>
			)}
			<DropdownDivider />
			{models.map((model) => (
				<DropdownCheckboxItem
					onClick={() => changeModel(model.name)}
					checked={model.name === modelName}
					key={model.name}
				>
					{model.name}
				</DropdownCheckboxItem>
			))}
		</RightDropdownMenu>
		<span>{title}</span>
	</ColumnHeader>
);

// components/ScrollToBottomButton.jsx
const ScrollToBottomButton = ({ onClick }) => (
	<button
		onClick={onClick}
		className="absolute bottom-4 left-[calc(50%+24px)] rs-bg-secondary rs-text-secondary border-[0.5px] rs-outline-column p-1 rounded-full shadow transition-colors text-sm font-semibold"
	>
		<ArrowDown size={20} />
	</button>
);

// Messages.jsx
const Messages = () => {
	const messages = useStore((state) => state.messages);
	const messagesLength = useStore((state) => state.messages.length);
	const playMode = useStore((state) => state.playMode);
	const modules = useStore((state) => state.modules);
	const configs = useStore((state) => state.configs);
	const modelName = useStore((state) => state.model);
	const openModal = useModalStore((state) => state.openModal);

	const scrollContainerRef = useRef(null);
	const messagesEndRef = useRef(null);
	const messagesContainerRef = useRef(null);
	const secondLastMessageRef = useRef(null);
	const lastMessageRef = useRef(null);

	const { isAtBottom, scrollToBottom, checkScrollPosition } =
		useScrollManagement(scrollContainerRef, messagesEndRef);

	useMessageHeight(lastMessageRef, secondLastMessageRef, messages);

	useEffect(() => {
		scrollToBottom();
	}, [messagesLength, scrollToBottom]);

	const onRestart = useCallback(() => {
		openModal(
			<AlertDialog
				title="Are you sure?"
				message="If you restart the game, you will remove all messages here."
				onContinue={async () => {
					try {
						await restart();
					} catch (e) {
						openModal(<AlertDialog title={e.title} message={e.message} />);
					}
				}}
			/>,
		);
	}, [openModal]);

	const title = useMemo(() => {
		if (messages?.length > 0) {
			const content = getLastDivider(messages[messages.length - 1].id);
			if (content) return content;
		}
		return "messages";
	}, [messages]);

	useEffect(() => {
		initializeSandbox(modules, configs);
	}, [modules, configs]);

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (container) {
			container.addEventListener("scroll", checkScrollPosition);
			return () => container.removeEventListener("scroll", checkScrollPosition);
		}
	}, [checkScrollPosition]);

	useEffect(() => {
		if (!messagesContainerRef.current) return;
		const resizeObserver = new ResizeObserver(checkScrollPosition);
		resizeObserver.observe(messagesContainerRef.current);
		return () => resizeObserver.disconnect();
	}, [checkScrollPosition]);

	return (
		<Column>
			<MessageHeader
				title={title}
				playMode={playMode}
				modelName={modelName}
				onRestart={onRestart}
				openModal={openModal}
			/>
			<ColumnBody>
				<div className="relative w-full h-full">
					<div
						className="w-full h-full overflow-y-auto pt-1 pb-2"
						ref={scrollContainerRef}
					>
						<div className="flex flex-col" ref={messagesContainerRef}>
							{messages.map((msg, index) => (
								<Item
									key={msg.id}
									{...msg}
									ref={
										index === messages.length - 2
											? secondLastMessageRef
											: index === messages.length - 1
												? lastMessageRef
												: null
									}
								/>
							))}
						</div>
						<div className="block" ref={messagesEndRef} />
					</div>
					{!isAtBottom && <ScrollToBottomButton onClick={scrollToBottom} />}
				</div>
			</ColumnBody>
		</Column>
	);
};

export default Messages;
