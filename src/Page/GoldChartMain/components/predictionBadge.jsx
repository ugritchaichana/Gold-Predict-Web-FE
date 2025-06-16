import { Badge } from '@/components/ui/badge';
import { format as formatDateFns } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useLastPredictDate } from '../hook/fetchData';

const PredictionBadge = ({ date = new Date() }) => {
  const { t, i18n } = useTranslation();
  const { lastPredictDate, isLoading, isError } = useLastPredictDate();
  const formatDate = (dateToFormat) => {
    const day = dateToFormat.getDate();
    const months = t('goldChart.time.months', { returnObjects: true });
    const days = t('goldChart.time.days', { returnObjects: true });
    
    const dayOfWeek = days[dateToFormat.getDay()];
    const month = months[dateToFormat.getMonth()];
    const year = dateToFormat.getFullYear();
    
    return `${dayOfWeek} ${day} ${month} ${year}`;
  };
    return (
    <div className={cn(
      "px-3 py-1 rounded-md border text-sm",
      "bg-card/40 border-border"
    )}>
      <span className="text-muted-foreground">{t('goldChart.prediction.updateText')} : </span>      <span className="text-foreground font-medium">
        {isLoading ? (
          <span className="animate-pulse">Loading...</span>
        ) : isError ? (
          formatDate(date)
        ) : (
          formatDate(lastPredictDate || date)
        )}
      </span>
    </div>
  );
};

export default PredictionBadge;
