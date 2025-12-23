import { Star, Crown, Zap, Award } from 'lucide-react';
import { cn } from '@/lib/utils';

export type BadgeLevel = 'new' | 'regular' | 'gold' | 'platinum';

interface CustomerBadgeProps {
  level: BadgeLevel;
  ordersCount?: number;
  className?: string;
  showLabel?: boolean;
}

const badgeConfig = {
  new: {
    icon: Star,
    label: 'New Customer',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-600',
    iconColor: 'text-blue-500',
  },
  regular: {
    icon: Zap,
    label: 'Regular',
    bgColor: 'bg-green-500/10',
    textColor: 'text-green-600',
    iconColor: 'text-green-500',
  },
  gold: {
    icon: Award,
    label: 'Gold Member',
    bgColor: 'bg-amber-500/10',
    textColor: 'text-amber-600',
    iconColor: 'text-amber-500',
  },
  platinum: {
    icon: Crown,
    label: 'Platinum',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-600',
    iconColor: 'text-purple-500',
  },
};

export const CustomerBadge = ({ level, ordersCount, className, showLabel = true }: CustomerBadgeProps) => {
  const config = badgeConfig[level];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full',
        config.bgColor,
        className
      )}
    >
      <Icon className={cn('w-3.5 h-3.5', config.iconColor)} />
      {showLabel && (
        <span className={cn('text-xs font-semibold', config.textColor)}>
          {config.label}
        </span>
      )}
      {ordersCount !== undefined && ordersCount > 0 && (
        <span className={cn('text-xs', config.textColor, 'opacity-70')}>
          • {ordersCount} orders
        </span>
      )}
    </div>
  );
};

export const getBadgeLevel = (ordersCount: number): BadgeLevel => {
  if (ordersCount >= 50) return 'platinum';
  if (ordersCount >= 20) return 'gold';
  if (ordersCount >= 5) return 'regular';
  return 'new';
};
