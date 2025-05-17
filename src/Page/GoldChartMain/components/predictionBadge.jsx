import { Badge } from '@/components/ui/badge';
import { format as formatDateFns } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

const PredictionBadge = ({ date = new Date() }) => {
  const { t, i18n } = useTranslation();
    const formatDate = (date) => {
    const day = date.getDate();
    const months = t('goldChart.time.months', { returnObjects: true });
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    return `${day} ${month} ${year}`;
  };
  
  return (
    <div className={cn(
      "px-3 py-1 rounded-md border text-sm",
      "bg-card/40 border-border"
    )}>
      <span className="text-muted-foreground">{t('goldChart.prediction.updateText')} : </span>
      <span className="text-foreground font-medium">
        {formatDate(date)}
      </span>
    </div>
  );
};

export default PredictionBadge;
