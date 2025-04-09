import {
	DropdownContent,
	DropdownIcon,
	DropdownMenu,
	DropdownItem,
	DropdownTrigger,
} from "@/components/dropdown-menu";

import { AlertDialog, useModalStore } from "@/components/modal";
import { UpdatedAt } from "@/components/updated-at";

import { deleteItem } from "./actions";
import { Content } from "./content";
import { Editor } from "./editor";
import { isEntry as entry } from "../messages/actions";

export const Item = ({ item, library }) => {
	const isEntry = entry(item.content);

	const openModal = useModalStore((state) => state.openModal);
	const itemName = library?.name.slice(0, -1);

	function onDelete() {
		openModal(
			<AlertDialog
				continueLabel="Delete"
				title={`Delete ${itemName}?`}
				message={`If you delete this ${itemName}, you won't be able to restore it.`}
				onContinue={() => {
					deleteItem(item.id);
				}}
			/>,
		);
	}

	function onEdit() {
		openModal(<Editor id={item.id} library={library} />, false);
	}

	return (
		<div className="px-6 py-3">
			<div className="grid grid-cols-[48px_minmax(0,_1fr)]">
				<div className="pt-1 row-start-1 col-start-1 row-end-[span_2] relative">
					<div className="rounded-full w-[36px] h-[36px] border-[0.5px] relative flex items-center justify-center cursor-default">
						<span className="font-bold text-lg capitalize">{item.name[0]}</span>
						{isEntry && (
							<div className="rounded-full bg-blue-500 absolute -bottom-[3px] -right-[5px] p-0.5">
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									width={12}
									height={12}
									className="text-white"
									fill={"none"}
								>
									<path
										d="M4.25 13.5L8.75 18L19.75 6"
										stroke="currentColor"
										strokeWidth="1.5"
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</svg>
							</div>
						)}
					</div>
				</div>
				<div className="flex justify-start items-center self-start col-start-2 row-start-1 h-[21px] gap-3">
					<div className="flex flex-1 items-center gap-3">
						<div className="font-semibold">{item.name}</div>
						<div className="text-neutral-400">
							<UpdatedAt timestamp={item.updatedAt} />
						</div>
					</div>
					<DropdownMenu>
						<DropdownTrigger>
							<DropdownIcon />
						</DropdownTrigger>
						<DropdownContent>
							<DropdownItem onClick={onDelete}>Delete</DropdownItem>
							<DropdownItem onClick={onEdit}>Edit</DropdownItem>
						</DropdownContent>
					</DropdownMenu>
				</div>
				<div className="row-start-2 col-start-2 row-end-[span_3] block outline-none w-full h-fit">
					<div className="mt-[3px] h-fit">
						<Content item={item} onEdit={onEdit} />
					</div>
				</div>
			</div>
		</div>
	);
};
