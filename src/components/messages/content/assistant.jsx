import { useModalStore, AlertDialog } from "@/components//modal";
import { parse } from "best-effort-json-parser";
import { useCallback, useMemo, memo } from "react";
import { submit, recover } from "@/components/messages/actions";

import {
	ButtonContent,
	ImageContent,
	InputContent,
	RollContent,
	SelectContent,
	TextContent,
} from "./assistant-templates";

// Status Badge Component
const StatusBadge = ({ status }) => {
	if (!["loading", "generating"].includes(status)) return null;

	return (
		<div className="rs-text-secondary text-sm font-semibold border-[0.5px] rounded w-fit px-2 py-1 capitalize mt-2">
			{status}
		</div>
	);
};

// Error Display Component
const ErrorDisplay = ({ error }) => (
	<div className="mt-4 rounded-[12px] border border-red-400 text-red-400 px-2 py-3 font-semibold">
		{error}
	</div>
);

const AssistantContent = memo(({ id, content, status }) => {
	const openModal = useModalStore((state) => state.openModal);

	const handleSubmit = useCallback(
		async (formData) => {
			if (status !== "finished") return;
			const formObject = Object.fromEntries(formData);
			try {
				await submit(formObject);
			} catch (error) {
				console.error(error);
				openModal(
					<AlertDialog
						title="Submit failed"
						message={error.message}
						onContinue={async () => await recover()}
					/>,
				);
			}
		},
		[openModal, status],
	);

	const parsedContent = useMemo(() => {
		try {
			const cleanContent = content
				.replace(/^```json/g, "")
				.replace(/```$/g, "");
			return parse(cleanContent);
		} catch (error) {
			console.warn("Invalid JSON:", error);
			return null;
		}
	}, [content]);

	if (parsedContent?.error) {
		return <ErrorDisplay error={parsedContent.error} />;
	}

	return (
		<>
			{parsedContent?.views && parsedContent.views?.length > 0 && (
				<div className="flex flex-col gap-2 mt-2">
					<form action={handleSubmit} className="msg-content">
						{parsedContent.views.map((content, idx) => {
							const key = id + ":" + idx;
							if (content.type === "text") {
								return <TextContent key={key} content={content} />;
							}
							if (content.type === "input") {
								return <InputContent key={key} content={content} />;
							}
							if (content.type === "select") {
								return <SelectContent key={key} content={content} />;
							}
							if (content.type === "image") {
								return <ImageContent key={key} content={content} />;
							}
							if (content.type === "button") {
								return <ButtonContent key={key} content={content} />;
							}
							if (content.type === "roll") {
								return <RollContent key={key} content={content} />;
							}
						})}
					</form>
				</div>
			)}
			<StatusBadge status={status} />
		</>
	);
});

export default AssistantContent;
