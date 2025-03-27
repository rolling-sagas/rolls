import { create } from "zustand";
import { createPortal } from "react-dom";
import { useEffect } from "react";

// Create Zustand store
export const useModalStore = create((set) => ({
	modals: [],
	openModal: (content) =>
		set((state) => ({
			modals: [...state.modals, { content }],
		})),
	closeModal: () =>
		set((state) => ({
			modals: state.modals.slice(0, -1),
		})),
	closeModalAt: (index) =>
		set((state) => ({
			modals: state.modals.filter((_, i) => i !== index),
		})),
	isOpen: false, // Will be derived from modals length
}));

// ModalProvider is no longer needed, but if you want to keep a wrapper component:
export function ModalProvider({ children }) {
	return children;
}

// AlertDialog remains largely the same, just uses Zustand hook
export const AlertDialog = ({
	title,
	message,
	cancelLabel = "Cancel",
	continueLabel = "Continue",
	onContinue,
}) => {
	const closeModal = useModalStore((state) => state.closeModal);

	return (
		<div
			className="rs-bg-primary z-50 w-full max-w-[280px] rounded-3xl flex flex-col border-[0.5px] rs-outline-column"
			onClick={(evt) => evt.stopPropagation()}
		>
			<div className="h-[60px] w-full items-center flex justify-center font-bold text-[16px] px-6 pt-6">
				<div className="mb-4">{title}</div>
			</div>
			<div className="min-h-[60px] w-full items-start flex justify-center rs-text-charcoal px-6 pb-6 text-center">
				{message}
			</div>
			<div className="border-t flex min-h-[60px] h-full text-lg">
				<div
					className="flex-1 not-last:border-r flex items-center justify-center cursor-pointer"
					onClick={closeModal}
				>
					{cancelLabel}
				</div>
				{onContinue && (
					<div
						className="flex-1 flex items-center justify-center font-bold text-red-500 cursor-pointer"
						onClick={() => {
							closeModal();
							onContinue();
						}}
					>
						{continueLabel}
					</div>
				)}
			</div>
		</div>
	);
};

// Remove useModal hook since we use the store directly
// Access store directly where needed with useModalStore

export function Modal() {
	const { modals, closeModal, closeModalAt } = useModalStore((state) => ({
		modals: state.modals,
		closeModal: state.closeModal,
		closeModalAt: state.closeModalAt,
	}));

	useEffect(() => {
		const handleEscape = (event) => {
			if (event.key === "Escape") {
				closeModal();
			}
		};

		if (modals.length > 0) {
			document.addEventListener("keydown", handleEscape);
			document.body.style.overflow = "hidden";
		}

		return () => {
			document.removeEventListener("keydown", handleEscape);
			if (modals.length === 0) {
				document.body.style.overflow = "unset";
			}
		};
	}, [modals.length, closeModal]);

	if (modals.length === 0) return null;

	return createPortal(
		<>
			{modals.map((modal, index) => (
				<div
					key={index}
					className="fixed rs-bg-backdrop inset-0 flex items-center justify-center"
					onClick={() => closeModalAt(index)}
				>
					{modal.content}
				</div>
			))}
		</>,
		document.getElementById("root"),
	);
}
