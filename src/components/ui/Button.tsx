import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary:
    'bg-accent text-white hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed',
  secondary:
    'bg-bg-muted text-text hover:bg-border disabled:opacity-50 disabled:cursor-not-allowed',
  ghost:
    'text-text hover:bg-bg-muted disabled:opacity-50 disabled:cursor-not-allowed',
  danger:
    'bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-11 px-5 text-base',
  icon: 'h-9 w-9 p-0',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-accent/30',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';
