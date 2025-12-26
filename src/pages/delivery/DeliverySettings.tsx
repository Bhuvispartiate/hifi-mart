import { useState, useEffect } from 'react';
import { 
  Bell, Volume2, Vibrate, MapPin, Moon, 
  ChevronLeft, ToggleLeft, ToggleRight,
  VolumeX, Volume1
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { DeliveryBottomNav } from '@/components/delivery/DeliveryBottomNav';
import { useNavigate } from 'react-router-dom';
import { useDeliveryAuth } from '@/contexts/DeliveryAuthContext';
import { playOrderAlertSound, playSuccessSound, playDeliveryUpdateSound, stopNotificationSound } from '@/lib/notificationSounds';
import { triggerOrderAlertVibration, triggerImpact, triggerNotification } from '@/lib/haptics';
import { toast } from '@/hooks/use-toast';

interface NotificationPreferences {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  volume: number;
  orderAlertSound: boolean;
  deliveryUpdateSound: boolean;
  backgroundLocationEnabled: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  soundEnabled: true,
  vibrationEnabled: true,
  volume: 80,
  orderAlertSound: true,
  deliveryUpdateSound: true,
  backgroundLocationEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
};

export default function DeliverySettings() {
  const navigate = useNavigate();
  const { deliveryPartner, isAuthenticated } = useDeliveryAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/delivery/login');
      return;
    }

    // Load saved preferences from localStorage
    const savedPrefs = localStorage.getItem(`delivery_prefs_${deliveryPartner?.id}`);
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }
  }, [isAuthenticated, deliveryPartner?.id, navigate]);

  const savePreferences = (newPrefs: NotificationPreferences) => {
    setPreferences(newPrefs);
    if (deliveryPartner?.id) {
      localStorage.setItem(`delivery_prefs_${deliveryPartner.id}`, JSON.stringify(newPrefs));
    }
  };

  const updatePreference = <K extends keyof NotificationPreferences>(
    key: K, 
    value: NotificationPreferences[K]
  ) => {
    const newPrefs = { ...preferences, [key]: value };
    savePreferences(newPrefs);
  };

  const testOrderAlertSound = async () => {
    if (preferences.soundEnabled && preferences.orderAlertSound) {
      playOrderAlertSound({ volume: preferences.volume / 100 });
    }
    if (preferences.vibrationEnabled) {
      await triggerOrderAlertVibration();
    }
    toast({
      title: "Test Alert",
      description: "This is how new order alerts will sound and feel.",
    });
  };

  const testDeliveryUpdateSound = async () => {
    if (preferences.soundEnabled && preferences.deliveryUpdateSound) {
      playDeliveryUpdateSound({ volume: preferences.volume / 100 });
    }
    if (preferences.vibrationEnabled) {
      await triggerImpact('medium');
    }
    toast({
      title: "Test Update",
      description: "This is how delivery updates will sound and feel.",
    });
  };

  const testSuccessSound = async () => {
    if (preferences.soundEnabled) {
      playSuccessSound({ volume: preferences.volume / 100 });
    }
    if (preferences.vibrationEnabled) {
      await triggerNotification('success');
    }
  };

  if (!deliveryPartner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 pt-12">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => navigate('/delivery/profile')}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-xl font-bold">Notification Settings</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Sound Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Volume2 className="w-5 h-5" />
              Sound Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="sound-enabled">Enable Sounds</Label>
                <p className="text-sm text-muted-foreground">
                  Play sounds for notifications
                </p>
              </div>
              <Switch
                id="sound-enabled"
                checked={preferences.soundEnabled}
                onCheckedChange={(checked) => updatePreference('soundEnabled', checked)}
              />
            </div>

            {preferences.soundEnabled && (
              <>
                <Separator />
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Volume</Label>
                    <div className="flex items-center gap-2">
                      {preferences.volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-muted-foreground" />
                      ) : preferences.volume < 50 ? (
                        <Volume1 className="w-4 h-4 text-muted-foreground" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="text-sm w-10 text-right">{preferences.volume}%</span>
                    </div>
                  </div>
                  <Slider
                    value={[preferences.volume]}
                    onValueChange={([value]) => updatePreference('volume', value)}
                    max={100}
                    step={5}
                    className="w-full"
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="order-alert-sound">Order Alert Sound</Label>
                    <p className="text-sm text-muted-foreground">
                      Distinctive sound for new orders
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={testOrderAlertSound}
                    >
                      Test
                    </Button>
                    <Switch
                      id="order-alert-sound"
                      checked={preferences.orderAlertSound}
                      onCheckedChange={(checked) => updatePreference('orderAlertSound', checked)}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="delivery-update-sound">Delivery Update Sound</Label>
                    <p className="text-sm text-muted-foreground">
                      Sound for status updates
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={testDeliveryUpdateSound}
                    >
                      Test
                    </Button>
                    <Switch
                      id="delivery-update-sound"
                      checked={preferences.deliveryUpdateSound}
                      onCheckedChange={(checked) => updatePreference('deliveryUpdateSound', checked)}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Vibration Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Vibrate className="w-5 h-5" />
              Vibration Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="vibration-enabled">Enable Vibration</Label>
                <p className="text-sm text-muted-foreground">
                  Vibrate for notifications and alerts
                </p>
              </div>
              <Switch
                id="vibration-enabled"
                checked={preferences.vibrationEnabled}
                onCheckedChange={(checked) => updatePreference('vibrationEnabled', checked)}
              />
            </div>

            {preferences.vibrationEnabled && (
              <>
                <Separator />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Test Vibration Pattern</Label>
                    <p className="text-sm text-muted-foreground">
                      Feel the order alert vibration
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => triggerOrderAlertVibration()}
                  >
                    Test
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Location Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5" />
              Location Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="bg-location">Background Location</Label>
                <p className="text-sm text-muted-foreground">
                  Track location while app is in background
                </p>
              </div>
              <Switch
                id="bg-location"
                checked={preferences.backgroundLocationEnabled}
                onCheckedChange={(checked) => updatePreference('backgroundLocationEnabled', checked)}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Required for live tracking during deliveries. Uses more battery.
            </p>
          </CardContent>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Moon className="w-5 h-5" />
              Quiet Hours
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
                <p className="text-sm text-muted-foreground">
                  Mute non-urgent notifications
                </p>
              </div>
              <Switch
                id="quiet-hours"
                checked={preferences.quietHoursEnabled}
                onCheckedChange={(checked) => updatePreference('quietHoursEnabled', checked)}
              />
            </div>

            {preferences.quietHoursEnabled && (
              <>
                <Separator />
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quiet-start">Start Time</Label>
                    <input
                      id="quiet-start"
                      type="time"
                      value={preferences.quietHoursStart}
                      onChange={(e) => updatePreference('quietHoursStart', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quiet-end">End Time</Label>
                    <input
                      id="quiet-end"
                      type="time"
                      value={preferences.quietHoursEnd}
                      onChange={(e) => updatePreference('quietHoursEnd', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md bg-background"
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Order alerts will still play during quiet hours for active deliveries.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Reset Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={() => {
            savePreferences(DEFAULT_PREFERENCES);
            toast({
              title: "Settings Reset",
              description: "Notification preferences restored to defaults.",
            });
          }}
        >
          Reset to Defaults
        </Button>
      </div>

      <DeliveryBottomNav />
    </div>
  );
}
