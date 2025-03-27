import { useStore } from "@/lib/store";
import { nanoid } from "nanoid";

function checkNameDuplicate(name, items) {
	return items.find((item) => item.name === name);
}

export function changeLibrary(name) {
	useStore.setState(() => ({
		library: name,
	}));
}

export function addItem(name, content, library, updatedAt) {
	const id = nanoid();
	if (
		checkNameDuplicate(
			name,
			useStore.getState()[library || useStore.getState().library],
		)
	) {
		throw new Error("Name already exists: " + name);
	}

	useStore.setState((state) => ({
		[library ? library : state.library]: [
			...state[library ? library : state.library],
			{ id, name, content, updatedAt: updatedAt || new Date() },
		],
	}));
}

export function getItem(id) {
	return useStore
		.getState()
		[useStore.getState().library].find((item) => item.id === id);
}

export function clearAll() {
	useStore.setState((state) => ({
		messages: [],
		modules: [],
		templates: [],
	}));
}

export function updateItem(id, name, content) {
	const duplicated = checkNameDuplicate(
		name,
		useStore.getState()[useStore.getState().library],
	);
	if (duplicated && duplicated.id !== id) {
		throw new Error("Name already exists: " + name);
	}
	useStore.setState((state) => ({
		[state.library]: state[state.library].map((item) =>
			item.id === id ? { ...item, name, content, updatedAt: new Date() } : item,
		),
	}));
}

export function deleteItem(id) {
	useStore.setState((state) => ({
		[state.library]: state[state.library].filter((item) => item.id !== id),
	}));
}

export function setEntry(id) {
	// set the item's entry to true, and set all other items' entry to false
	useStore.setState((state) => ({
		[state.library]: state[state.library].map((item) =>
			item.id === id ? { ...item, entry: true } : { ...item, entry: false },
		),
	}));
}
