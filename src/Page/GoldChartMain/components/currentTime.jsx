import { useState, useEffect } from 'react';
const CurrentTime = () => {
    const [time, setTime] = useState('');
    
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');
            const timeString = `${hours}:${minutes}:${seconds} (+7)`;
            setTime(timeString);
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="text-sm text-muted-foreground">
            <span>{time}</span>
        </div>
    );
};

export default CurrentTime;
