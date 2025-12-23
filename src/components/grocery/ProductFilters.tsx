import { useState, useMemo } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface Category {
  id: string;
  name: string;
  icon?: string;
}

interface ProductFiltersProps {
  categories: Category[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  priceRange: [number, number];
  onPriceRangeChange: (range: [number, number]) => void;
  maxPrice: number;
  onReset: () => void;
  activeFiltersCount: number;
}

export const ProductFilters = ({
  categories,
  selectedCategories,
  onCategoriesChange,
  priceRange,
  onPriceRangeChange,
  maxPrice,
  onReset,
  activeFiltersCount,
}: ProductFiltersProps) => {
  const [open, setOpen] = useState(false);
  const [localCategories, setLocalCategories] = useState(selectedCategories);
  const [localPriceRange, setLocalPriceRange] = useState<[number, number]>(priceRange);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) {
      setLocalCategories(selectedCategories);
      setLocalPriceRange(priceRange);
    }
    setOpen(isOpen);
  };

  const handleCategoryToggle = (categoryId: string) => {
    setLocalCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleApply = () => {
    onCategoriesChange(localCategories);
    onPriceRangeChange(localPriceRange);
    setOpen(false);
  };

  const handleReset = () => {
    setLocalCategories([]);
    setLocalPriceRange([0, maxPrice]);
    onReset();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs relative">
          <SlidersHorizontal className="w-3.5 h-3.5 mr-1" />
          Filters
          {activeFiltersCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
              {activeFiltersCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl">
        <SheetHeader className="text-left pb-4">
          <SheetTitle className="flex items-center justify-between">
            <span>Filters</span>
            {(localCategories.length > 0 || localPriceRange[0] > 0 || localPriceRange[1] < maxPrice) && (
              <Button variant="ghost" size="sm" onClick={handleReset} className="text-destructive">
                <X className="w-4 h-4 mr-1" />
                Clear all
              </Button>
            )}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 overflow-y-auto pb-20">
          {/* Price Range */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold">Price Range</Label>
            <div className="px-2">
              <Slider
                value={localPriceRange}
                onValueChange={(value) => setLocalPriceRange(value as [number, number])}
                max={maxPrice}
                min={0}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                <span>₹{localPriceRange[0]}</span>
                <span>₹{localPriceRange[1]}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Categories */}
          <div className="space-y-4">
            <Label className="text-sm font-semibold">Categories</Label>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Badge
                  key={category.id}
                  variant={localCategories.includes(category.id) ? 'default' : 'secondary'}
                  className="cursor-pointer px-3 py-1.5 text-xs"
                  onClick={() => handleCategoryToggle(category.id)}
                >
                  {category.icon} {category.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="absolute bottom-0 left-0 right-0 p-4 bg-background border-t border-border">
          <div className="flex gap-3 w-full">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
