"use client";
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, Clock } from 'lucide-react';
import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
import GlobalApi from '@/app/_utils/GlobalApi';
import { useRouter } from 'next/navigation';
import axios from 'axios'; // Make sure to import axios

function BookAppointment({ doctor }) {
    const [date, setDate] = useState(new Date());
    const [timeSlots, setTimeSlots] = useState([]);
    const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
    const [bookedSlotsByDate, setBookedSlotsByDate] = useState({});
    const [note, setNote] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const { user } = useKindeBrowserClient() || {};
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [clinicType, setClinicType] = useState('Morning Clinic - Ratnamukund Clinic, Warjhe');
    const [successMessage, setSuccessMessage] = useState('');
    const [error, setError] = useState('');

    const getTimeSlotsForDoctor = (doctorId) => {
        const doctorTimeSlots = {
            '3': { morning: [[8, 30], [9, 30]], evening: [[19, 30], [20, 30]] }, // 8:30 AM to 9:30 AM
            '4': { 
                morning: [[8, 0], [9, 0]], 
                evening: [[11, 0], [1, 0]],
                AfterNoon: [[9, 0], [11, 0]]
            },
            '5': { // Special case for ID 5
                morning: [[8, 30], [11, 0]], 
                evening: [[19, 0], [21, 0]]
            },
            '7': { morning: [[8, 0], [10, 45]] },
        };
        return doctorTimeSlots[doctorId] || { morning: [[9, 0], [12, 0]], evening: [[13, 0], [18, 0]] };
    };
    
    useEffect(() => {
        const fetchBookedSlotsAndUpdateTimeSlots = async () => {
            try {
                const dateStr = date.toLocaleDateString('en-CA');
                const response = await GlobalApi.getDoctorAppointmentsByDate(doctor.id, dateStr);
                const bookedTimes = response.data.data
                    ? response.data.data.map(appointment => appointment.attributes.Time)
                    : [];
                setBookedSlotsByDate(prev => ({
                    ...prev,
                    [dateStr]: bookedTimes
                }));
                updateAvailableTimeSlots(bookedTimes);
            } catch (error) {
                console.error("Failed to fetch booked slots:", error.response ? error.response.data : error.message);
            }
        };
    
        const updateAvailableTimeSlots = (bookedSlots) => {
            const timeList = [];
            const clinicTypeOnly = clinicType.split(" - ")[0];
            const { morning, evening, AfterNoon } = getTimeSlotsForDoctor(doctor.id);
        
            const isToday = isSameDay(date, new Date());
            const now = new Date();
            const dayOfWeek = date.getDay(); // Get the day of the week (0 for Sunday, 1 for Monday, ..., 6 for Saturday)
        
            // Check if the selected date is Sunday (0 represents Sunday)
            if (dayOfWeek === 0) {
                setTimeSlots([]);  // Clinic is closed, no available slots
                return;
            }
        
            const generateTimeSlots = (startTime, endTime) => {
                let [currentHour, currentMinutes] = startTime;
                const [endHour, endMinutes] = endTime;
        
                while (currentHour < endHour || (currentHour === endHour && currentMinutes < endMinutes)) {
                    const slotTime = new Date(date);
                    slotTime.setHours(currentHour, currentMinutes);
        
                    if (isToday && slotTime <= now) {
                        currentMinutes += 15;
                        if (currentMinutes === 60) {
                            currentHour++;
                            currentMinutes = 0;
                        }
                        continue;
                    }
        
                    const formattedTime = formatTime(slotTime);
                    if (!bookedSlots.includes(formattedTime)) {
                        timeList.push(formattedTime);
                    }
        
                    // Increment minutes by 15
                    currentMinutes += 15;
                    if (currentMinutes === 60) {
                        currentHour++;
                        currentMinutes = 0;
                    }
                }
            };
        
            // Special case for doctor ID 5: Morning and Evening slots only on Monday, Saturday, and Thursday
            if (doctor.id === 5) {
                if (clinicTypeOnly === 'Morning Clinic' && (dayOfWeek === 1 || dayOfWeek === 6)) { // Monday and Saturday for morning
                    generateTimeSlots(morning[0], morning[1]);
                } else if (clinicTypeOnly === 'Evening Clinic' && dayOfWeek === 4) { // Thursday for evening
                    generateTimeSlots(evening[0], evening[1]);
                } else {
                    setTimeSlots([]); // No time slots for other days for ID 5
                    return;
                }
            } else {
                // Normal behavior for other doctor IDs
                if (clinicTypeOnly === 'Morning Clinic' && morning) {
                    generateTimeSlots(morning[0], morning[1]);
                } else if (clinicTypeOnly === 'Evening Clinic' && evening) {
                    generateTimeSlots(evening[0], evening[1]);
                } else if (clinicTypeOnly === 'AfterNoon Clinic' && AfterNoon) {
                    generateTimeSlots(AfterNoon[0], AfterNoon[1]);
                }
            }
        
            setTimeSlots(timeList);
        };
        
    fetchBookedSlotsAndUpdateTimeSlots();
    }, [date, clinicType, doctor.id]);    

    const saveBooking = async () => {
        setLoading(true);
        setSuccessMessage('');
    
        if (!user) {
            setSuccessMessage('User is not authenticated. Please log in and try again.');
            setLoading(false);
            return;
        }
    
        if (!phoneNumber) {
            setSuccessMessage('Phone number is required.');
            setLoading(false);
            return;
        }
    
        if (!selectedTimeSlot) {
            setSuccessMessage('Please select a time slot.');
            setLoading(false);
            return;
        }
    
        const dateStr = date.toLocaleDateString('en-CA');
        const bookedSlots = bookedSlotsByDate[dateStr] || [];
    
        if (bookedSlots.includes(selectedTimeSlot)) {
            setSuccessMessage('This time slot is already booked. Please select another time.');
            setLoading(false);
            return;
        }
    
        const data = {
            data: {
                UserName: `${user.given_name || ''} ${user.family_name || ''}`.trim(),
                Email: user.email,
                Time: selectedTimeSlot,
                Date: dateStr,
                doctor: doctor.id,
                PhoneNumber: phoneNumber,
            }
        };
    
        try {
            // Save the appointment
            await GlobalApi.bookAppointment(data);
    
            // Prepare form data for the message
            const formData = {
                user_name: `${user.given_name || ''} ${user.family_name || ''}`.trim(),
                user_phone: phoneNumber,
                date: dateStr,
                time: selectedTimeSlot,
                doctorName: doctor?.attributes?.Name
            };
    
            // Send the message
            await sendMessage(formData);
    
            setSuccessMessage('Booking Successful! You will be redirected shortly.');
            setTimeout(() => router.push('/'), 2000);
        } catch (error) {
            console.error("Booking failed:", error.response ? error.response.data : error.message);
            setSuccessMessage(`Booking Failed. Error: ${error.response ? error.response.data.message : error.message}`);
        } finally {
            setLoading(false);
        }
    };    
    
    const sendMessage = async (formData) => {
        const phoneNumbers = [
            "+919325046223",
            "+918149623527",
            "+919822038877",
            "+919764432460",
        ];
    
        try {
            const promises = phoneNumbers.map(async (number) => {
                const response = await axios.post(
                    `https://graph.facebook.com/v16.0/405802159279444/messages`,
                    {
                        messaging_product: "whatsapp",
                        to: number,
                        type: "template",
                        template: {
                            name: "booking_appointment",
                            language: { code: "en" },
                            components: [
                                {
                                    type: "body",
                                    parameters: [
                                        { type: "text", text: formData.user_name },  // {{1}}
                                        { type: "text", text: formData.user_phone },  // {{2}}
                                        { type: "text", text: formData.date },  // {{3}}
                                        { type: "text", text: formData.time },  // {{4}}
                                        { type: "text", text: formData.doctorName }  // {{5}}
                                    ]
                                }
                            ]
                        }
                    },
                    {
                        headers: {
                            "Authorization": `Bearer EAAE2eCrRWPkBO5IJD2ZCjepnBu16tfITg1aSWXeVuoqMEXWLE0ME2JZAKRNQUeE5T19rKzPltkk5PNuxSfwqnxzRWJtJuoCAqBTJxTANQW7hRnlHvYokTVPVjPccghhJVCBCiKZBlUKAUvnzJmuftZCOesX5uNVIJ94YvaZBBEwKWfFt9BQ1qDjlfZAQ4C7uPZBDQZDZD`,  // Replace with your access token
                            "Content-Type": "application/json"
                        }
                    }
                );
    
                if (response.status !== 200) {
                    throw new Error(`Failed to send message to ${number}: ${response.data.error.message}`);
                }
            });
    
            await Promise.all(promises);
    
            return "Your message has been sent successfully to all recipients.";
        } catch (error) {
            console.error(`Failed to send message: ${error.message}`);
            throw new Error(`Failed to send message: ${error.message}`);
        }
    };
    
    const isPastDay = (day) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return day < today;
    };

    const isSameDay = (d1, d2) => {
        return d1.getFullYear() === d2.getFullYear() &&
               d1.getMonth() === d2.getMonth() &&
               d1.getDate() === d2.getDate();
    };

    const formatTime = (date) => {
        let hours = date.getHours();
        const minutes = date.getMinutes();
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours || 12;
        const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
        return `${hours}:${minutesStr} ${ampm}`;
    };

    return (
        <Dialog>
            <DialogTrigger>
                <Button className='mt-3 rounded-full'>Book Appointment</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto p-4 sm:p-6">
                <div className="h-full flex flex-col">
                    <DialogHeader>
                        <DialogTitle>Book Appointment</DialogTitle>
                        <DialogDescription>
                            <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6'>
                                <div className='flex flex-col gap-4'>
                                    <h2 className='flex gap-2 items-center text-lg md:text-xl'>
                                        <CalendarDays className='text-primary h-5 w-5' />
                                        Select Date
                                    </h2>
                                    <Calendar
                                        mode="single"
                                        selected={date}
                                        onSelect={setDate}
                                        disabled={isPastDay}
                                        className="rounded-md border w-full"
                                    />
                                    <div className='mt-4'>
                                        <h2 className='flex gap-2 items-center text-lg md:text-xl'>
                                            <Clock className='text-primary h-5 w-5' />
                                            Select Clinic Type
                                        </h2>
                                        <select
                                            value={clinicType}
                                            onChange={(e) => setClinicType(e.target.value)}
                                            className="w-full mt-2 p-2 border rounded-md"
                                        >
                                            <option value="Morning Clinic - Ratnamukund Clinic, Warjhe">Morning Clinic - Ratnamukund Clinic, Warjhe</option>
                                            <option value="Evening Clinic - Ratnamukund Clinic, Warjhe">Evening Clinic - Ratnamukund Clinic, Warjhe</option>
                                            <option value="AfterNoon Clinic - Shashvat Clinic, Pune">AfterNoon Clinic - Shashvat Clinic, Pune</option>
                                        </select>
                                    </div>
                                </div>
                                <div className='flex flex-col gap-4'>
                                    <h2 className='flex gap-2 items-center text-lg md:text-xl'>
                                        <Clock className='text-primary h-5 w-5' />
                                        Available Time Slots
                                    </h2>
                                    <div className='flex flex-wrap gap-2'>
                                        {timeSlots.length > 0 ? (
                                            timeSlots.map((slot, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setSelectedTimeSlot(slot)}
                                                    className={`p-2 border rounded-md ${selectedTimeSlot === slot ? 'bg-primary text-white' : 'bg-white'}`}
                                                >
                                                    {slot}
                                                </button>
                                            ))
                                        ) : (
                                            <p>No available time slots for the selected date and clinic type.</p>
                                        )}
                                    </div>
                                    <div className='mt-5'>
                                        <label className='block text-lg md:text-xl'>Phone Number:</label>
                                        <input
                                            type="tel"
                                            value={phoneNumber}
                                            onChange={(e) => setPhoneNumber(e.target.value)}
                                            className='w-full mt-2 p-2 border rounded-md'
                                            placeholder='Enter your phone number'
                                        />
                                    </div>
                                    <div className='mt-5'>
                                        <label className='block text-lg md:text-xl'>Notes:</label>
                                        <textarea
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            className='w-full mt-2 p-2 border rounded-md'
                                            placeholder='Enter any additional notes'
                                        />
                                    </div>
                                </div>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex flex-col-reverse md:flex-row gap-3">
                        <Button
                            type="button"
                            onClick={saveBooking}
                            disabled={loading}
                            className="bg-primary text-white rounded-full"
                        >
                            {loading ? 'Booking...' : 'Book Appointment'}
                        </Button>
                        <DialogClose>
                            <Button className='rounded-full'>Close</Button>
                        </DialogClose>
                    </DialogFooter>
                    {successMessage && (
                        <div className="text-center text-red-600 mt-3">
                            {successMessage}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default BookAppointment;


// "use client";
// import React, { useState, useEffect } from 'react';
// import {
//     Dialog,
//     DialogContent,
//     DialogDescription,
//     DialogHeader,
//     DialogTitle,
//     DialogTrigger,
//     DialogFooter,
//     DialogClose,
// } from "@/components/ui/dialog";
// import { Button } from "@/components/ui/button";
// import { Calendar } from "@/components/ui/calendar";
// import { CalendarDays, Clock } from 'lucide-react';
// import { useKindeBrowserClient } from '@kinde-oss/kinde-auth-nextjs';
// import GlobalApi from '@/app/_utils/GlobalApi';
// import { useRouter } from 'next/navigation';
// import axios from 'axios'; // Make sure to import axios

// function BookAppointment({ doctor }) {
//     const [date, setDate] = useState(new Date());
//     const [timeSlots, setTimeSlots] = useState([]);
//     const [selectedTimeSlot, setSelectedTimeSlot] = useState('');
//     const [bookedSlotsByDate, setBookedSlotsByDate] = useState({});
//     const [note, setNote] = useState('');
//     const [phoneNumber, setPhoneNumber] = useState('');
//     const { user } = useKindeBrowserClient() || {};
//     const [loading, setLoading] = useState(false);
//     const router = useRouter();
//     const [clinicType, setClinicType] = useState('Morning Clinic - Ratnamukund Clinic, Warjhe');
//     const [successMessage, setSuccessMessage] = useState('');
//     const [error, setError] = useState('');

//     const getTimeSlotsForDoctor = (doctorId) => {
//         const doctorTimeSlots = {
//             '3': { morning: [8, 10], evening: [18, 21] },
//             '4': { 
//                 morning: [8, 8], 
//                 evening: [11, 12],
//                 AfterNoon: [9, 10]
//             },
//             '7': { morning: [8, 10.5] },
//         };
//         return doctorTimeSlots[doctorId] || { morning: [9, 12], evening: [13, 18] };
//     };

//     useEffect(() => {
//         const fetchBookedSlotsAndUpdateTimeSlots = async () => {
//             try {
//                 const dateStr = date.toLocaleDateString('en-CA');
//                 const response = await GlobalApi.getDoctorAppointmentsByDate(doctor.id, dateStr);
//                 const bookedTimes = response.data.data
//                     ? response.data.data.map(appointment => appointment.attributes.Time)
//                     : [];
//                 setBookedSlotsByDate(prev => ({
//                     ...prev,
//                     [dateStr]: bookedTimes
//                 }));
//                 updateAvailableTimeSlots(bookedTimes);
//             } catch (error) {
//                 console.error("Failed to fetch booked slots:", error.response ? error.response.data : error.message);
//             }
//         };

//         const updateAvailableTimeSlots = (bookedSlots) => {
//             const timeList = [];
//             const clinicTypeOnly = clinicType.split(" - ")[0];
//             const { morning, evening, AfterNoon } = getTimeSlotsForDoctor(doctor.id);

//             const isToday = isSameDay(date, new Date());
//             const now = new Date();

//             const generateTimeSlots = (startHour, endHour) => {
//                 for (let hour = startHour; hour <= endHour; hour++) {
//                     ['00', '15', '30', '45'].forEach(minute => {
//                         const slotTime = new Date(date);
//                         slotTime.setHours(hour, minute);

//                         if (isToday && slotTime <= now) return;

//                         const formattedTime = formatTime(slotTime);
//                         if (!bookedSlots.includes(formattedTime)) {
//                             timeList.push(formattedTime);
//                         }
//                     });
//                 }
//             };

//             if (clinicTypeOnly === 'Morning Clinic') {
//                 generateTimeSlots(morning[0], morning[1]);
//             } else if (clinicTypeOnly === 'Evening Clinic' && evening) {
//                 generateTimeSlots(evening[0], evening[1]);
//             } else if (clinicTypeOnly === 'AfterNoon Clinic' && AfterNoon) {
//                 generateTimeSlots(AfterNoon[0], AfterNoon[1]);
//             }

//             setTimeSlots(timeList);
//         };

//         fetchBookedSlotsAndUpdateTimeSlots();
//     }, [date, clinicType, doctor.id]);

//     const saveBooking = async () => {
//         setLoading(true);
//         setSuccessMessage('');
    
//         if (!user) {
//             setSuccessMessage('User is not authenticated. Please log in and try again.');
//             setLoading(false);
//             return;
//         }
    
//         if (!phoneNumber) {
//             setSuccessMessage('Phone number is required.');
//             setLoading(false);
//             return;
//         }
    
//         if (!selectedTimeSlot) {
//             setSuccessMessage('Please select a time slot.');
//             setLoading(false);
//             return;
//         }
    
//         const dateStr = date.toLocaleDateString('en-CA');
//         const bookedSlots = bookedSlotsByDate[dateStr] || [];
    
//         if (bookedSlots.includes(selectedTimeSlot)) {
//             setSuccessMessage('This time slot is already booked. Please select another time.');
//             setLoading(false);
//             return;
//         }
    
//         const data = {
//             data: {
//                 UserName: `${user.given_name || ''} ${user.family_name || ''}`.trim(),
//                 Email: user.email,
//                 Time: selectedTimeSlot,
//                 Date: dateStr,
//                 doctor: doctor.id,
//                 PhoneNumber: phoneNumber,
//             }
//         };
    
//         try {
//             // Save the appointment
//             await GlobalApi.bookAppointment(data);
    
//             // Prepare form data for the message
//             const formData = {
//                 user_name: `${user.given_name || ''} ${user.family_name || ''}`.trim(),
//                 user_phone: phoneNumber,
//                 date: dateStr,
//                 time: selectedTimeSlot,
//                 doctorName: doctor?.attributes?.Name
//             };
    
//             // Send the message
//             await sendMessage(formData);
    
//             setSuccessMessage('Booking Successful! You will be redirected shortly.');
//             setTimeout(() => router.push('/'), 2000);
//         } catch (error) {
//             console.error("Booking failed:", error.response ? error.response.data : error.message);
//             setSuccessMessage(`Booking Failed. Error: ${error.response ? error.response.data.message : error.message}`);
//         } finally {
//             setLoading(false);
//         }
//     };    
    
//     const sendMessage = async (formData) => {
//         const phoneNumbers = [
//             "+919325046223",
//             "+918149623527",
//             "+919767006130"
//         ];
    
//         try {
//             const promises = phoneNumbers.map(async (number) => {
//                 const response = await axios.post(
//                     `https://graph.facebook.com/v16.0/405802159279444/messages`,
//                     {
//                         messaging_product: "whatsapp",
//                         to: number,
//                         type: "template",
//                         template: {
//                             name: "booking_appointment",
//                             language: { code: "en" },
//                             components: [
//                                 {
//                                     type: "body",
//                                     parameters: [
//                                         { type: "text", text: formData.user_name },  // {{1}}
//                                         { type: "text", text: formData.user_phone },  // {{2}}
//                                         { type: "text", text: formData.date },  // {{3}}
//                                         { type: "text", text: formData.time },  // {{4}}
//                                         { type: "text", text: formData.doctorName }  // {{5}}
//                                     ]
//                                 }
//                             ]
//                         }
//                     },
//                     {
//                         headers: {
//                             "Authorization": `Bearer EAAE2eCrRWPkBO5IJD2ZCjepnBu16tfITg1aSWXeVuoqMEXWLE0ME2JZAKRNQUeE5T19rKzPltkk5PNuxSfwqnxzRWJtJuoCAqBTJxTANQW7hRnlHvYokTVPVjPccghhJVCBCiKZBlUKAUvnzJmuftZCOesX5uNVIJ94YvaZBBEwKWfFt9BQ1qDjlfZAQ4C7uPZBDQZDZD`,  // Replace with your access token
//                             "Content-Type": "application/json"
//                         }
//                     }
//                 );
    
//                 if (response.status !== 200) {
//                     throw new Error(`Failed to send message to ${number}: ${response.data.error.message}`);
//                 }
//             });
    
//             await Promise.all(promises);
    
//             return "Your message has been sent successfully to all recipients.";
//         } catch (error) {
//             console.error(`Failed to send message: ${error.message}`);
//             throw new Error(`Failed to send message: ${error.message}`);
//         }
//     };
    
//     const isPastDay = (day) => {
//         const today = new Date();
//         today.setHours(0, 0, 0, 0);
//         return day < today;
//     };

//     const isSameDay = (d1, d2) => {
//         return d1.getFullYear() === d2.getFullYear() &&
//                d1.getMonth() === d2.getMonth() &&
//                d1.getDate() === d2.getDate();
//     };

//     const formatTime = (date) => {
//         let hours = date.getHours();
//         const minutes = date.getMinutes();
//         const ampm = hours >= 12 ? 'PM' : 'AM';
//         hours = hours % 12;
//         hours = hours || 12;
//         const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
//         return `${hours}:${minutesStr} ${ampm}`;
//     };

//     return (
//         <Dialog>
//             <DialogTrigger>
//                 <Button className='mt-3 rounded-full'>Book Appointment</Button>
//             </DialogTrigger>
//             <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto p-4 sm:p-6">
//                 <div className="h-full flex flex-col">
//                     <DialogHeader>
//                         <DialogTitle>Book Appointment</DialogTitle>
//                         <DialogDescription>
//                             <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6'>
//                                 <div className='flex flex-col gap-4'>
//                                     <h2 className='flex gap-2 items-center text-lg md:text-xl'>
//                                         <CalendarDays className='text-primary h-5 w-5' />
//                                         Select Date
//                                     </h2>
//                                     <Calendar
//                                         mode="single"
//                                         selected={date}
//                                         onSelect={setDate}
//                                         disabled={isPastDay}
//                                         className="rounded-md border w-full"
//                                     />
//                                     <div className='mt-4'>
//                                         <h2 className='flex gap-2 items-center text-lg md:text-xl'>
//                                             <Clock className='text-primary h-5 w-5' />
//                                             Select Clinic Type
//                                         </h2>
//                                         <select
//                                             value={clinicType}
//                                             onChange={(e) => setClinicType(e.target.value)}
//                                             className="w-full mt-2 p-2 border rounded-md"
//                                         >
//                                             <option value="Morning Clinic - Ratnamukund Clinic, Warjhe">Morning Clinic - Ratnamukund Clinic, Warjhe</option>
//                                             <option value="Evening Clinic - Ratnamukund Clinic, Warjhe">Evening Clinic - Ratnamukund Clinic, Warjhe</option>
//                                             <option value="AfterNoon Clinic - Shashvat Clinic, Pune">AfterNoon Clinic - Shashvat Clinic, Pune</option>
//                                         </select>
//                                     </div>
//                                 </div>
//                                 <div className='flex flex-col gap-4'>
//                                     <h2 className='flex gap-2 items-center text-lg md:text-xl'>
//                                         <Clock className='text-primary h-5 w-5' />
//                                         Available Time Slots
//                                     </h2>
//                                     <div className='flex flex-wrap gap-2'>
//                                         {timeSlots.length > 0 ? (
//                                             timeSlots.map((slot, index) => (
//                                                 <button
//                                                     key={index}
//                                                     onClick={() => setSelectedTimeSlot(slot)}
//                                                     className={`p-2 border rounded-md ${selectedTimeSlot === slot ? 'bg-primary text-white' : 'bg-white'}`}
//                                                 >
//                                                     {slot}
//                                                 </button>
//                                             ))
//                                         ) : (
//                                             <p>No available time slots for the selected date and clinic type.</p>
//                                         )}
//                                     </div>
//                                     <div className='mt-5'>
//                                         <label className='block text-lg md:text-xl'>Phone Number:</label>
//                                         <input
//                                             type="tel"
//                                             value={phoneNumber}
//                                             onChange={(e) => setPhoneNumber(e.target.value)}
//                                             className='w-full mt-2 p-2 border rounded-md'
//                                             placeholder='Enter your phone number'
//                                         />
//                                     </div>
//                                     <div className='mt-5'>
//                                         <label className='block text-lg md:text-xl'>Notes:</label>
//                                         <textarea
//                                             value={note}
//                                             onChange={(e) => setNote(e.target.value)}
//                                             className='w-full mt-2 p-2 border rounded-md'
//                                             placeholder='Enter any additional notes'
//                                         />
//                                     </div>
//                                 </div>
//                             </div>
//                         </DialogDescription>
//                     </DialogHeader>
//                     <DialogFooter className="flex flex-col-reverse md:flex-row gap-3">
//                         <Button
//                             type="button"
//                             onClick={saveBooking}
//                             disabled={loading}
//                             className="bg-primary text-white rounded-full"
//                         >
//                             {loading ? 'Booking...' : 'Book Appointment'}
//                         </Button>
//                         <DialogClose>
//                             <Button className='rounded-full'>Close</Button>
//                         </DialogClose>
//                     </DialogFooter>
//                     {successMessage && (
//                         <div className="text-center text-red-600 mt-3">
//                             {successMessage}
//                         </div>
//                     )}
//                 </div>
//             </DialogContent>
//         </Dialog>
//     );
// }

// export default BookAppointment;