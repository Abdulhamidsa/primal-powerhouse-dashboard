import * as React from 'react';

import { cn } from '@/lib/utils';

export interface InputProps {
  className?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: any) => void;
  disabled?: boolean;
  required?: boolean;
  name?: string;
  id?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        'flex h-11 w-full rounded-lg border border-border bg-input px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

export { Input };
