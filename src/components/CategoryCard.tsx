import { MenuCategoryInfo } from '@/types/hotel';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: MenuCategoryInfo;
  isSelected: boolean;
  onClick: () => void;
}

export function CategoryCard({ category, isSelected, onClick }: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'touch-card flex flex-col items-center justify-center gap-2 rounded-xl p-4 transition-all',
        'min-h-[100px] w-full border-2',
        isSelected
          ? 'border-primary bg-primary/10 shadow-md'
          : 'border-border bg-card hover:border-primary/50'
      )}
    >
      <span className="text-3xl">{category.icon}</span>
      <span className="text-center text-sm font-medium text-card-foreground">
        {category.label}
      </span>
    </button>
  );
}
