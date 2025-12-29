import React, { createContext, ReactNode, useContext, useState } from 'react';

type BookingStatus = 'pending' | 'approved' | 'denied' | 'proposed';

export type BookingRequest = {
  id: string;
  fullName: string;
  contact: string;
  reason: string;
  preferredTime: string;
  createdAt: string;
  status: BookingStatus;
  proposedTime?: string;
};

type BookingContextType = {
  bookings: BookingRequest[];
  addBooking: (data: Omit<BookingRequest, 'id' | 'status' | 'createdAt'>) => void;
  approveBooking: (id: string) => void;
  denyBooking: (id: string) => void;
  proposeNewTime: (id: string, proposedTime: string) => void;
};

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookings, setBookings] = useState<BookingRequest[]>([]);

  const addBooking: BookingContextType['addBooking'] = (data) => {
    setBookings((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        ...data,
      },
    ]);
  };

  const updateBooking = (id: string, fields: Partial<BookingRequest>) => {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...fields } : b)));
  };

  const approveBooking = (id: string) => updateBooking(id, { status: 'approved' });
  const denyBooking = (id: string) => updateBooking(id, { status: 'denied' });
  const proposeNewTime = (id: string, proposedTime: string) =>
    updateBooking(id, { status: 'proposed', proposedTime });

  return (
    <BookingContext.Provider
      value={{ bookings, addBooking, approveBooking, denyBooking, proposeNewTime }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookings() {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error('useBookings must be used inside BookingProvider');
  }
  return ctx;
}
