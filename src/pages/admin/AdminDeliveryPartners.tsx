import { useState, useEffect } from 'react';
import { 
  getDeliveryPartners, 
  createDeliveryPartner, 
  updateDeliveryPartner, 
  deleteDeliveryPartner,
  releaseDeliveryPartner,
  cleanupStaleAssignments,
  getOrderById,
  subscribeToDeliveryPartners,
  DeliveryPartner,
  PartnerStatus
} from '@/lib/firestoreService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Truck,
  Phone,
  Star,
  Loader2,
  Package,
  RefreshCw,
  UserX,
  Clock,
  Navigation
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type StatusFilter = 'all' | 'idle' | 'busy';

const statusConfig: Record<PartnerStatus, { label: string; color: string; icon?: typeof Truck }> = {
  idle: { label: 'Idle', color: 'bg-muted text-muted-foreground' },
  assigned: { label: 'Assigned', color: 'bg-primary/20 text-primary' },
  pickup: { label: 'Pickup', color: 'bg-warning/20 text-warning' },
  navigating: { label: 'Navigating', color: 'bg-accent/20 text-accent-foreground', icon: Navigation },
  reached: { label: 'Reached', color: 'bg-success/20 text-success' },
  offline: { label: 'Offline', color: 'bg-destructive/20 text-destructive' },
};

