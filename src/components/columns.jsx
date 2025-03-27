import { useContext, createContext } from "react";
import "./columns.css";
import { createPortal } from "react-dom";
import { useState } from "react";
import {
	DropdownContent,
	DropdownIcon,
	DropdownMenu,
	DropdownTrigger,
} from "./dropdown-menu";

const context = createContext();

export const RightDropdownMenu = ({ children }) => {
	const { rightRef } = useContext(context);
	if (rightRef) {
		return createPortal(
			<DropdownMenu>
				<DropdownTrigger>
					<DropdownIcon />
				</DropdownTrigger>
				<DropdownContent>{children}</DropdownContent>
			</DropdownMenu>,
			rightRef,
		);
	}
};

export const ColumnHeader = ({ children, left }) => {
	const [rightRef, setRightRef] = useState();
	const [centerRef, setCenterRef] = useState();

	return (
		<context.Provider value={{ rightRef, centerRef }}>
			<div className="w-full grid grid-cols-[1fr_minmax(auto,65%)_1fr] min-h-[60px] sticky top-0 bottom-0">
				<div className="flex justify-start items-center pl-2">{left}</div>
				<div
					className="flex items-center justify-center font-semibold"
					ref={(el) => setCenterRef(el)}
				>
					{children}
				</div>
				<div
					className="flex justify-end items-center pr-6"
					ref={(el) => {
						setRightRef(el);
					}}
				/>
			</div>
		</context.Provider>
	);
};

export const ColumnBody = ({ children }) => {
	return (
		<div className="flex flex-col flex-grow rs-bg-primary overflow-hidden rounded-t-3xl border-t-[0.5px] border-x-[0.5px]">
			{children}
		</div>
	);
};

export const Column = ({ children }) => {
	return (
		<div className="flex flex-col max-w-[640px] min-w-[420px] relative mr-3 last:mr-0 w-[21vw] h-full overflow-hidden column">
			{children}
		</div>
	);
};

export const Columns = ({ children }) => {
	return (
		<div className="w-full h-full flex px-4 overflow-x-auto">
			<div className="min-w-[76px] h-full"></div>
			<div className="flex flex-grow justify-center">{children}</div>
			<div className="min-w-[76px] h-full"></div>
		</div>
	);
};
