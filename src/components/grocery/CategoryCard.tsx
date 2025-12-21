import { Link } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Category } from '@/data/products';
import { cn } from '@/lib/utils';

interface CategoryCardProps {
  category: Category;
  className?: string;
}

export const CategoryCard = ({ category, className }: CategoryCardProps) => {
  return (
    <Link to={`/categories?cat=${category.id}`}>
      <Card
        className={cn(
          'relative overflow-hidden bg-card border border-border rounded-xl p-2 transition-all hover:shadow-md hover:scale-[1.02] cursor-pointer',
          className
        )}
      >
        <div className="aspect-square rounded-lg overflow-hidden bg-secondary mb-2">
          <img
            src={category.image}
            alt={category.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="text-center">
          <h3 className="text-xs font-medium text-foreground line-clamp-1">
            {category.name}
          </h3>
        </div>
      </Card>
    </Link>
  );
};
