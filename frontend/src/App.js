import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import SeatBooking from './components/SeatBooking';
import Navbar from './components/Navbar';

const PrivateRoute = ({ children }) => {
    const { token } = useAuth();
    return token ? children : <Navigate to="/login" />;
};

const App = () => {
    return (
        <AuthProvider>
            <Router>
              <Navbar/>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route
                        path="/booking"
                        element={
                            <PrivateRoute>
                                <SeatBooking />
                            </PrivateRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/booking" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
};

export default App;