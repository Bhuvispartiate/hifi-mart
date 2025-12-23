import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { updateUserProfile } from '@/lib/userProfile';
import { Loader2 } from 'lucide-react';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  uid: string;
  currentName: string;
  onProfileUpdated: (newName: string) => void;
}

export const EditProfileDialog = ({
  open,
  onOpenChange,
  uid,
  currentName,
  onProfileUpdated,
}: EditProfileDialogProps) => {
  const [displayName, setDisplayName] = useState(currentName);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      toast({
        title: 'Invalid Name',
        description: 'Please enter a valid name',
        variant: 'destructive',
      });
      return;
    }

    if (trimmedName.length > 50) {
      toast({
        title: 'Name Too Long',
        description: 'Name must be less than 50 characters',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    const success = await updateUserProfile(uid, { displayName: trimmedName });
    setLoading(false);

    if (success) {
      toast({
        title: 'Profile Updated',
        description: 'Your display name has been updated',
      });
      onProfileUpdated(trimmedName);
      onOpenChange(false);
    } else {
      toast({
        title: 'Update Failed',
        description: 'Could not update your profile. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your display name
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                maxLength={50}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
