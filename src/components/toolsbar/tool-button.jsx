export const ToolButton = ({ children, label, onClick }) => {
	return (
		<button className="cursor-pointer w-9 h-9 relative group" onClick={onClick}>
			<div className="w-full h-full group-hover:rs-bg-hovered rounded-full transition-all scale-90 group-hover:scale-100" />
			<div className="absolute top-0 left-0 right-0 bottom-0 w-full h-full flex items-center justify-center rs-text-charcoal">
				{children}
			</div>
			<div className="absolute left-10 top-[8px] hidden items-center rs-text-charcoal group-hover:flex text-xs font-semibold text-nowrap">
				{label}
			</div>
		</button>
	);
};
