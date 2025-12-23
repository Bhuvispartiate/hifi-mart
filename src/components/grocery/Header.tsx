import { useState } from 'react';
import { MapPin, ChevronDown, Search, ShoppingCart, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useLocation } from '@/contexts/LocationContext';
import { LocationPicker } from '@/components/checkout/LocationPicker';
import { Link } from 'react-router-dom';

interface HeaderProps {
  showSearch?: boolean;
  onCartClick?: () => void;
}

export const Header = ({ showSearch = true, onCartClick }: HeaderProps) => {
  const { totalItems } = useCart();
  const { location, isLoading, refreshLocation, setLocation } = useLocation();
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);

  const handleLocationSelect = (selectedLocation: { lat: number; lng: number; address: string }) => {
    setLocation({
      lat: selectedLocation.lat,
      lng: selectedLocation.lng,
      address: selectedLocation.address,
      label: 'Selected Location',
    });
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="px-4 py-3">
          {/* Location & Cart Row */}
          <div className="flex items-center justify-between mb-3">
            <button 
              className="flex items-center gap-1 text-left"
              onClick={() => setLocationPickerOpen(true)}
            >
              <MapPin className="w-5 h-5 text-primary" />
              <div>
                <div className="flex items-center gap-0.5">
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <span className="text-sm font-semibold text-foreground">
                        {location?.label || 'Set Location'}
                      </span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1 max-w-[200px]">
                  {isLoading ? 'Detecting location...' : (location?.address || 'Tap to set delivery location')}
                </p>
              </div>
            </button>

            <div className="flex items-center gap-2">
              <Badge 
                variant="secondary" 
                className="bg-secondary text-secondary-foreground text-[10px] px-2 py-1 font-medium"
              >
                🚀 10-15 mins
              </Badge>
              <Button
                variant="ghost"
                size="icon"
                className="relative"
                onClick={onCartClick}
              >
                <ShoppingCart className="w-5 h-5 text-foreground" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          {showSearch && (
            <Link to="/categories">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search for groceries, fruits, snacks..."
                  className="pl-10 bg-muted border-0 h-11 rounded-xl text-sm"
                  readOnly
                />
              </div>
            </Link>
          )}
        </div>
      </header>

      <LocationPicker
        open={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={location ? { lat: location.lat, lng: location.lng } : undefined}
      />
    </>
  );
};
