import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'h-10 w-full rounded-lg border border-border bg-bg px-3 text-sm placeholder:text-text-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20',
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';