const formatDuration = (seconds?: number) => {
  if (!seconds || !Number.isFinite(seconds)) return '';
  const mins = Math.max(0, Math.round(seconds / 60));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${mins}m`;
};

const formatDistance = (meters?: number) => {
  if (!meters || !Number.isFinite(meters)) return '';
  const km = meters / 1000;
  if (km >= 1) return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
  return `${Math.round(meters)} m`;
};

const AdminDeliveryPartners = () => {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<DeliveryPartner | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    vehicleType: 'bike' as DeliveryPartner['vehicleType'],
    isActive: true,
  });
  const [saving, setSaving] = useState(false);
  const [releasing, setReleasing] = useState<string | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);

  // Store order info for partners with assigned orders
  const [orderInfo, setOrderInfo] = useState<Record<string, { id: string; status: string }>>({});

  useEffect(() => {
    // Use real-time subscription for live updates
    const unsubscribe = subscribeToDeliveryPartners(async (data) => {
      setPartners(data);
      
      // Fetch order info for partners with current orders
      const orderInfoMap: Record<string, { id: string; status: string }> = {};
      for (const partner of data) {
        if (partner.currentOrderId) {
          const order = await getOrderById(partner.currentOrderId);
          if (order) {
            orderInfoMap[partner.id] = { id: order.id, status: order.status };
          }
        }
      }
      setOrderInfo(orderInfoMap);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await getDeliveryPartners();
    setPartners(data);
    
    // Fetch order info for partners with current orders
    const orderInfoMap: Record<string, { id: string; status: string }> = {};
    for (const partner of data) {
      if (partner.currentOrderId) {
        const order = await getOrderById(partner.currentOrderId);
        if (order) {
          orderInfoMap[partner.id] = { id: order.id, status: order.status };
        }
      }
    }
    setOrderInfo(orderInfoMap);
    setLoading(false);
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.phone.includes(searchQuery);
    
    if (!matchesSearch) return false;
    
    if (statusFilter === 'idle') return !partner.currentOrderId;
    if (statusFilter === 'busy') return !!partner.currentOrderId;
    
    return true;
  });

  const idleCount = partners.filter(p => p.isActive && !p.currentOrderId).length;
  const busyCount = partners.filter(p => p.isActive && !!p.currentOrderId).length;

  const openCreateDialog = () => {
    setEditingPartner(null);
    setFormData({
      name: '',
      phone: '',
      email: '',
      vehicleType: 'bike',
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (partner: DeliveryPartner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      phone: partner.phone,
      email: partner.email || '',
      vehicleType: partner.vehicleType,
      isActive: partner.isActive,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      toast({ title: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      if (editingPartner) {
        await updateDeliveryPartner(editingPartner.id, formData);
        toast({ title: 'Partner updated successfully' });
      } else {
        await createDeliveryPartner({
          ...formData,
          rating: 5.0,
          totalDeliveries: 0,
          joinedAt: new Date(),
          currentStatus: 'idle',
          currentOrderId: null,
        });
        toast({ title: 'Partner added successfully' });
      }
      setDialogOpen(false);
      loadData();
    } catch (error) {
      toast({ title: 'Error saving partner', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleDelete = async (partner: DeliveryPartner) => {
    if (!confirm(`Remove "${partner.name}"?`)) return;
    
    try {
      await deleteDeliveryPartner(partner.id);
      toast({ title: 'Partner removed' });
      loadData();
    } catch (error) {
      toast({ title: 'Error removing partner', variant: 'destructive' });
    }
  };

  const toggleActive = async (partner: DeliveryPartner) => {
    try {
      await updateDeliveryPartner(partner.id, { 
        isActive: !partner.isActive,
        currentStatus: !partner.isActive ? 'idle' : 'offline'
      });
      loadData();
    } catch (error) {
      toast({ title: 'Error updating status', variant: 'destructive' });
    }
  };

  const handleRelease = async (partner: DeliveryPartner) => {
    if (!confirm(`Release "${partner.name}" from current order?`)) return;
    
    setReleasing(partner.id);
    try {
      await releaseDeliveryPartner(partner.id);
      toast({ title: `${partner.name} released and available for new orders` });
      loadData();
    } catch (error) {
      toast({ title: 'Error releasing partner', variant: 'destructive' });
    }
    setReleasing(null);
  };

  const handleCleanupStale = async () => {
    setCleaningUp(true);
    try {
      const count = await cleanupStaleAssignments();
      if (count > 0) {
        toast({ title: `Cleaned up ${count} stale assignment(s)` });
        loadData();
      } else {
        toast({ title: 'No stale assignments found' });
      }
    } catch (error) {
      toast({ title: 'Error cleaning up', variant: 'destructive' });
    }
    setCleaningUp(false);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Delivery Partners</h1>
          <p className="text-muted-foreground">
            <span className="text-success">{idleCount} idle</span> • 
            <span className="text-primary ml-1">{busyCount} busy</span> • 
            <span className="ml-1">{partners.length} total</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleCleanupStale} disabled={cleaningUp}>
            {cleaningUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-2 hidden sm:inline">Cleanup Stale</span>
          </Button>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Partner
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Filter status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Partners</SelectItem>
            <SelectItem value="idle">Idle Only</SelectItem>
            <SelectItem value="busy">Busy Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Partners Grid */}
      {filteredPartners.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Truck className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground">No delivery partners found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPartners.map((partner) => {
            const status = statusConfig[partner.currentStatus] || statusConfig.idle;
            const hasOrder = !!partner.currentOrderId;
            const order = orderInfo[partner.id];
            
            return (
              <Card key={partner.id} className={hasOrder ? 'border-primary/50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${hasOrder ? 'bg-primary/20' : 'bg-muted'}`}>
                        <Truck className={`h-6 w-6 ${hasOrder ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{partner.name}</h3>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {partner.phone}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge variant={partner.isActive ? 'default' : 'secondary'}>
                        {partner.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      <Badge className={status.color} variant="outline">
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Current Order Info with ETA */}
                  {hasOrder && (
                    <div className="bg-muted/50 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Package className="h-4 w-4 text-primary" />
                        <span className="font-medium">Current Order:</span>
                        <span className="text-muted-foreground font-mono text-xs">
                          {partner.currentOrderId?.slice(0, 8)}...
                        </span>
                      </div>
                      {order && (
                        <p className="text-xs text-muted-foreground mt-1 ml-6">
                          Status: <span className="capitalize">{order.status.replace('_', ' ')}</span>
                        </p>
                      )}
                      {/* ETA Display for navigating partners */}
                      {partner.currentStatus === 'navigating' && partner.estimatedArrival && (
                        <div className="flex items-center gap-2 mt-2 ml-6 text-sm">
                          <Clock className="h-3.5 w-3.5 text-primary" />
                          <span className="text-foreground font-medium">
                            ETA: {format(partner.estimatedArrival, 'h:mm a')}
                          </span>
                          {partner.estimatedDuration && (
                            <span className="text-muted-foreground">
                              ({formatDuration(partner.estimatedDuration)})
                            </span>
                          )}
                        </div>
                      )}
                      {partner.currentStatus === 'navigating' && partner.estimatedDistance && (
                        <div className="flex items-center gap-2 mt-1 ml-6 text-xs text-muted-foreground">
                          <Navigation className="h-3 w-3" />
                          <span>{formatDistance(partner.estimatedDistance)} away</span>
                          {partner.lastLocationUpdate && (
                            <span className="opacity-70">
                              • Updated {format(partner.lastLocationUpdate, 'h:mm:ss a')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-warning fill-warning" />
                      {partner.rating.toFixed(1)}
                    </span>
                    <span>{partner.totalDeliveries} deliveries</span>
                    <span className="capitalize">{partner.vehicleType}</span>
                  </div>
                  
                  <div className="flex gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => openEditDialog(partner)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => toggleActive(partner)}
                    >
                      {partner.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                    {hasOrder && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleRelease(partner)}
                        disabled={releasing === partner.id}
                        className="text-warning border-warning/50 hover:bg-warning/10"
                      >
                        {releasing === partner.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <UserX className="h-4 w-4 mr-1" />
                        )}
                        Release
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleDelete(partner)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingPartner ? 'Edit Partner' : 'Add Delivery Partner'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Partner name"
              />
            </div>
            <div className="space-y-2">
              <Label>Phone *</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="partner@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Vehicle Type</Label>
              <Select
                value={formData.vehicleType}
                onValueChange={(value) => setFormData({ ...formData, vehicleType: value as DeliveryPartner['vehicleType'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bike">Bike</SelectItem>
                  <SelectItem value="scooter">Scooter</SelectItem>
                  <SelectItem value="bicycle">Bicycle</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active Status</Label>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingPartner ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDeliveryPartners;