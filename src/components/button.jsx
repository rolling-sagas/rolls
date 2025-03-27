export const Button = ({ children, onClick, disabled }) => {
	return (
		<button
			className="px-4 h-[36px] min-h-[36px] flex items-center justify-center border rounded-xl font-semibold disabled:text-gray-400"
			onClick={onClick}
			disabled={disabled}
		>
			{children}
		</button>
	);
};
