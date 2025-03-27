import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

export const UpdatedAt = ({ timestamp }) => {
	const [timeAgo, setTimeAgo] = useState(() => formatDistanceToNow(timestamp));

	useEffect(() => {
		// Update the time immediately on mount
		setTimeAgo(formatDistanceToNow(timestamp));

		// Set up an interval to refresh every minute (60,000 ms)
		const intervalId = setInterval(() => {
			setTimeAgo(formatDistanceToNow(timestamp));
		}, 60000);

		// Cleanup interval on unmount
		return () => clearInterval(intervalId);
	}, [timestamp]);

	return <div className="rs-text-secondary">{timeAgo}</div>;
};
