import { Check, Circle } from 'lucide-react';
import { STATUS_LABELS, STATUS_ORDER } from '@/lib/constants';
import type { CollectionStatus } from '@/types';

export function StatusTimeline({ currentStatus }: { currentStatus: CollectionStatus }) {
  const currentIdx = STATUS_ORDER.indexOf(currentStatus);
  const isCompleted = currentStatus === 'collection_completed';

  return (
    <div className="flex items-center justify-between relative">
      <div className="absolute left-0 right-0 top-4 h-0.5 bg-forest-100" />
      <div
        className={`absolute left-0 top-4 h-0.5 bg-forest-500 transition-all duration-500`}
        style={{ width: `${(currentIdx / (STATUS_ORDER.length - 1)) * 100}%` }}
      />
      {STATUS_ORDER.map((status, idx) => {
        const isPassed = idx <= currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={status} className="relative flex flex-col items-center gap-2 z-10">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                isPassed
                  ? 'bg-forest-500 text-white'
                  : 'bg-white border-2 border-forest-100 text-charcoal-300'
              } ${isCurrent ? 'ring-4 ring-forest-100 scale-110' : ''} ${
                isCompleted && idx === STATUS_ORDER.length - 1 ? 'bg-emerald-500' : ''
              }`}
            >
              {isPassed ? <Check size={16} /> : <Circle size={8} />}
            </div>
            <span
              className={`text-[10px] font-medium text-center max-w-[60px] leading-tight ${
                isPassed ? 'text-forest-700' : 'text-charcoal-400'
              }`}
            >
              {STATUS_LABELS[status]}
            </span>
          </div>
        );
      })}
    </div>
  );
}
