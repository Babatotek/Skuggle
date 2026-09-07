import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus, RefreshCw, Trash2, User } from 'lucide-react';
import { Button } from '../../../components/ui';
import { compressImage } from '../../../lib/studentEnrolment';

interface StudentPhotoCaptureProps {
  preview: string | null;
  onPhotoChange: (file: File | null, preview: string | null) => void;
  onSkip: () => void;
}

export const StudentPhotoCapture: React.FC<StudentPhotoCaptureProps> = ({ preview, onPhotoChange, onSkip }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  }, []);

  useEffect(() => () => stopCamera(), [stopCamera]);

  const handleFile = async (file: File) => {
    try {
      const compressed = await compressImage(file);
      const url = URL.createObjectURL(compressed);
      onPhotoChange(compressed, url);
    } catch {
      const url = URL.createObjectURL(file);
      onPhotoChange(file, url);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 } }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraError('Camera unavailable. Upload a photo instead.');
    }
  };

  const capturePhoto = async () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
      stopCamera();
      await handleFile(file);
    }, 'image/jpeg', 0.85);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-5 items-start">
      <div className="relative shrink-0 mx-auto sm:mx-0">
        <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 overflow-hidden flex items-center justify-center">
          {preview ? (
            <img src={preview} alt="Student" className="w-full h-full object-cover" />
          ) : cameraActive ? (
            <video ref={videoRef} className="w-full h-full object-cover scale-x-[-1]" muted playsInline />
          ) : (
            <User className="w-10 h-10 text-slate-300" />
          )}
        </div>
      </div>

      <div className="flex-1 space-y-2.5 w-full">
        <p className="text-sm font-semibold text-slate-800">Student Photograph</p>
        <p className="text-xs text-slate-500">Upload or capture a passport-style photo. Images are compressed before upload.</p>
        {cameraError && <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{cameraError}</p>}

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" leftIcon={<ImagePlus className="w-3.5 h-3.5" />} onClick={() => fileRef.current?.click()}>
            Upload Photo
          </Button>
          {!cameraActive ? (
            <Button type="button" variant="outline" size="sm" leftIcon={<Camera className="w-3.5 h-3.5" />} onClick={startCamera}>
              Take Photo
            </Button>
          ) : (
            <>
              <Button type="button" variant="primary" size="sm" leftIcon={<Camera className="w-3.5 h-3.5" />} onClick={capturePhoto}>
                Capture
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={stopCamera}>Cancel</Button>
            </>
          )}
          {preview && (
            <>
              <Button type="button" variant="ghost" size="sm" leftIcon={<RefreshCw className="w-3.5 h-3.5" />} onClick={() => fileRef.current?.click()}>Replace</Button>
              <Button type="button" variant="ghost" size="sm" leftIcon={<Trash2 className="w-3.5 h-3.5" />} onClick={() => onPhotoChange(null, null)}>Remove</Button>
            </>
          )}
          {!preview && (
            <Button type="button" variant="ghost" size="sm" onClick={onSkip}>Use Later</Button>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); e.target.value = ''; }} />
      </div>
    </div>
  );
};
