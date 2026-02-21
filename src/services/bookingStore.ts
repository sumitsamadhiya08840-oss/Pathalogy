import { Booking } from '@/types/token';

const BOOKINGS_KEY = 'nxa_tokens_bookings_v1';

const isBrowser = (): boolean => typeof window !== 'undefined';

export const getBookings = (): Booking[] => {
  if (!isBrowser()) {
    return [];
  }

  const raw = localStorage.getItem(BOOKINGS_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as Booking[];
  } catch {
    return [];
  }
};

export const saveBookings = (bookings: Booking[]): void => {
  if (!isBrowser()) {
    return;
  }

  localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings));
};
