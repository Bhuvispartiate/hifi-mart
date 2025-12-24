import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, MapPin, Home, Building, Briefcase, Navigation, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation } from '@/contexts/LocationContext';
import { useToast } from '@/hooks/use-toast';
import { createUserProfile, getUserProfile } from '@/lib/firestoreService';
import { LocationPicker } from '@/components/checkout/LocationPicker';

type AddressType = 'home' | 'work' | 'other';

const addressTypes = [
  { id: 'home' as AddressType, label: 'Home', icon: Home },
  { id: 'work' as AddressType, label: 'Work', icon: Briefcase },
  { id: 'other' as AddressType, label: 'Other', icon: Building },
];

const OnboardingAddress = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { location, refreshLocation, isLoading: locationLoading } = useLocation();
  const { toast } = useToast();
  
  const [addressType, setAddressType] = useState<AddressType>('home');
  const [addressLine, setAddressLine] = useState('');
  const [landmark, setLandmark] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUseCurrentLocation = async () => {
    await refreshLocation();
    if (location) {
      setSelectedLocation({
        lat: location.lat,
        lng: location.lng,
        address: location.address,
      });
    }
  };

  const handleLocationSelect = (loc: { lat: number; lng: number; address: string }) => {
    setSelectedLocation(loc);
  };

  const handleComplete = async () => {
    if (!selectedLocation) {
      toast({
        title: 'Location Required',
        description: 'Please select your delivery location',
        variant: 'destructive',
      });
      return;
    }

    if (!addressLine.trim()) {
      toast({
        title: 'Address Required',
        description: 'Please enter your complete address',
        variant: 'destructive',
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'Please login again',
        variant: 'destructive',
      });
      navigate('/auth');
      return;
    }

    setLoading(true);

    try {
      const name = sessionStorage.getItem('onboarding_name') || 'User';
      const email = sessionStorage.getItem('onboarding_email') || '';

      const fullAddress = [
        addressLine.trim(),
        landmark.trim(),
        selectedLocation.address,
      ].filter(Boolean).join(', ');

      // Check if profile exists
      const existingProfile = await getUserProfile(user.uid);
      
      if (existingProfile) {
        // Update existing profile
        const { updateUserProfile } = await import('@/lib/firestoreService');
        await updateUserProfile(user.uid, {
          displayName: name,
          email: email || undefined,
          addresses: [{
            id: `addr-${Date.now()}`,
            label: addressTypes.find(t => t.id === addressType)?.label || 'Home',
            address: fullAddress,
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            isDefault: true,
          }],
          onboardingCompleted: true,
        });
      } else {
        // Create new profile
        await createUserProfile(user.uid, {
          phoneNumber: user.phoneNumber,
          displayName: name,
          email: email || undefined,
          addresses: [{
            id: `addr-${Date.now()}`,
            label: addressTypes.find(t => t.id === addressType)?.label || 'Home',
            address: fullAddress,
            lat: selectedLocation.lat,
            lng: selectedLocation.lng,
            isDefault: true,
          }],
          onboardingCompleted: true,
        });
      }

      // Clear session storage
      sessionStorage.removeItem('onboarding_name');
      sessionStorage.removeItem('onboarding_email');

      toast({
        title: 'Welcome to HiFi-Mart!',
        description: 'Your profile has been set up successfully',
      });

      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/onboarding/profile')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Delivery Address</h1>
            <p className="text-sm text-muted-foreground">Step 2 of 2</p>
          </div>
        </div>
      </header>

      {/* Progress */}
      <div className="px-4 pt-4">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full w-full transition-all" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6 space-y-6 overflow-y-auto">
        {/* Location Selection */}
        <div className="space-y-3">
          <Label>Delivery Location</Label>
          
          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 gap-3"
            onClick={handleUseCurrentLocation}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            ) : (
              <Navigation className="h-5 w-5 text-primary" />
            )}
            <span>Use Current Location</span>
          </Button>

          <Button
            variant="outline"
            className="w-full justify-start h-auto py-3 gap-3"
            onClick={() => setLocationPickerOpen(true)}
          >
            <MapPin className="h-5 w-5 text-primary" />
            <span>Choose on Map</span>
          </Button>

          {selectedLocation && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">{selectedLocation.address}</p>
              </div>
            </div>
          )}
        </div>

        {/* Address Type */}
        <div className="space-y-3">
          <Label>Save As</Label>
          <div className="flex gap-2">
            {addressTypes.map((type) => (
              <Button
                key={type.id}
                variant={addressType === type.id ? 'default' : 'outline'}
                className="flex-1 gap-2"
                onClick={() => setAddressType(type.id)}
              >
                <type.icon className="h-4 w-4" />
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Address Details */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address">Complete Address *</Label>
            <Input
              id="address"
              placeholder="House/Flat No., Building, Street"
              value={addressLine}
              onChange={(e) => setAddressLine(e.target.value)}
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="landmark">Landmark (Optional)</Label>
            <Input
              id="landmark"
              placeholder="Nearby landmark for easy delivery"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              maxLength={100}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6">
        <Button 
          className="w-full h-12 text-base"
          onClick={handleComplete}
          disabled={loading || !selectedLocation || !addressLine.trim()}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Setting up...
            </>
          ) : (
            'Complete Setup'
          )}
        </Button>
      </div>

      <LocationPicker
        open={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onLocationSelect={handleLocationSelect}
        initialLocation={selectedLocation ? { lat: selectedLocation.lat, lng: selectedLocation.lng } : undefined}
      />
    </div>
  );
};

export default OnboardingAddress;
