import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';

const SeatBooking = () => {
    const [seats, setSeats] = useState([]);
    const [selectedSeats, setSelectedSeats] = useState([]);
    const [bookings, setBookings] = useState([]);
    const [error, setError] = useState('');
    const [seatsToBook, setSeatsToBook] = useState(1);
    const { token } = useAuth();

    useEffect(() => {
        fetchSeats();
        fetchBookings();
    }, []);

    const fetchSeats = async () => {
        try {
            const response = await axios.get('https://workwise-task-g8sm.onrender.com/api/seats', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSeats(response.data);
        } catch (error) {
            setError('Failed to fetch seats');
        }
    };

    const fetchBookings = async () => {
        try {
            const response = await axios.get('https://workwise-task-g8sm.onrender.com/api/bookings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(response.data);
        } catch (error) {
            setError('Failed to fetch bookings');
        }
    };

    const handleAutoBooking = async () => {
        if (seatsToBook < 1 || seatsToBook > 7) {
            setError("Please select a number between 1 and 7");
            return;
        }

        let seatsToSelect = [];

        // Group seats by rows to facilitate easier seat selection
        const seatsByRow = groupSeatsByRow(seats);

        // Try to select enough available seats in the same row
        for (let rowNumber in seatsByRow) {
            const availableSeats = seatsByRow[rowNumber].filter(seat => !seat.is_booked);

            if (availableSeats.length >= seatsToBook) {
                seatsToSelect = availableSeats.slice(0, seatsToBook);
                break;
            }
        }

        if (seatsToSelect.length === 0) {
            // If not enough seats are available in the same row, find nearby seats
            let nearbySeats = [];
            let remainingSeats = seatsToBook;

            // Search for available seats across consecutive rows
            for (let rowNumber in seatsByRow) {
                const availableSeats = seatsByRow[rowNumber].filter(seat => !seat.is_booked);
                nearbySeats = [...nearbySeats, ...availableSeats];
                remainingSeats -= availableSeats.length;
                if (remainingSeats <= 0) break;
            }

            // If enough nearby seats are found, select them
            if (nearbySeats.length >= seatsToBook) {
                seatsToSelect = nearbySeats.slice(0, seatsToBook);
            } else {
                setError("Not enough available seats.");
                return;
            }
        }

        // Proceed with booking the selected seats
        const selectedSeatIds = seatsToSelect.map(seat => seat.id);

        try {
            await axios.post('https://workwise-task-g8sm.onrender.com/api/bookings', 
                { seatIds: selectedSeatIds },
                { headers: { Authorization: `Bearer ${token}` }}
            );
            setSelectedSeats(selectedSeatIds);
            fetchSeats();
            fetchBookings();
        } catch (error) {
            setError(error.response?.data?.error || 'Booking failed');
        }
    };

    const handleCancelBooking = async (bookingId) => {
        try {
            await axios.delete(`https://workwise-task-g8sm.onrender.com/api/bookings/${bookingId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSeats();
            fetchBookings();
        } catch (error) {
            setError(error.response?.data?.error || 'Failed to cancel booking');
        }
    };

    const groupSeatsByRow = (seats) => {
        return seats.reduce((acc, seat) => {
            if (!acc[seat.row_number]) {
                acc[seat.row_number] = [];
            }
            acc[seat.row_number].push(seat);
            return acc;
        }, {});
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-bold text-indigo-900 mb-2">Train Seat Booking</h1>
                    <p className="text-gray-600">Select your preferred seats for a comfortable journey</p>
                </div>

                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg shadow-sm mb-6">
                        <div className="flex">
                            <div className="flex-shrink-0">
                                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <p className="text-sm text-red-700">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-6 mb-6">
                    {/* Left side - Compact Seat Map */}
                    <div className="lg:w-1/2 bg-white rounded-xl shadow-lg p-6 backdrop-blur-lg bg-opacity-90">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Seat Map</h2>
                        <div className="grid grid-cols-7 gap-2 mb-4">
                            {seats.map((seat) => (
                                <motion.div
                                    key={seat.id}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className={`relative group cursor-pointer rounded-lg overflow-hidden shadow-sm
                                        ${seat.is_booked 
                                            ? 'bg-gradient-to-br from-red-500 to-red-600' 
                                            : 'bg-gradient-to-br from-green-500 to-green-600'}`}
                                    onClick={() => {
                                        if (!seat.is_booked) {
                                            setSelectedSeats(prev => {
                                                if (prev.includes(seat.id)) {
                                                    return prev.filter(id => id !== seat.id);
                                                } else {
                                                    return [...prev, seat.id];
                                                }
                                            });
                                        }
                                    }}
                                >
                                    <div className="p-2 text-center">
                                        <span className="text-white font-medium text-sm">{seat.seat_number}</span>
                                        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-200"></div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Right side - Booking Controls */}
                    <div className="lg:w-1/2 bg-white rounded-xl shadow-lg p-6 backdrop-blur-lg bg-opacity-90 h-fit">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Book Your Seats</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Number of Seats
                                </label>
                                <select
                                    value={seatsToBook}
                                    onChange={(e) => setSeatsToBook(parseInt(e.target.value))}
                                    className="w-full px-3 py-2 border-2 border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                                >
                                    {[...Array(7).keys()].map((num) => (
                                        <option key={num + 1} value={num + 1}>
                                            {num + 1} Seat{num + 1 > 1 ? 's' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={handleAutoBooking}
                                disabled={seatsToBook === 0}
                                className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg 
                                        hover:from-indigo-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-200
                                        disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                Auto-Book {seatsToBook} Seat{seatsToBook > 1 ? 's' : ''}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Bottom section - Booking History */}
                {bookings.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-6 backdrop-blur-lg bg-opacity-90">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Booking History</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {bookings.map((booking) => (
                                <div 
                                    key={booking.id} 
                                    className="flex justify-between items-center p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                                >
                                    <div>
                                        <div className="font-medium text-gray-800">Booking ID: {booking.id}</div>
                                        <div className="text-indigo-600 font-medium mt-1">
                                            Seats: {booking.seats.join(', ')}
                                        </div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            {new Date(booking.booking_time).toLocaleString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCancelBooking(booking.id)}
                                        className="px-3 py-1.5 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm rounded-lg hover:scale-105 transform transition-all duration-200"
                                    >
                                        Cancel Booking
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SeatBooking;
