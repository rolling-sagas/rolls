import { createContext, useContext, useEffect, useState } from "react";

const initialState = {
	theme: "system",
	darkMode: false,
	setTheme: () => null,
};

const ThemeProviderContext = createContext(initialState);

export function ThemeProvider({
	children,
	defaultTheme = "system",
	storageKey = "ui-theme",
	...props
}) {
	const [theme, setTheme] = useState(
		() => localStorage.getItem(storageKey) || defaultTheme,
	);

	const [darkMode, setDarkMode] = useState(false);

	useEffect(() => {
		const root = window.document.documentElement;

		root.classList.remove("dark");
		setDarkMode(false);

		if (theme === "system") {
			const systemDarkMode = window.matchMedia(
				"(prefers-color-scheme: dark)",
			).matches;

			if (systemDarkMode) {
				root.classList.add("dark");
				setDarkMode(true);
			}
			return;
		}

		if (theme === "dark") {
			root.classList.add("dark");
			setDarkMode(true);
		}
		// do nothing for the "light" theme
	}, [theme]);

	const value = {
		theme,
		darkMode,
		setTheme: (theme) => {
			localStorage.setItem(storageKey, theme);
			setTheme(theme);
		},
	};

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);
	if (context === undefined)
		throw new Error("useTheme must be used within a ThemeProvider");

	return context;
};
