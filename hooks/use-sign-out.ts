import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';
import { toast } from 'sonner';

export function useSignOut() {
  const router = useRouter();

  async function handleSignOut() {
    const { error } = await authClient.signOut();

    if (error) {
      toast.error(error.message || 'Something went wrong');
    } else {
      toast.success('Logged out successfully');
      router.refresh();
      router.push('/');
    }
  }

  return handleSignOut;
}
