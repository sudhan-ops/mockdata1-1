import React, { useState, useCallback } from 'react';
import type { UploadedFile } from '../../types';
import { Edit, Trash2, Loader2, AlertTriangle, Camera } from 'lucide-react';
import { ProfilePlaceholder } from '../ui/ProfilePlaceholder';
import { api } from '../../services/api';
import Button from '../ui/Button';
import CameraCaptureModal from '../CameraCaptureModal';

interface AvatarUploadProps {
  file: UploadedFile | undefined | null;
  onFileChange: (file: UploadedFile | null) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ file, onFileChange }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    if (selectedFile && selectedFile.type.startsWith('image/')) {
      setIsVerifying(true);
      setVerificationError('');
      
      const fileData: UploadedFile = {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
        preview: URL.createObjectURL(selectedFile),
        file: selectedFile,
      };
      onFileChange(fileData); // Optimistic update for preview

      try {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onloadend = async () => {
          const base64String = (reader.result as string).split(',')[1];
          const result = await api.verifyProfilePhoto(base64String, selectedFile.type);
          if (!result.isValid) {
            setVerificationError(result.reason);
            onFileChange(null); // Reject the file
          }
          setIsVerifying(false);
        };
      } catch (error: any) {
        setVerificationError(error.message || 'Verification failed.');
        onFileChange(null);
        setIsVerifying(false);
      }
    }
  }, [onFileChange]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        handleFileSelect(selectedFile);
    }
  };

  const handleCapture = useCallback(async (base64Image: string, mimeType: string) => {
    const blob = await (await fetch(`data:${mimeType};base64,${base64Image}`)).blob();
    const capturedFile = new File([blob], `capture-${Date.now()}.jpg`, { type: mimeType });
    handleFileSelect(capturedFile);
  }, [handleFileSelect]);

  const handleRemove = () => {
    if (file) {
      URL.revokeObjectURL(file.preview);
    }
    onFileChange(null);
    setVerificationError('');
  };

  const inputId = 'avatar-upload';

  return (
    <div className="flex flex-col items-center space-y-2">
      {isCameraOpen && <CameraCaptureModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleCapture} captureGuidance="profile" />}
      <div className="relative w-40 h-40">
        <div className={`w-full h-full rounded-full bg-page flex items-center justify-center overflow-hidden border-2 transition-colors ${verificationError ? 'border-red-500' : 'border-border'}`}>
          {isVerifying ? (
            <div className="flex flex-col items-center text-muted">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-xs mt-2">Verifying...</span>
            </div>
          ) : file?.preview ? (
            <img src={file.preview} alt="Profile preview" className="w-full h-full object-cover" />
          ) : (
            <ProfilePlaceholder />
          )}
        </div>
        {file && !isVerifying && (
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-card/70 backdrop-blur-sm rounded-full text-red-600 hover:bg-red-100 transition-colors"
            aria-label="Remove photo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <label htmlFor={inputId} className={`cursor-pointer inline-flex items-center justify-center font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-200 rounded-full bg-accent text-white hover:bg-accent-dark focus:ring-accent px-4 py-2 text-sm ${isVerifying ? 'opacity-50 cursor-not-allowed' : ''}`}>
          <Edit className="w-4 h-4 mr-2" />
          {file ? 'Change' : 'Upload'}
        </label>
        <input id={inputId} name={inputId} type="file" className="sr-only" onChange={handleFileChange} accept="image/*" disabled={isVerifying} />
        <Button type="button" variant="secondary" size="md" onClick={() => setIsCameraOpen(true)} disabled={isVerifying} className="px-4 py-2">
            <Camera className="w-4 h-4 mr-2" />
            Capture
        </Button>
      </div>
       {verificationError && (
        <p className="text-xs text-red-600 text-center max-w-[160px] flex items-center gap-1">
            <AlertTriangle className="h-3 w-3 flex-shrink-0"/> {verificationError}
        </p>
      )}
    </div>
  );
};