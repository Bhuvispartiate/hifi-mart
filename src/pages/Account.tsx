import {
  User,
  MapPin,
  CreditCard,
  Package,
  Bell,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Edit2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { BottomNav } from '@/components/grocery/BottomNav';
import { DeliveryActionBar } from '@/components/grocery/DeliveryActionBar';
import { CustomerBadge, getBadgeLevel } from '@/components/grocery/CustomerBadge';
import { Link } from 'react-router-dom';

const menuItems = [
  { icon: MapPin, label: 'Saved Addresses', description: '2 addresses saved', link: '#' },
  { icon: CreditCard, label: 'Payment Methods', description: 'UPI, Cards', link: '#' },
  { icon: Package, label: 'My Orders', description: 'Track & reorder', link: '/orders' },
  { icon: Bell, label: 'Notifications', description: 'Manage alerts', link: '#' },
  { icon: Settings, label: 'Settings', description: 'App preferences', link: '#' },
  { icon: HelpCircle, label: 'Help & Support', description: 'FAQs, Contact us', link: '#' },
];

// Mock user data - in production this would come from auth context
const userOrdersCount = 12;

const Account = () => {
  const badgeLevel = getBadgeLevel(userOrdersCount);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="bg-primary text-primary-foreground px-4 pt-8 pb-12 rounded-b-3xl">
        <h1 className="text-xl font-bold mb-6">My Account</h1>
        
        {/* Profile Card */}
        <Card className="bg-card p-4 rounded-xl shadow-lg -mb-8 relative">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="font-semibold text-foreground text-lg">John Doe</h2>
                <CustomerBadge level={badgeLevel} showLabel={false} className="py-0.5" />
              </div>
              <p className="text-sm text-muted-foreground">+91 98765 43210</p>
              <p className="text-xs text-muted-foreground">john.doe@email.com</p>
            </div>
            <Button variant="ghost" size="icon">
              <Edit2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
          <div className="mt-3 pt-3 border-t border-border">
            <CustomerBadge level={badgeLevel} ordersCount={userOrdersCount} />
          </div>
        </Card>
      </header>

      <main className="p-4 pt-12 space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3 text-center border border-border rounded-xl">
            <p className="text-2xl font-bold text-primary">12</p>
            <p className="text-xs text-muted-foreground">Orders</p>
          </Card>
          <Card className="p-3 text-center border border-border rounded-xl">
            <p className="text-2xl font-bold text-primary">₹2.4K</p>
            <p className="text-xs text-muted-foreground">Saved</p>
          </Card>
          <Card className="p-3 text-center border border-border rounded-xl">
            <p className="text-2xl font-bold text-primary">5</p>
            <p className="text-xs text-muted-foreground">Coupons</p>
          </Card>
        </div>

        {/* Menu Items */}
        <Card className="border border-border rounded-xl overflow-hidden">
          {menuItems.map((item, index) => (
            <div key={item.label}>
              <Link
                to={item.link}
                className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-foreground text-sm">
                    {item.label}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </Link>
              {index < menuItems.length - 1 && <Separator />}
            </div>
          ))}
        </Card>

        {/* Preferences */}
        <Card className="border border-border rounded-xl p-4">
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
              <Switch defaultChecked />
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
              <Switch defaultChecked />
            </div>
          </div>
        </Card>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full h-12 text-destructive border-destructive/30 hover:bg-destructive/10"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>

        {/* App Version */}
        <p className="text-center text-xs text-muted-foreground">
          App Version 1.0.0
        </p>
      </main>

      <DeliveryActionBar />
      <BottomNav />
    </div>
  );
};

export default Account;
