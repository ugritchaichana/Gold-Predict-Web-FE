import { Badge } from '@/components/ui/badge';
import { format as formatDateFns } from 'date-fns';
import { cn } from '@/lib/utils';

const PredictionBadge = ({ date = new Date() }) => {
  return (
    <div className={cn(
      "px-3 py-1 rounded-md border text-sm",
      "bg-card/40 border-border"
    )}>
      <span className="text-muted-foreground">Prediction update : </span>
      <span className="text-foreground font-medium">
        {formatDateFns(date, 'd MMMM yyyy')}
      </span>
    </div>
  );
};

export default PredictionBadge;
