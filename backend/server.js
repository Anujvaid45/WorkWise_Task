const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authMiddleware = require('./middleware/auth')
const bookingController = require('./controllers/bookingController');
 const authController = require('./controllers/authContoller');

const app = express();

app.use(cors());
app.use(express.json());

// Auth routes
app.post('/api/register', authController.register);
app.post('/api/login', authController.login);

// Booking routes
app.get('/api/seats', authMiddleware, bookingController.getSeats);
app.post('/api/bookings', authMiddleware, bookingController.createBooking);
app.get('/api/bookings', authMiddleware, bookingController.getUserBookings);
app.delete('/api/bookings/:id', authMiddleware, bookingController.cancelBooking);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});