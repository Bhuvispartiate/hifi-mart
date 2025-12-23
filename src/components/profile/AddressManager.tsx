import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  getUserAddresses, 
  addUserAddress, 
  updateUserAddress, 
  deleteUserAddress,
  UserAddress 
} from '@/lib/userProfile';
import { MapPin, Plus, Edit2, Trash2, Star, Loader2 } from 'lucide-react';

interface AddressManagerProps {
  uid: string;
}

export const AddressManager = ({ uid }: AddressManagerProps) => {
  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Form state
  const [label, setLabel] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [isDefault, setIsDefault] = useState(false);

  useEffect(() => {
    loadAddresses();
  }, [uid]);

  const loadAddresses = async () => {
    setLoading(true);
    const fetchedAddresses = await getUserAddresses(uid);
    setAddresses(fetchedAddresses);
    setLoading(false);
  };

  const resetForm = () => {
    setLabel('');
    setFullAddress('');
    setLandmark('');
    setIsDefault(false);
    setEditingAddress(null);
  };

  const openAddDialog = () => {
    resetForm();
    setDialogOpen(true);
  };

  const openEditDialog = (address: UserAddress) => {
    setEditingAddress(address);
    setLabel(address.label);
    setFullAddress(address.fullAddress);
    setLandmark(address.landmark || '');
    setIsDefault(address.isDefault);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedLabel = label.trim();
    const trimmedAddress = fullAddress.trim();

    if (!trimmedLabel || trimmedLabel.length > 30) {
      toast({
        title: 'Invalid Label',
        description: 'Please enter a label (max 30 characters)',
        variant: 'destructive',
      });
      return;
    }

    if (!trimmedAddress || trimmedAddress.length > 200) {
      toast({
        title: 'Invalid Address',
        description: 'Please enter a valid address (max 200 characters)',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    const addressData = {
      label: trimmedLabel,
      fullAddress: trimmedAddress,
      landmark: landmark.trim() || undefined,
      isDefault,
    };

    let success = false;
    if (editingAddress) {
      success = await updateUserAddress(uid, editingAddress.id, addressData);
    } else {
      const newId = await addUserAddress(uid, addressData);
      success = !!newId;
    }

    setSaving(false);

    if (success) {
      toast({
        title: editingAddress ? 'Address Updated' : 'Address Added',
        description: editingAddress 
          ? 'Your address has been updated' 
          : 'New address has been added',
      });
      setDialogOpen(false);
      resetForm();
      loadAddresses();
    } else {
      toast({
        title: 'Error',
        description: 'Could not save address. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async () => {
    if (!addressToDelete) return;

    const success = await deleteUserAddress(uid, addressToDelete);
    
    if (success) {
      toast({
        title: 'Address Deleted',
        description: 'The address has been removed',
      });
      loadAddresses();
    } else {
      toast({
        title: 'Error',
        description: 'Could not delete address. Please try again.',
        variant: 'destructive',
      });
    }
    
    setDeleteDialogOpen(false);
    setAddressToDelete(null);
  };

  const confirmDelete = (addressId: string) => {
    setAddressToDelete(addressId);
    setDeleteDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground">Saved Addresses</h3>
        <Button size="sm" variant="outline" onClick={openAddDialog}>
          <Plus className="w-4 h-4 mr-1" />
          Add New
        </Button>
      </div>

      {addresses.length === 0 ? (
        <Card className="p-6 text-center border border-dashed border-border">
          <MapPin className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No addresses saved yet</p>
          <Button size="sm" variant="link" onClick={openAddDialog}>
            Add your first address
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {addresses.map((address) => (
            <Card key={address.id} className="p-4 border border-border">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground text-sm">{address.label}</span>
                    {address.isDefault && (
                      <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        <Star className="w-3 h-3 fill-current" />
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{address.fullAddress}</p>
                  {address.landmark && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Landmark: {address.landmark}
                    </p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => openEditDialog(address)}
                  >
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => confirmDelete(address.id)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
            <DialogDescription>
              {editingAddress ? 'Update your delivery address' : 'Add a new delivery address'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="label">Label</Label>
                <Input
                  id="label"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g., Home, Office, etc."
                  maxLength={30}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullAddress">Full Address</Label>
                <Input
                  id="fullAddress"
                  value={fullAddress}
                  onChange={(e) => setFullAddress(e.target.value)}
                  placeholder="Enter complete address"
                  maxLength={200}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="landmark">Landmark (Optional)</Label>
                <Input
                  id="landmark"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  placeholder="Nearby landmark"
                  maxLength={100}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isDefault"
                  checked={isDefault}
                  onCheckedChange={(checked) => setIsDefault(checked === true)}
                />
                <Label htmlFor="isDefault" className="text-sm font-normal">
                  Set as default address
                </Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {editingAddress ? 'Update' : 'Add Address'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Address?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This address will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
