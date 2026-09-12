import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Button } from '@/components/ui';
export function AudioPlayer({ url }: { url: string }) {
  const player = useAudioPlayer(url); const status = useAudioPlayerStatus(player);
  return <Button secondary title={status.playing ? 'Pause voice message' : 'Play voice message'} onPress={() => status.playing ? player.pause() : player.play()} />;
}
