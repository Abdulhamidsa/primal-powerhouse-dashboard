'use client';

import { useEffect, useRef, useState } from 'react';

const MAX_RECORDING_SECONDS = 120;
const MAX_RECORDING_BYTES = 50 * 1024 * 1024;

export function useVideoRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [liveStream, setLiveStream] = useState<MediaStream | null>(null);
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
      setLiveStream(null);
    };
  }, []);

  const startRecording = async () => {
    setError(null);
    setRecordedBlob(null);

    if (!navigator.mediaDevices?.getUserMedia || typeof window.MediaRecorder === 'undefined') {
      setError('Video recording is not supported in this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      setLiveStream(stream);
      discardOnStopRef.current = false;
      setRecordingDurationSec(0);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = event => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);

          const totalBytes = chunksRef.current.reduce((sum, part) => {
            return sum + (part instanceof Blob ? part.size : 0);
          }, 0);
          if (totalBytes >= MAX_RECORDING_BYTES) {
            setError('Recording reached 50MB. Keep clips short and send in multiple parts.');
            if (mediaRecorder.state !== 'inactive') {
              mediaRecorder.stop();
            }
          }
        }
      };

      mediaRecorder.onstop = () => {
        stopTimer();
        setIsRecording(false);

        if (!discardOnStopRef.current) {
          const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType || 'video/webm' });
          setRecordedBlob(blob);
        }

        discardOnStopRef.current = false;
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setLiveStream(null);
      };

      mediaRecorder.start(500);
      timerRef.current = window.setInterval(() => {
        setRecordingDurationSec(current => {
          const next = current + 1;
          if (next >= MAX_RECORDING_SECONDS && mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop();
          }
          return next;
        });
      }, 1000);
      setIsRecording(true);
    } catch (recorderError) {
      setError('Could not start video recording. Please check camera and microphone permissions.');
      console.error('Video recorder start error:', recorderError);
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
    liveStream,
    recordingDurationSec,
    error,
    startRecording,
    stopRecording,
    cancelRecording,
    clearRecording,
  };
}
