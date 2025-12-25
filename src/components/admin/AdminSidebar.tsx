import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '@/contexts/AdminAuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Truck, 
  LogOut,
  Store,
  FolderTree,
  ClipboardList,
  MapPin,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/admin/products', icon: Package, label: 'Products' },
  { path: '/admin/categories', icon: FolderTree, label: 'Categories' },
  { path: '/admin/order-requests', icon: ClipboardList, label: 'Order Requests' },
  { path: '/admin/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/admin/delivery-partners', icon: Truck, label: 'Delivery Partners' },
  { path: '/admin/live-tracking', icon: MapPin, label: 'Live Tracking' },
  { path: '/admin/home-delivery', icon: Store, label: 'Home Delivery' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

const AdminSidebar = () => {
  const { logout, adminUser } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <Store className="h-6 w-6 text-primary mr-2" />
        <span className="font-bold text-lg text-foreground">Admin Portal</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-border">
        <div className="mb-3 px-3">
          <p className="text-sm font-medium text-foreground truncate">
            {adminUser?.email || 'Admin'}
          </p>
          <p className="text-xs text-muted-foreground">Administrator</p>
        </div>
        <Button 
          variant="outline" 
          className="w-full justify-start" 
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
