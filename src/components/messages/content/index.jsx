import { memo, useMemo } from "react";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/logo";
import AssistantContent from "./assistant";
import Markdown from "https://cdn.jsdelivr.net/npm/marked-react@3.0.0/+esm";

// User Content Line Renderer
const UserContentLine = ({ line }) => {
	const playMode = useStore((state) => state.playMode);
	if (line.startsWith("PLAYER: ")) {
		return <Markdown>{line.substring(8)}</Markdown>;
	}

	if (line.startsWith("ROLL: ")) {
		return (
			<div className="block">
				<span className="inline-block relative">
					<Logo size={16} className="absolute -top-[14px] left-[0px]" />
				</span>
				<span className="ml-6 font-semibold">{line.substring(6)}</span>
			</div>
		);
	}

	if (line.startsWith("IGNORE: ")) {
		return (
			<div className="rs-text-secondary">
				<Markdown>{line.substring(8)}</Markdown>
			</div>
		);
	}

	if (line.startsWith("HINT: ")) {
		if (playMode) return null;
		return <div className="rs-text-secondary line-clamp-3">{line.substring(6)}</div>;
	}

	return <div>{line}</div>;
};

// User Content Wrapper
const UserContent = ({ content }) => {
	const lines = useMemo(
		() => content.split("\n").map((l) => l.trim()),
		[content],
	);

	return (
		<div className="flex flex-col gap-2">
			{lines.map((line, index) => (
				<UserContentLine key={index} line={line} />
			))}
		</div>
	);
};

// Main Content Component
export const Content = memo(({ id, role, content, status }) => {
	switch (role) {
		case "system":
			return <div className="line-clamp-5">{content}</div>;

		case "user":
			return <UserContent content={content} />;

		case "assistant":
			return <AssistantContent id={id} content={content} status={status} />;

		default:
			return null;
	}
});
