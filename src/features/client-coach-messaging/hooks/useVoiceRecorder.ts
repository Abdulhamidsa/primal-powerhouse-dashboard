'use client';

import { useEffect, useRef, useState } from 'react';

export function useVoiceRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingDurationSec, setRecordingDurationSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const discardOnStopRef = useRef(false);

  const stopTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopTimer();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setRecordedBlob(null);

    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Voice recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      discardOnStopRef.current = false;
      setRecordingDurationSec(0);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stopTimer();

        if (!discardOnStopRef.current) {
          const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'audio/webm' });
          setRecordedBlob(blob);
        }

        discardOnStopRef.current = false;
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
      };

      mediaRecorder.start();
      timerRef.current = window.setInterval(() => {
        setRecordingDurationSec(current => current + 1);
      }, 1000);
      setIsRecording(true);
    } catch (recorderError) {
      setError('Could not start voice recording. Please check microphone permissions.');
      console.error('Voice recorder start error:', recorderError);
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    mediaRecorderRef.current.stop();
    stopTimer();
    setIsRecording(false);
  };

  const cancelRecording = () => {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === 'inactive') return;
    discardOnStopRef.current = true;
    mediaRecorderRef.current.stop();
    stopTimer();
    setRecordingDurationSec(0);
    setIsRecording(false);
  };

  const clearRecording = () => {
    setRecordedBlob(null);
    setRecordingDurationSec(0);
    setError(null);
  };

  return {
    isRecording,
    recordedBlob,
    recordingDurationSec,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    clearRecording,
  };
}
