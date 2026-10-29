import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Responsive table: on small screens rows become cards.
 * Put `data-label="Column"` on each <TableCell> to show the column name on mobile.
 */
function Table({ className, ...props }: React.ComponentProps<'table'>) {
  return (
    <div className="relative w-full overflow-x-auto">
      <table className={cn('w-full border-collapse text-sm max-md:block', className)} {...props} />
    </div>
  );
}
function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead className={cn('max-md:hidden', className)} {...props} />;
}
function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody className={cn('max-md:flex max-md:flex-col max-md:gap-2.5', className)} {...props} />;
}
function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return <tr className={cn('border-b border-border last:border-0 max-md:block max-md:rounded-2xl max-md:border max-md:bg-surface max-md:px-3.5 max-md:py-1.5 max-md:last:border', className)} {...props} />;
}
function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return <th className={cn('px-3 py-3 text-left text-xs font-bold tracking-wide whitespace-nowrap text-muted-foreground uppercase', className)} {...props} />;
}
function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      className={cn(
        'px-3 py-3 align-middle max-md:flex max-md:items-center max-md:justify-between max-md:gap-3 max-md:px-0 max-md:py-2',
        'max-md:data-[label]:before:text-xs max-md:data-[label]:before:font-semibold max-md:data-[label]:before:text-muted-foreground max-md:data-[label]:before:content-[attr(data-label)]',
        className,
      )}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
