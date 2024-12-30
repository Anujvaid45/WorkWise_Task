const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

const corsOptions = {
    origin: 'https://work-wise-task.vercel.app', // Your frontend's URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
    credentials: true, // Allow cookies/credentials if needed
};

app.use(cors(corsOptions));

app.use(express.json());

// Use routes
app.use('/api', authRoutes); // Auth routes
app.use('/api', bookingRoutes); // Booking routes

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
