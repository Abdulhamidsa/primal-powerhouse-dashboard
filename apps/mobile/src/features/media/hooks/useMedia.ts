import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAudioRecorder, RecordingPresets, AudioModule, setAudioModeAsync } from 'expo-audio';
import type { NativeFile } from '../types/media.types';

export function useMedia() {
  const [error, setError] = useState('');
  const [recording, setRecording] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const active = useRef(true);
  const starting = useRef(false);
  const isRecording = useRef(false);
  const savedAudio = useRef<NativeFile | null>(null);
  const stopPromise = useRef<Promise<NativeFile | null> | null>(null);
  function rememberAudio(uri: string | null) {
    if (uri) savedAudio.current = { uri, name: 'voice-message.m4a', type: 'audio/mp4' };
    if (active.current) setHasAudio(!!savedAudio.current);
  }
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY, status => {
    if (status.isFinished || status.hasError) {
      isRecording.current = false;
      rememberAudio(status.url);
      if (active.current) {
        setRecording(false);
        if (status.hasError)
          setError('Recording was interrupted. Attach the saved audio if available, or record again.');
      }
      void setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    }
  });
  async function stopAudio(): Promise<NativeFile | null> {
    if (stopPromise.current) return stopPromise.current;
    if (!isRecording.current) return savedAudio.current;
    stopPromise.current = (async () => {
      try {
        await recorder.stop();
        rememberAudio(recorder.uri);
        return savedAudio.current;
      } finally {
        isRecording.current = false;
        if (active.current) setRecording(false);
        await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
        stopPromise.current = null;
      }
    })();
    return stopPromise.current;
  }
  useEffect(() => {
    active.current = true;
    const listener = AppState.addEventListener('change', state => {
      if (state !== 'active' && isRecording.current)
        void stopAudio().catch(() => {
          if (active.current) setError('Unable to finish the interrupted recording. Please record again.');
        });
    });
    return () => {
      active.current = false;
      listener.remove();
      if (isRecording.current) void stopAudio().catch(() => {});
    };
  }, [recorder]);
  async function pick(camera = false, video = false): Promise<NativeFile | null> {
    setError('');
    try {
      const permission = camera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) throw new Error('Permission was denied. You can enable it in iPhone Settings.');
      if (camera && video && !(await AudioModule.requestRecordingPermissionsAsync()).granted)
        throw new Error('Microphone permission is needed for video messages.');
      const result = camera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: video ? ['videos'] : ['images'],
            quality: 0.8,
            videoMaxDuration: 120,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: video ? ['images', 'videos'] : ['images'],
            quality: 0.8,
          });
      if (result.canceled) return null;
      const asset = result.assets[0];
      return {
        uri: asset.uri,
        name: asset.fileName ?? (asset.type === 'video' ? 'message.mov' : 'photo.jpg'),
        type: asset.mimeType ?? (asset.type === 'video' ? 'video/quicktime' : 'image/jpeg'),
      };
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to open media');
      return null;
    }
  }
  async function startAudio() {
    if (starting.current || isRecording.current || savedAudio.current || stopPromise.current) return;
    starting.current = true;
    try {
      if (!(await AudioModule.requestRecordingPermissionsAsync()).granted)
        throw new Error('Microphone permission was denied.');
      if (!active.current || AppState.currentState !== 'active') return;
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      if (!active.current || AppState.currentState !== 'active') {
        await setAudioModeAsync({ allowsRecording: false });
        return;
      }
      recorder.record();
      isRecording.current = true;
      setRecording(true);
      setError('');
    } catch (e) {
      if (active.current) setError(e instanceof Error ? e.message : 'Unable to record');
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    } finally {
      starting.current = false;
    }
  }
  const clearAudio = () => {
    savedAudio.current = null;
    setHasAudio(false);
  };
  return { pick, startAudio, stopAudio, clearAudio, recording, hasAudio, error };
}
