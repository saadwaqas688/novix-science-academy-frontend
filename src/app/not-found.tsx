import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-4 text-center">
      <div>
        <p className="text-gradient-aurora font-display text-7xl font-extrabold">404</p>
        <h1 className="mt-2 text-2xl font-bold">Page not found</h1>
        <p className="mt-1 mb-6 text-muted-foreground">The page you are looking for does not exist.</p>
        <Button asChild><Link href="/">Go home</Link></Button>
      </div>
    </div>
  );
}
