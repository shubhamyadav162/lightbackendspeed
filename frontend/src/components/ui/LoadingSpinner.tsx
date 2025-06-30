import React from 'react';
import { Loader2, RefreshCw, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: string;
  className?: string;
  text?: string;
  variant?: 'default' | 'fast' | 'pulse';
  color?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
  showText?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "h-6 w-6", 
  className,
  text,
  variant = 'default',
  color = 'default',
  showText = true
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'fast':
        return Zap;
      case 'pulse':
        return RefreshCw;
      default:
        return Loader2;
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'primary':
        return 'text-blue-600';
      case 'success':
        return 'text-green-600';
      case 'warning':
        return 'text-yellow-600';
      case 'danger':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  const getAnimationClasses = () => {
    switch (variant) {
      case 'fast':
        return 'animate-spin duration-500';
      case 'pulse':
        return 'animate-pulse';
      default:
        return 'animate-spin';
    }
  };

  const Icon = getIcon();

  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      <Icon className={cn(size, getColorClasses(), getAnimationClasses())} />
      {showText && text && (
        <span className={cn("text-sm", getColorClasses())}>
          {text}
        </span>
      )}
    </div>
  );
}; 