import { VideoView, useVideoPlayer } from 'expo-video';
export function VideoPlayer({ url }: { url: string }) {
  const player = useVideoPlayer(url);
  return <VideoView player={player} style={{ width: '100%', height: 220, borderRadius: 16 }} nativeControls allowsPictureInPicture />;
}
