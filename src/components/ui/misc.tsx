'use client';

import * as React from 'react';
import { Switch as SwitchPrimitive, Progress as ProgressPrimitive, DropdownMenu as DM } from 'radix-ui';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('animate-pulse rounded-xl bg-slate-200/70', className)} {...props} />;
}

export function Switch({ className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      className={cn('inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-slate-300 p-0.5 transition-colors outline-none focus-visible:ring-4 focus-visible:ring-ring/30 disabled:opacity-50 data-[state=checked]:bg-primary', className)}
      {...props}
    >
      <SwitchPrimitive.Thumb className="block size-5 rounded-full bg-white shadow transition-transform data-[state=checked]:translate-x-5" />
    </SwitchPrimitive.Root>
  );
}

export function Progress({ className, value, indicatorClassName, style, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
  return (
    <ProgressPrimitive.Root className={cn('relative h-2.5 w-full overflow-hidden rounded-full bg-secondary', className)} value={value} {...props}>
      <ProgressPrimitive.Indicator className={cn('h-full rounded-full bg-gradient-accent transition-all duration-500', indicatorClassName)} style={{ width: `${value || 0}%`, ...style }} />
    </ProgressPrimitive.Root>
  );
}

export const DropdownMenu = DM.Root;
export const DropdownMenuTrigger = DM.Trigger;
export function DropdownMenuContent({ className, sideOffset = 8, ...props }: React.ComponentProps<typeof DM.Content>) {
  return (
    <DM.Portal>
      <DM.Content sideOffset={sideOffset} className={cn('z-50 min-w-48 rounded-2xl border border-border bg-popover p-1.5 shadow-lift data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95', className)} {...props} />
    </DM.Portal>
  );
}
export function DropdownMenuItem({ className, ...props }: React.ComponentProps<typeof DM.Item>) {
  return <DM.Item className={cn('flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium outline-none select-none data-[highlighted]:bg-brand-wash data-[highlighted]:text-brand-ink [&_svg]:size-4', className)} {...props} />;
}
export function DropdownMenuSeparator({ className, ...props }: React.ComponentProps<typeof DM.Separator>) {
  return <DM.Separator className={cn('my-1 h-px bg-border', className)} {...props} />;
}
export const DropdownMenuLabel = ({ className, ...props }: React.ComponentProps<typeof DM.Label>) => <DM.Label className={cn('px-3 py-2', className)} {...props} />;
