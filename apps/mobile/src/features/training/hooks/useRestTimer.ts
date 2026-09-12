import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { useDraft } from '@/features/resources/hooks/useResource';
import { restSecondsRemaining } from '../api/workoutDraft';

export function useRestTimer(name: string) {
  const deadline = useDraft(`rest:${name}`, 0);
  const [now, setNow] = useState(Date.now());
  const running = deadline.ready && deadline.value > now;
  useEffect(() => {
    if (!running) return;
    const update = () => setNow(Date.now());
    update();
    const timer = setInterval(update, 1000);
    const foreground = AppState.addEventListener('change', state => {
      if (state === 'active') update();
    });
    return () => {
      clearInterval(timer);
      foreground.remove();
    };
  }, [deadline.value, running]);
  return {
    ready: deadline.ready,
    remaining: restSecondsRemaining(deadline.value, now),
    start: (seconds: number) => {
      const time = Date.now();
      setNow(time);
      deadline.setValue(time + Math.max(0, seconds) * 1000);
    },
    skip: () => deadline.setValue(0),
  };
}
