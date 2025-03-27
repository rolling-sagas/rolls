export const Content = ({ item, onEdit }) => {
	return (
		<pre className="line-clamp-5 text-sm rs-text-charcoal" onClick={onEdit}>
			{item.content}
		</pre>
	);
};
