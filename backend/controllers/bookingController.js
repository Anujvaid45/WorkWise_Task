const pool = require('../config/db');

const getSeats = async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM seats ORDER BY row_number, seat_number'
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const createBooking = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { seatIds } = req.body;
        if (!seatIds || seatIds.length === 0 || seatIds.length > 7) {
            throw new Error('Invalid number of seats');
        }
        
        // Check if seats are available
        const seatCheck = await client.query(
            'SELECT id FROM seats WHERE id = ANY($1) AND is_booked = TRUE',
            [seatIds]
        );
        
        if (seatCheck.rows.length > 0) {
            throw new Error('Some selected seats are already booked');
        }
        
        // Create booking
        const booking = await client.query(
            'INSERT INTO bookings (user_id) VALUES ($1) RETURNING id',
            [req.user.id]
        );
        
        // Add seats to booking
        for (const seatId of seatIds) {
            await client.query(
                'INSERT INTO booking_seats (booking_id, seat_id) VALUES ($1, $2)',
                [booking.rows[0].id, seatId]
            );
            
            await client.query(
                'UPDATE seats SET is_booked = TRUE WHERE id = $1',
                [seatId]
            );
        }
        
        await client.query('COMMIT');
        res.status(201).json({ message: 'Booking successful', bookingId: booking.rows[0].id });
    } catch (error) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};

const getUserBookings = async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT b.id, b.booking_time, array_agg(s.seat_number) as seats
             FROM bookings b
             JOIN booking_seats bs ON b.id = bs.booking_id
             JOIN seats s ON bs.seat_id = s.id
             WHERE b.user_id = $1
             GROUP BY b.id, b.booking_time
             ORDER BY b.booking_time DESC`,
            [req.user.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const cancelBooking = async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const booking = await client.query(
            'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
            [req.params.id, req.user.id]
        );
        
        if (booking.rows.length === 0) {
            throw new Error('Booking not found');
        }

        // Update seats to available
        await client.query(
            `UPDATE seats SET is_booked = FALSE 
             WHERE id IN (
                SELECT seat_id FROM booking_seats WHERE booking_id = $1
             )`,
            [req.params.id]
        );
        // Delete associated rows in booking_seats
        await client.query(
            'DELETE FROM booking_seats WHERE booking_id = $1',
            [req.params.id]
        );
        
        await client.query('COMMIT');
        res.json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        
        // Log the error to the console
        console.error('Error in cancelBooking:', error.message, error.stack);
        
        res.status(500).json({ error: error.message });
    } finally {
        client.release();
    }
};



module.exports = { getSeats, createBooking, getUserBookings, cancelBooking };