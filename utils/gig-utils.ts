import type GigDetails from '@/app/types/GigDetailsTypes';
import type { GigReviewDetailsData } from '@/app/types/GigDetailsTypes';

export const formatGigDataForEditing = (gig: GigDetails): GigReviewDetailsData => {
  const startTime = new Date(gig.startTime);
  const endTime = new Date(gig.endTime);
  const options: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
  const start = startTime.toLocaleTimeString('en-US', options);
  const end = endTime.toLocaleTimeString('en-US', options);

  const durationMs = endTime.getTime() - startTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);

  const totalPay = (gig.hourlyRate * durationHours).toFixed(2);
  const fees = (parseFloat(totalPay) * 0.1).toFixed(2);

  return {
    location: gig.location,
    date: new Date(gig.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    time: `${start} - ${end}`,
    payPerHour: gig.hourlyRate.toString(),
    totalPay: totalPay,
    summary: `Total gig value is now £${totalPay}, with Able and payment provider fees of £${fees}.`,
  };
};

export const initialGigState: GigReviewDetailsData = {
  location: { formatted_address: '' },
  date: '',
  time: '',
  payPerHour: '',
  totalPay: '',
  summary: '',
};


export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

export const formatTime = (startTimeStr: string, endTimeStr: string) => {
  const startTime = new Date(startTimeStr);
  const endTime = new Date(endTimeStr);
  const options: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };
  const start = startTime.toLocaleTimeString('en-US', options);
  const end = endTime.toLocaleTimeString('en-US', options);
  return `${start} - ${end}`;
};

export const calculateDurationInHours = (startTimeStr: string, endTimeStr: string) => {
  const startTime = new Date(startTimeStr);
  const endTime = new Date(endTimeStr);
  const diffMs = endTime.getTime() - startTime.getTime();
  return diffMs / (1000 * 60 * 60);
};

export const calculateTotalPay = (hourlyRate: number, duration: number) => {
  return (hourlyRate * duration).toFixed(2);
};

