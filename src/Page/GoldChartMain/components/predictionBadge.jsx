import { Badge } from '@/components/ui/badge';
import { format as formatDateFns } from 'date-fns';

const PredictionBadge = ({ date = new Date() }) => {
  return (
    <Badge variant="outline" className="bg-gray-100 dark:bg-gray-800/30">
      <span className="text-gray-600 dark:text-gray-400">Prediction update : </span>
      <span className="text-gray-800 dark:text-gray-300 font-medium ml-1">
        {formatDateFns(date, 'd MMMM yyyy')}
      </span>
    </Badge>
  );
};

export default PredictionBadge;
