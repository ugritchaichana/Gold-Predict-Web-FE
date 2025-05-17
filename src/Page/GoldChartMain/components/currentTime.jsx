import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const CurrentTime = () => {
    const [time, setTime] = useState('');
    const { t } = useTranslation();
    
    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');
              // Add date format dd MMM yyyy
            const day = now.getDate().toString().padStart(2, '0');
            const months = t('goldChart.time.months', { returnObjects: true });
            const month = months[now.getMonth()];
            const days = t('goldChart.time.days', { returnObjects: true });
            const dayOfWeek = days[now.getDay()];
            const year = now.getFullYear();
            
            const timeString = `${dayOfWeek} ${day} ${month} ${year} ${hours}:${minutes}:${seconds} (+7)`;
            setTime(timeString);
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [t]);    
    
    return (
        <div className={cn(
            "px-3 py-1 rounded-md border text-sm",
            "bg-card/40 border-border text-muted-foreground"
        )}>
            {time}
        </div>
    );
};

export default CurrentTime;
