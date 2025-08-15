import moment from "moment";

export function calculateHoursInRange(timeRangeString: string) {
	const parts = timeRangeString.split(' - ');

	if (parts.length !== 2) {
		throw new Error("Invalid time range format. Expected 'h:mm A - h:mm A'.");
	}

	const startTimeString = parts[0];
	const endTimeString = parts[1];
	const format = "h:mm A";

	const startTime = moment(startTimeString, format);
	let endTime = moment(endTimeString, format);

	if (!startTime.isValid() || !endTime.isValid()) {
		throw new Error("Invalid time format. Make sure the times are correct (e.g., '6:00 PM').");
	}

	if (endTime.isBefore(startTime)) {
		endTime = endTime.add(1, 'day');
	}

	const duration = moment.duration(endTime.diff(startTime));
	const totalHours = duration.asHours();

	return totalHours;
}
