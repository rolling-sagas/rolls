import { memo, useMemo, useCallback } from "react";
import { useStore } from "@/lib/store";
import { useModalStore } from "@/components/modal";
import {
	DropdownMenu,
	DropdownTrigger,
	DropdownContent,
	DropdownItem,
	DropdownIcon,
} from "@/components/dropdown-menu";
import { AlertDialog } from "@/components/modal";
import { Content } from "./content";
import { Editor } from "./editor";
import {
	deleteMessage,
	getLastAvatar,
	regenerate,
	restartFromId,
} from "./actions";
import { UpdatedAt } from "@/components/updated-at";

// Avatar component for message header
const MessageAvatar = ({ displayRole }) => (
	<div className="pt-1 row-start-1 col-start-1 row-end-[span_2] relative">
		<div className="rounded-full w-[36px] h-[36px] border-[0.5px] flex items-center justify-center">
			<span className="font-bold text-lg capitalize">{displayRole?.[0]}</span>
		</div>
	</div>
);

// Header component for message metadata
const MessageHeader = ({ displayRole, updatedAt }) => (
	<div className="flex items-center gap-3">
		<div className="font-semibold capitalize">{displayRole}</div>
		<div className="rs-text-secondary">
			<UpdatedAt timestamp={updatedAt} />
		</div>
	</div>
);

// Dropdown menu component
const MessageActions = ({
	playMode,
	role,
	onEdit,
	onDelete,
	onRestart,
	onRegenerate,
}) => (
	<DropdownMenu>
		<DropdownTrigger>
			<DropdownIcon />
		</DropdownTrigger>
		<DropdownContent>
			{!playMode && <DropdownItem onClick={onEdit}>Edit</DropdownItem>}
			{!playMode && <DropdownItem onClick={onDelete}>Delete</DropdownItem>}
			<DropdownItem onClick={onRestart}>Restart from here</DropdownItem>
			{role === "assistant" && (
				<DropdownItem onClick={onRegenerate}>Regenerate</DropdownItem>
			)}
		</DropdownContent>
	</DropdownMenu>
);

export const Item = memo(({ ref, id, role, content, updatedAt, status }) => {
	const playMode = useStore((state) => state.playMode);
	const openModal = useModalStore((state) => state.openModal);

	const displayRole = useMemo(() => {
		const avatar = getLastAvatar(id, role);
		return avatar ? avatar.name : role;
	}, [id, role]);

	const handleDelete = useCallback(() => {
		openModal(
			<AlertDialog
				continueLabel="Delete"
				title="Delete message?"
				message="If you delete this message, you won't be able to restore it."
				onContinue={() => deleteMessage(id)}
			/>,
		);
	}, [id, openModal]);

	const handleEdit = useCallback(() => {
		openModal(<Editor message={{ id, role, content, updatedAt }} />);
	}, [id, role, content, updatedAt, openModal]);

	const handleRestart = useCallback(() => {
		openModal(
			<AlertDialog
				title="Restart from here?"
				message="The messages below will be deleted permanently."
				onContinue={async () => {
					try {
						await restartFromId(id);
					} catch (error) {
						openModal(
							<AlertDialog message={error.message} title="Restart failed" />,
						);
					}
				}}
			/>,
		);
	}, [id, role, content, updatedAt, openModal]);

	const handleRegenerate = useCallback(() => {
		openModal(
			<AlertDialog
				title="Regenerate message?"
				message="The messages below will be deleted permanently."
				onContinue={async () => {
					try {
						await regenerate(id);
					} catch (error) {
						console.error(error);
						openModal(
							<AlertDialog message={error.message} title="Regenerate failed" />,
						);
					}
				}}
			/>,
		);
	}, [id, openModal]);

	// Early returns for special cases
	if (role === "system" && playMode)
		return <div ref={ref} className="hidden" />;

	if (!role) {
		return (
			<div ref={ref} className="bg-red-500 text-white px-4 py-3">
				Invalid message role: {role} - {id}
			</div>
		);
	}

	if (role === "divider") {
		return (
			<div
				ref={ref}
				className="relative border-b-[0.5px] px-4 py-3 flex items-center justify-center font-semibold"
			>
				<div>{content}</div>
				<div className="absolute right-6">
					<DropdownMenu>
						<DropdownTrigger>
							<DropdownIcon />
						</DropdownTrigger>
						<DropdownContent>
							{!playMode && (
								<DropdownItem onClick={handleEdit}>Edit</DropdownItem>
							)}
							{!playMode && (
								<DropdownItem onClick={handleDelete}>Delete</DropdownItem>
							)}
							<DropdownItem onClick={handleRestart}>
								Restart from here
							</DropdownItem>
						</DropdownContent>
					</DropdownMenu>
				</div>
			</div>
		);
	}

	// Default message layout
	return (
		<div ref={ref} className="msg" data-message-id={id}>
			<div className="grid grid-cols-[48px_minmax(0,_1fr)]">
				<MessageAvatar displayRole={displayRole} />
				<div className="flex justify-between items-center col-start-2 row-start-1 h-[21px]">
					<MessageHeader displayRole={displayRole} updatedAt={updatedAt} />
					<MessageActions
						playMode={playMode}
						role={role}
						onEdit={handleEdit}
						onDelete={handleDelete}
						onRestart={handleRestart}
						onRegenerate={handleRegenerate}
					/>
				</div>
				<div className="row-start-2 col-start-2 outline-none w-full h-fit mt-1">
					<Content
						id={id}
						role={role}
						content={content}
						updatedAt={updatedAt}
						status={status}
					/>
				</div>
			</div>
		</div>
	);
});
