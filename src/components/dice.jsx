import DiceBox from "https://cdn.jsdelivr.net/npm/@3d-dice/dice-box@1.1.4/dist/dice-box.es.min.js";
import DiceParser from "@3d-dice/dice-parser-interface";

const DP = new DiceParser();

import { create } from "zustand";

import React, { useEffect, useRef, useState } from "react";

export const useRollDice = create((set, get) => ({
	diceBox: null,
	results: null,
	isRolling: false,
	callback: null,
	notation: null,
	setDiceBox: (diceBox) => set({ diceBox }),
	setIsRolling: (isRolling) => set({ isRolling }),
	rollDice: async (notation, callback) => {
		if (!get().diceBox || get().isRolling) return;
		notation = DP.parseNotation(notation);
		get().diceBox?.show();
		set({ isRolling: true, results: null, callback, notation });
		const results = await get().diceBox.roll(notation);
		set({ results });
		// callback is triggered by user's click
	},
	clear: () => {
		get().diceBox?.clear();
		get().diceBox?.hide();
		set({ results: null, notation: null, isRolling: false, callback: null });
	},
}));

const DiceBoxComponent = () => {
	const containerRef = useRef(null);

	const setDiceBox = useRollDice((state) => state.setDiceBox);
	const rollDice = useRollDice((state) => state.rollDice);
	const callback = useRollDice((state) => state.callback);
	const diceBox = useRollDice((state) => state.diceBox);
	const isRolling = useRollDice((state) => state.isRolling);
	const setIsRolling = useRollDice((state) => state.setIsRolling);
	const results = useRollDice((state) => state.results);
	const clear = useRollDice((state) => state.clear);

	useEffect(() => {
		const initDiceBox = async () => {
			const box = new DiceBox({
				assetPath: "assets/",
				origin: "https://cdn.jsdelivr.net/npm/@3d-dice/dice-box@1.1.4/dist/",
				container: "#dice-box",
				offscreen: true,
				scale: 6,
				throwForce: 5,
				gravity: 1,
				mass: 1,
				spinForce: 6,
			});

			try {
				if (diceBox) return;
				await box.init();
				setDiceBox(box);
			} catch (error) {
				console.error("Error initializing dice box:", error);
			}
		};

		initDiceBox();

		return async () => {
			if (diceBox) {
				diceBox.clear();
			}
		};
	}, []);

	const resultsStr = useRollDice((state) => {
		if (!state.results) return null;

		if (state.results.length === 1) return state.results[0].value;

		const values = state.results.map((result) => result.value);
		const sum = values.reduce((acc, curr) => acc + curr, 0);
		return values.join(", ");
	});

	return (
		<div
			className={`fixed inset-[48px] ${
				isRolling ? "pointer-events-auto" : "pointer-events-none"
			} `}
			onClick={(evt) => {
				if (results && callback) {
					callback(results);
					clear();
				}
			}}
		>
			<div id="dice-box" className="w-full h-full absolute inset-0 z-40" />
			{isRolling && (
				<div
					className={`z-[42]! flex flex-col items-center justify-center w-full h-full font-bold transition-all duration-200 ease-in ${resultsStr ? "opacity-100 scale-100" : "opacity-0 scale-90"}`}
				>
					{resultsStr && (
						<div className="p-6 rounded-3xl rs-bg-backdrop text-white text-2xl min-w-24 min-h-24 flex items-center justify-center">
							{resultsStr}
						</div>
					)}
				</div>
			)}
		</div>
	);
};

export default DiceBoxComponent;
