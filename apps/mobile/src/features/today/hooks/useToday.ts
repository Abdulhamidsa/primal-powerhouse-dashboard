import { useRouter } from 'expo-router';
import { useResource } from '@/features/resources/hooks/useResource';
import { getSummary, summaryPath } from '../api/today.api';
export function useToday() {
  const query = useResource(summaryPath, getSummary); const router = useRouter();
  const href = query.data?.nextAction.href ?? '';
  const openNext = () => {
    if (href.startsWith('/user/workout/')) router.push({ pathname: '/workout/[id]', params: { id: href.split('/').pop()! } });
    else if (href.includes('check-in')) router.push('/check-ins');
    else if (href.includes('chat')) router.push('/chat');
    else if (href.includes('training')) router.push('/training');
    else router.push('/plan');
  };
  return { ...query, openNext };
}
