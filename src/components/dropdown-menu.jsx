import { useContext } from "react";
import { createContext } from "react";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowDown } from "./logo";

export const DropdownItem = ({ children, onClick }) => {
	const { setOpen } = useContext(context);
	return (
		<div
			className="m-[6px] p-3 h-[44px] hover:rs-bg-hovered rounded-[12px] flex items-center font-semibold z-100 cursor-pointer"
			onClick={(evt) => {
				setOpen(false);
				if (onClick) onClick(evt);
			}}
		>
			{children}
		</div>
	);
};

export const DropdownDivider = () => {
	return <div className="border-t-[0.5px] border-rs-border my-1 w-full" />;
};

export const DropdownCheckboxItem = ({ children, onClick, checked }) => {
	const { setOpen } = useContext(context);
	return (
		<div
			className="m-[6px] p-3 h-[44px] hover:rs-bg-hovered rounded-[16px] flex items-center font-semibold z-100 cursor-pointer"
			onClick={(evt) => {
				setOpen(false);
				if (onClick) onClick(evt);
			}}
		>
			<div className="flex-grow">{children}</div>
			<div className="flex-shrink">
				{checked ? (
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						width={20}
						height={20}
						fill={"none"}
					>
						<path
							fillRule="evenodd"
							clipRule="evenodd"
							d="M20.1757 5.26268C20.5828 5.63587 20.6103 6.26844 20.2372 6.67556L9.23715 18.6756C9.05285 18.8766 8.79441 18.9937 8.52172 18.9996C8.24903 19.0055 7.98576 18.8998 7.79289 18.7069L3.29289 14.2069C2.90237 13.8164 2.90237 13.1832 3.29289 12.7927C3.68342 12.4022 4.31658 12.4022 4.70711 12.7927L8.46859 16.5542L18.7628 5.32411C19.136 4.91699 19.7686 4.88948 20.1757 5.26268Z"
							fill="currentColor"
						/>
					</svg>
				) : (
					""
				)}
			</div>
		</div>
	);
};

const context = createContext();

export const DropdownTrigger = ({ children, className }) => {
	const { triggerRef, toggle } = useContext(context);
	return (
		<div ref={triggerRef} onClick={toggle} className={className}>
			{children}
		</div>
	);
};

export const DropdownContent = ({ children }) => {
	const { open, position, contentRef } = useContext(context);
	if (open)
		return createPortal(
			<div
				ref={contentRef}
				className={`absolute -mt-1 w-[240px] rs-bg-primary rounded-[16px] border-[0.5px]`}
				style={{ top: position.top, left: position.left }}
			>
				<div className="flex flex-col">{children}</div>
			</div>,
			document.getElementById("root"),
		);
};

export const ArrowDropdownIcon = () => {
	return (
		<div className="border rounded-full w-6 h-6 flex items-center justify-center p-0.5 cursor-pointer hover:scale-[110%] transition-[width_height] origin-center rs-bg-primary rs-text-charcoal">
			<ArrowDown />
		</div>
	);
};

export const DropdownIcon = () => {
	return (
		<div className="relative">
			<div className="hover:rs-bg-hovered hover:scale-[1.1] size-[32px] transition-[width_height] rounded-full cursor-pointer relative" />
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 24 24"
				className="w-5 h-5 absolute top-[6px] left-[6px] pointer-events-none"
			>
				<path
					d="M11.9922 12H12.0012"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M17.992 12H18.001"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
				<path
					d="M5.99981 12H6.00879"
					stroke="currentColor"
					strokeWidth="2.5"
					strokeLinecap="round"
					strokeLinejoin="round"
				/>
			</svg>
		</div>
	);
};

export const DropdownMenu = ({ children, offsetY = 0, offsetX = 0 }) => {
	const [open, setOpen] = useState(false);
	const [position, setPosition] = useState({ top: 0, left: 0 });

	const triggerRef = useRef(null);
	const contentRef = useRef(null);

	const updatePosition = () => {
		if (triggerRef.current && contentRef.current) {
			const triggerRect = triggerRef.current.getBoundingClientRect();
			const contentRect = contentRef.current.getBoundingClientRect();
			const viewportWidth = window.innerWidth;
			const viewportHeight = window.innerHeight;

			// Default position (below and aligned to the right of the trigger)
			let top = triggerRect.bottom + offsetY;
			let left = triggerRect.right - 240 + offsetX; // 240 is the fixed width of DropdownContent

			// Adjust top position if dropdown goes below the viewport
			if (top + contentRect.height > viewportHeight) {
				// Flip above the trigger if there's enough space
				top = triggerRect.top - contentRect.height - offsetY;
			}

			// Adjust left position if dropdown goes beyond the right edge
			if (left + contentRect.width > viewportWidth) {
				// Shift to the left of the trigger
				left = triggerRect.left - contentRect.width + offsetX;
			}

			// Ensure it doesn't go off the left edge
			if (left < 0) {
				left = 0;
			}

			// Ensure it doesn't go off the top edge
			if (top < 0) {
				top = 0;
			}

			setPosition({ top, left });
		}
	};

	const toggle = () => {
		setOpen((prev) => !prev);
	};

	useEffect(() => {
		if (open) {
			updatePosition();
		}
	}, [open]);

	useEffect(() => {
		const handleClickOutside = (event) => {
			if (
				contentRef.current &&
				!contentRef.current.contains(event.target) &&
				triggerRef.current &&
				!triggerRef.current.contains(event.target)
			) {
				setOpen(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	// Optional: Handle window resize to reposition dropdown
	useEffect(() => {
		const handleResize = () => {
			if (open) updatePosition();
		};
		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [open]);

	return (
		<context.Provider
			value={{ open, setOpen, position, triggerRef, contentRef, toggle }}
		>
			{children}
		</context.Provider>
	);
};
