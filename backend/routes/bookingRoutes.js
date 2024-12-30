const express = require('express');
const authMiddleware = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

const router = express.Router();

// Booking routes
router.get('/seats', authMiddleware, bookingController.getSeats);
router.post('/bookings', authMiddleware, bookingController.createBooking);
router.get('/bookings', authMiddleware, bookingController.getUserBookings);
router.delete('/bookings/:id', authMiddleware, bookingController.cancelBooking);

module.exports = router;
