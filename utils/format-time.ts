import moment from "moment";

export function formatTimeRange(isoStartDateString: string, isoEndDateString: string) {
  const start = moment.utc(isoStartDateString);
  const end = moment.utc(isoEndDateString);
  const formattedStartTime = start.format('h:mm A');
  const formattedEndTime = end.format('h:mm A');
  const isNextDay = start.dayOfYear() !== end.dayOfYear();
  if (isNextDay)
    return `${formattedStartTime} - ${formattedEndTime} (Next day)`;
  return `${formattedStartTime} - ${formattedEndTime}`;
}
