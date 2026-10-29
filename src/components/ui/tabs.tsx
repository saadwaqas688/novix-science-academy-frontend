'use client';

import * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn('scrollbar-none flex gap-1 overflow-x-auto border-b border-border', className)} {...props} />;
}
function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'relative flex h-12 shrink-0 items-center gap-2 px-4 text-[14.5px] font-semibold text-muted-foreground transition-colors outline-none hover:text-foreground',
        'after:absolute after:inset-x-3 after:-bottom-px after:h-[3px] after:rounded-full after:bg-gradient-accent after:opacity-0 after:transition-opacity',
        'data-[state=active]:text-brand-ink data-[state=active]:after:opacity-100 [&_svg]:size-[17px]',
        className,
      )}
      {...props}
    />
  );
}
function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('pt-6 outline-none', className)} {...props} />;
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
