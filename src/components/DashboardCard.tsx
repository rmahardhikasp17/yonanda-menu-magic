import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
  onClick: () => void;
}

export function DashboardCard({
  title,
  description,
  icon: Icon,
  colorClass,
  onClick,
}: DashboardCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'touch-card flex flex-col items-center justify-center gap-4 rounded-2xl p-8 text-white shadow-lg',
        'min-h-[200px] w-full',
        colorClass
      )}
    >
      <Icon className="h-16 w-16" strokeWidth={1.5} />
      <div className="text-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="mt-1 text-sm opacity-90">{description}</p>
      </div>
    </button>
  );
}
