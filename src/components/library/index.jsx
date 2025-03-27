import { ColumnBody, ColumnHeader, Column } from "@/components/columns";
import { useStore } from "@/lib/store";
import { AlertDialog, useModalStore } from "@/components/modal";
import { compareDesc } from "date-fns";

import {
	ArrowDropdownIcon,
	DropdownContent,
	DropdownMenu,
	DropdownTrigger,
	DropdownCheckboxItem,
	DropdownItem,
	DropdownDivider,
} from "../dropdown-menu";
import { RightDropdownMenu } from "@/components/columns";

import { changeLibrary, clearAll } from "./actions";
import { Editor } from "./editor";
import { Item } from "./item";
import { useState, useMemo } from "react";

export const libraryItems = [
	{ name: "modules", entry: true, lang: "javascript" },
	{ name: "configs", entry: false, lang: "toml" },
];

const Library = () => {
	const library = useStore((state) => state.library);
	const current = libraryItems.find((item) => item.name === library);
	const items = useStore((state) => state[library]);
	const openModal = useModalStore((state) => state.openModal);

	const [sortBy, setSortBy] = useState("name");
	const list = useMemo(() => {
		if (sortBy === "name") {
			return items.sort((a, b) => a.name.localeCompare(b.name));
		}
		if (sortBy === "time") {
			return items.sort((a, b) => compareDesc(a.updatedAt, b.updatedAt));
		}
	}, [items, sortBy]);

	return (
		<Column>
			<ColumnHeader>
				<div className="flex items-center gap-2">
					<span className="capitalize">{library}</span>
					<DropdownMenu offsetX={120} offsetY={12}>
						<DropdownTrigger>
							<ArrowDropdownIcon />
						</DropdownTrigger>
						<DropdownContent>
							{libraryItems.map((item) => (
								<DropdownCheckboxItem
									key={item.name}
									checked={library === item.name}
									onClick={() => {
										changeLibrary(item.name);
									}}
								>
									<span className="capitalize">{item.name}</span>
								</DropdownCheckboxItem>
							))}
						</DropdownContent>
					</DropdownMenu>
					<RightDropdownMenu>
						<DropdownItem
							onClick={() => openModal(<Editor library={current} />, false)}
						>
							Create
						</DropdownItem>
						<DropdownItem
							onClick={() =>
								openModal(
									<AlertDialog
										title="Are you sure?"
										message="This action will clear all lists and cannot be undone."
										onContinue={() => {
											clearAll();
										}}
									/>,
								)
							}
						>
							Clear All
						</DropdownItem>
						<DropdownDivider />
						<DropdownCheckboxItem
							checked={sortBy === "name"}
							onClick={() => setSortBy("name")}
						>
							Sort by name
						</DropdownCheckboxItem>
						<DropdownCheckboxItem
							checked={sortBy === "time"}
							onClick={() => setSortBy("time")}
						>
							Sort by time
						</DropdownCheckboxItem>
					</RightDropdownMenu>
				</div>
			</ColumnHeader>
			<ColumnBody>
				<div className="w-full h-full overflow-y-auto pt-1 pb-2">
					{list.map((item) => (
						<Item key={item.id} item={item} library={current} />
					))}
				</div>
			</ColumnBody>
		</Column>
	);
};

export default Library;
