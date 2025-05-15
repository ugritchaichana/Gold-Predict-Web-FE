import { Badge } from '@/components/ui/badge';
import { format as formatDateFns } from 'date-fns';

const PredictionBadge = ({ date = new Date() }) => {
  return (
    <div className="bg-gray-100 px-3 py-1 rounded-md border border-gray-300 text-sm">
      <span className="text-gray-600 dark:text-gray-400">Prediction update : </span>
      <span className="text-gray-800 dark:text-gray-300 font-medium">
        {formatDateFns(date, 'd MMMM yyyy')}
      </span>
    </div>
  );
};

export default PredictionBadge;
