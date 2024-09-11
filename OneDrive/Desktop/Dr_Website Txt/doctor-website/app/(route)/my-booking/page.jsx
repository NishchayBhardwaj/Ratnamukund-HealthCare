// app/(route)/my-booking/page.jsx
"use client";

import React, { useState, useEffect, useCallback } from 'react'; // Include useCallback
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs'; // Make sure this import is correct

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BookingList from './_components/BookingList';
import GlobalApi from '@/app/_utils/GlobalApi';

function MyBooking() {
  const { user } = useKindeBrowserClient();
  const [bookingList, setBookingList] = useState([]);

  // Define getUserBookingList as a stable callback function
  const getUserBookingList = useCallback(async () => {
    if (user?.email) {
      try {
        const resp = await GlobalApi.getUserBookingList(user.email);
        console.log(resp.data.data);
        setBookingList(resp.data.data);
      } catch (error) {
        console.error("Failed to fetch booking list:", error);
      }
    }
  }, [user?.email]);

  useEffect(() => {
    getUserBookingList();
  }, [getUserBookingList]);

  // Used to filter user booking
  const filterUserBooking = (type) => {
    const result = bookingList.filter(item =>
      type === 'upcoming' ? new Date(item.attributes.Date) >= new Date() : new Date(item.attributes.Date) <= new Date()
    );
    console.log(result);
    return result;
  };

  return (
    <div className='px-4 sm:px-10 mt-10'>
      <h2 className='font-bold text-2xl'>My Booking</h2>
      <Tabs defaultValue="upcoming" className="w-full mt-5">
        <TabsList className='w-full justify-start'>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming">
          <BookingList bookingList={filterUserBooking('upcoming')} expired={false} />
        </TabsContent>
        <TabsContent value="expired">
          <BookingList bookingList={filterUserBooking('expired')} expired={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MyBooking;
