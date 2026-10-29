import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all outline-none select-none active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-4 focus-visible:ring-ring/40 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: 'bg-gradient-accent text-primary-foreground shadow-[0_10px_24px_-10px_rgba(13,148,136,0.65)] hover:shadow-glow',
        outline: 'border border-input bg-surface text-ink-2 hover:border-primary hover:text-brand-ink',
        secondary: 'bg-brand-wash text-brand-ink hover:bg-brand-wash/80',
        ghost: 'text-ink-2 hover:bg-secondary hover:text-foreground',
        destructive: 'bg-critical-soft text-critical hover:bg-critical hover:text-white',
        link: 'text-brand-ink underline-offset-4 hover:underline rounded-md',
      },
      size: {
        default: 'h-11 px-5 text-[14.5px]',
        sm: 'h-9 px-4 text-[13.5px]',
        xs: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base',
        icon: 'size-10',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function Button({ className, variant, size, asChild = false, ...props }: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
