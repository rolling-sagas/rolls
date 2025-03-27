import { useTheme } from "@/components/theme-provider";

export const DarkModeSwitch = () => {
	const { darkMode, setTheme } = useTheme();

	const handleToggle = () => {
		setTheme(darkMode ? "light" : "dark");
	};

	return (
		<div className="relative flex items-center space-x-3 group">
			<div
				className={`relative border-[0.5px] inline-flex h-5 w-9 items-center rounded-full cursor-pointer transition-colors duration-200 ease-in-out ${
					darkMode ? "bg-black border-white/25" : "bg-white border-black/25"
				}`}
				onClick={handleToggle}
			>
				<span
					className={`inline-block h-[14px] w-[14px] transform rounded-full transition-transform duration-200 ease-in-out ${
						darkMode
							? "translate-x-[18px] bg-white/70"
							: "translate-x-[2px] bg-black/70"
					}`}
				/>
				<div className="absolute text-nowrap left-10 w-fit hidden items-center justify-center rs-text-charcoal group-hover:flex text-xs font-semibold">
					{darkMode ? "Light" : "Dark"}
				</div>
			</div>
		</div>
	);
};
