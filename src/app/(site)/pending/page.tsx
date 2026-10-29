import Link from 'next/link';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthCard } from '@/components/auth-card';

export default function PendingPage() {
  return (
    <AuthCard center icon={Clock} title="Request sent!" text="Your account is waiting for approval by the academy admin. You will be able to sign in once it is approved.">
      <Button asChild className="w-full"><Link href="/login">Go to sign in</Link></Button>
    </AuthCard>
  );
}
