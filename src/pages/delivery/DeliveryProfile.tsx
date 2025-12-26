import { 
  User, Phone, Mail, MapPin, Star, Package, 
  IndianRupee, Calendar, ChevronRight, LogOut,
  FileText, HelpCircle, Settings
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { DeliveryBottomNav } from '@/components/delivery/DeliveryBottomNav';
import { useNavigate } from 'react-router-dom';
import { useDeliveryAuth } from '@/contexts/DeliveryAuthContext';
import { useEffect } from 'react';

export default function DeliveryProfile() {
  const navigate = useNavigate();
  const { deliveryPartner, isAuthenticated, logout } = useDeliveryAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/delivery/login');
    }
  }, [isAuthenticated, navigate]);

  const menuItems = [
    { icon: FileText, label: 'Documents', path: '/delivery/documents' },
    { icon: IndianRupee, label: 'Earnings & Payments', path: '/delivery/earnings' },
    { icon: Settings, label: 'Settings', path: '/delivery/settings' },
    { icon: HelpCircle, label: 'Help & Support', path: '/delivery/help' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/delivery/login');
  };

  if (!deliveryPartner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 pt-12 pb-16">
        <h1 className="text-xl font-bold">My Profile</h1>
      </div>

      {/* Profile Card - Overlapping */}
      <div className="px-4 -mt-12">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarFallback className="bg-primary/10 text-primary text-xl">
                  {deliveryPartner.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-lg">{deliveryPartner.name}</h2>
                  {deliveryPartner.isActive && (
                    <Badge variant="secondary" className="text-xs">Active</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">ID: {deliveryPartner.id.slice(0, 8)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Star className="w-4 h-4 fill-accent text-accent" />
                  <span className="font-medium">{deliveryPartner.rating.toFixed(1)}</span>
                  <span className="text-sm text-muted-foreground">Rating</span>
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>{deliveryPartner.phone}</span>
              </div>
              {deliveryPartner.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="truncate">{deliveryPartner.email}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-4 space-y-4">
        {/* Stats Card */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Overall Stats</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-primary">{deliveryPartner.totalDeliveries}</p>
                <p className="text-xs text-muted-foreground">Deliveries</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary capitalize">{deliveryPartner.vehicleType}</p>
                <p className="text-xs text-muted-foreground">Vehicle</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{deliveryPartner.rating.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Info */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-3">Vehicle Details</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Vehicle Type</span>
                <span className="font-medium capitalize">{deliveryPartner.vehicleType}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <span className="font-medium">{deliveryPartner.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Joined</span>
                <span className="font-medium">{deliveryPartner.joinedAt.toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Items */}
        <Card>
          <CardContent className="p-0">
            {menuItems.map((item, index) => (
              <div key={item.label}>
                <button
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                  onClick={() => item.path && navigate(item.path)}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                    <span>{item.label}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
                {index < menuItems.length - 1 && <Separator />}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Logout Button */}
        <Button 
          variant="outline" 
          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>

      <DeliveryBottomNav />
    </div>
  );
}
