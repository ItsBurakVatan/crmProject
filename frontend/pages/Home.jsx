import React, { useState, useEffect } from 'react';
import Navbar from './Navbar';
import "../styles/home.css";

const Home = () => {
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    const currentDate = currentTime.toLocaleDateString();
    const currentHour = currentTime.toLocaleTimeString();

    return (
        <div>
            <Navbar />
            <div className="home-container">
                <div className="welcome-message">
                    <h1>Hoş Geldiniz!</h1>
                    <p>Bugün: {currentDate}</p>
                    <p>Saat: {currentHour}</p>
                </div>
                <div className="home-info">
                    <h2>Güncel Bilgiler</h2>
                    <p>Aday cari kartlarınızı yönetmek için üst menüyü kullanabilirsiniz.</p>
                </div>
            </div>
        </div>
    );
};

export default Home;
