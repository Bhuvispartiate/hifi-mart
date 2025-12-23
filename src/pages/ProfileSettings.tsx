import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  getUserProfile, 
  createUserProfile, 
  updateUserProfile,
  UserProfile,
  UserPreferences 
} from '@/lib/userProfile';
import { EditProfileDialog } from '@/components/profile/EditProfileDialog';
import { AddressManager } from '@/components/profile/AddressManager';

const ProfileSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [preferences, setPreferences] = useState<UserPreferences>({
    pushNotifications: true,
    smsAlerts: true,
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    setLoading(true);
    let fetchedProfile = await getUserProfile(user.uid);
    
    // Create profile if it doesn't exist
    if (!fetchedProfile) {
      await createUserProfile({
        uid: user.uid,
        displayName: user.displayName || 'User',
        phoneNumber: user.phoneNumber,
        preferences: {
          pushNotifications: true,
          smsAlerts: true,
        },
      });
      fetchedProfile = await getUserProfile(user.uid);
    }
    
    if (fetchedProfile) {
      setProfile(fetchedProfile);
      setPreferences(fetchedProfile.preferences);
    }
    setLoading(false);
  };

  const handlePreferenceChange = async (key: keyof UserPreferences, value: boolean) => {
    if (!user) return;
    
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    
    const success = await updateUserProfile(user.uid, { preferences: newPreferences });
    if (!success) {
      // Revert on failure
      setPreferences(preferences);
      toast({
        title: 'Error',
        description: 'Could not update preferences',
        variant: 'destructive',
      });
    }
  };

  const handleProfileUpdated = (newName: string) => {
    if (profile) {
      setProfile({ ...profile, displayName: newName });
    }
  };

  if (!user) {
    navigate('/auth');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/account')}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Profile Settings</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Profile Info */}
        <Card className="p-4 border border-border">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-foreground text-lg">
                {profile?.displayName || 'User'}
              </h2>
              <p className="text-sm text-muted-foreground">{user.phoneNumber}</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditDialogOpen(true)}>
              Edit
            </Button>
          </div>
        </Card>

        {/* Addresses */}
        <Card className="p-4 border border-border">
          <AddressManager uid={user.uid} />
        </Card>

        {/* Preferences */}
        <Card className="border border-border p-4">
          <h3 className="font-medium text-foreground mb-4">Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Push Notifications
                </p>
                <p className="text-xs text-muted-foreground">
                  Get order updates & offers
                </p>
              </div>
              <Switch 
                checked={preferences.pushNotifications}
                onCheckedChange={(checked) => handlePreferenceChange('pushNotifications', checked)}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  SMS Alerts
                </p>
                <p className="text-xs text-muted-foreground">
                  Delivery updates via SMS
                </p>
              </div>
              <Switch 
                checked={preferences.smsAlerts}
                onCheckedChange={(checked) => handlePreferenceChange('smsAlerts', checked)}
              />
            </div>
          </div>
        </Card>
      </main>

      {/* Edit Profile Dialog */}
      <EditProfileDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        uid={user.uid}
        currentName={profile?.displayName || ''}
        onProfileUpdated={handleProfileUpdated}
      />
    </div>
  );
};

export default ProfileSettings;
