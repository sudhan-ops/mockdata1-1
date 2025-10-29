import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { UploadedFile } from '../types';
import { UploadCloud, File as FileIcon, X, RefreshCw, Camera, Loader2, AlertTriangle, CheckCircle, Eye, Trash2, BadgeInfo, CreditCard, User as UserIcon, FileText, FileSignature, IndianRupee, GraduationCap, Fingerprint, XCircle } from 'lucide-react';
import { api } from '../services/api';
import Button from './ui/Button';
import CameraCaptureModal from './CameraCaptureModal';
import { useAuthStore } from '../store/authStore';
import ImagePreviewModal from './modals/ImagePreviewModal';
import { useOnboardingStore } from '../store/onboardingStore';

interface UploadDocumentProps {
  label: string;
  file: UploadedFile | undefined | null;
  onFileChange: (file: UploadedFile | null) => void;
  allowedTypes?: string[];
  error?: string;
  ocrSchema?: any;
  onOcrComplete?: (data: Record<string, any>) => void;
  setToast?: (toast: { message: string, type: 'success' | 'error' } | null) => void;
  allowCapture?: boolean;
  onVerification?: (base64: string, mimeType: string) => Promise<{ success: boolean; reason: string }>;
  docType?: 'Aadhaar' | 'PAN' | 'Voter ID' | 'Bank' | 'Salary' | 'UAN';
  costingItemName?: string;
  verificationStatus?: boolean | null;
}

type VerificationStatus = 'idle' | 'verifying' | 'verified' | 'failed';


const UploadDocument: React.FC<UploadDocumentProps> = ({ 
    label,
    file,
    onFileChange,
    allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'],
    error,
    ocrSchema,
    onOcrComplete,
    setToast,
    allowCapture = false,
    onVerification,
    docType,
    costingItemName,
    verificationStatus,
}) => {
    const { user } = useAuthStore();
    const { logVerificationUsage } = useOnboardingStore();
    const isFieldOfficer = user?.role === 'field_officer';
    const [isMobileTheme, setIsMobileTheme] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [isCameraOpen, setIsCameraOpen] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [apiVerificationStatus, setApiVerificationStatus] = useState<VerificationStatus>('idle');
    const [verificationError, setVerificationError] = useState('');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

    useEffect(() => {
        setIsMobileTheme(document.body.classList.contains('field-officer-dark-theme'));
    }, []);

    const captureGuidance = useMemo(() => {
        const lowerLabel = label.toLowerCase();
        if (lowerLabel.includes('photo')) return 'profile';
        if (['proof', 'document', 'card', 'slip', 'passbook', 'cheque', 'certificate'].some(keyword => lowerLabel.includes(keyword))) {
            return 'document';
        }
        return 'none';
    }, [label]);
    
    const handleFileSelect = useCallback(async (selectedFile: File) => {
        if (!allowedTypes.includes(selectedFile.type)) {
            setUploadError(`Invalid file type. Allowed: ${allowedTypes.join(', ')}.`);
            return;
        }
        if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
            setUploadError('File size must be less than 5MB.');
            return;
        }

        setUploadError('');
        setVerificationError('');
        setApiVerificationStatus('idle');
        const preview = URL.createObjectURL(selectedFile);
        let fileData: UploadedFile = {
            name: selectedFile.name, type: selectedFile.type, size: selectedFile.size,
            preview, file: selectedFile, progress: 0,
        };
        onFileChange(fileData); // Show file immediately

        setIsProcessing(true);
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onloadend = async () => {
             try {
                const base64String = (reader.result as string).split(',')[1];
                
                // Step 1: Human/Liveness Verification if applicable
                if (onVerification) {
                    setApiVerificationStatus('verifying');
                    const verificationResult = await onVerification(base64String, selectedFile.type);
                    if (!verificationResult.success) {
                        setApiVerificationStatus('failed');
                        setVerificationError(verificationResult.reason);
                        onFileChange(null); // Reject file
                        setIsProcessing(false);
                        return;
                    }
                    setApiVerificationStatus('verified');
                }

                // Step 2: OCR/Document Verification if applicable
                if (onOcrComplete && ocrSchema) {
                    if (costingItemName) {
                        logVerificationUsage(costingItemName);
                    }
                    setApiVerificationStatus('verifying');
                    const extractedData = await api.extractDataFromImage(base64String, selectedFile.type, ocrSchema, docType);

                    // Intelligent Document Check
                    if (docType === 'Aadhaar' && !extractedData.isAadhaar) {
                         setApiVerificationStatus('failed');
                         const reason = extractedData.reason || 'The uploaded document is not a valid Aadhaar card.';
                         setVerificationError(reason);
                         if(setToast) setToast({ message: reason, type: 'error' });
                         onFileChange(null);
                         setIsProcessing(false);
                         return;
                    }

                    onOcrComplete(extractedData);
                    setApiVerificationStatus('verified');
                }

                // Step 3: Finalize upload (mocked)
                const { url } = await api.uploadDocument(selectedFile);
                onFileChange({ ...fileData, progress: 100, url });

            } catch (err: unknown) {
                // Safely extract the error message to prevent "[object Object]"
                const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred during processing.';
                
                setUploadError(errorMessage);
                if (setToast) setToast({ message: errorMessage, type: 'error' });
                onFileChange(null);
            } finally {
                setIsProcessing(false);
            }
        };
    }, [allowedTypes, onFileChange, ocrSchema, onOcrComplete, setToast, onVerification, docType, costingItemName, logVerificationUsage]);

    const handleCapture = useCallback(async (base64Image: string, mimeType: string) => {
        const blob = await (await fetch(`data:${mimeType};base64,${base64Image}`)).blob();
        const capturedFile = new File([blob], `capture-${Date.now()}.jpg`, { type: mimeType });
        handleFileSelect(capturedFile);
    }, [handleFileSelect]);

    const handleRemove = () => {
        if(file) URL.revokeObjectURL(file.preview);
        onFileChange(null);
        setApiVerificationStatus('idle');
        setVerificationError('');
        setUploadError('');
    };

    const inputId = `file-upload-${label.replace(/\s+/g, '-')}`;
    const displayError = error || uploadError || verificationError;
    
    const isBusy = isProcessing || apiVerificationStatus === 'verifying';

    const getIconForLabel = (label: string): React.ElementType => {
        const lowerLabel = label.toLowerCase();
        if (lowerLabel.includes('profile photo')) return UserIcon;
        if (lowerLabel.includes('id proof') || lowerLabel.includes('aadhaar') || lowerLabel.includes('pan') || lowerLabel.includes('voter')) return CreditCard;
        if (lowerLabel.includes('bank proof')) return IndianRupee;
        if (lowerLabel.includes('signature')) return FileSignature;
        if (lowerLabel.includes('fingerprint')) return Fingerprint;
        if (lowerLabel.includes('certificate')) return GraduationCap;
        return FileText; // A good default for "document"
    };

    const Icon = getIconForLabel(label);

    return (
        <div className="w-full">
            <ImagePreviewModal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} imageUrl={file?.preview || ''} />
            {isCameraOpen && <CameraCaptureModal isOpen={isCameraOpen} onClose={() => setIsCameraOpen(false)} onCapture={handleCapture} captureGuidance={captureGuidance} />}

            <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-gray-400" htmlFor={inputId}>{label}</label>
                {/* FIX: Replaced the `title` prop on `lucide-react` icons with a wrapping `<span>` to provide a tooltip, as the `title` prop is not supported directly. */}
                {verificationStatus === true && <span title="Verified"><CheckCircle className="h-4 w-4 text-green-400" /></span>}
                {/* FIX: Replaced the `title` prop on `lucide-react` icons with a wrapping `<span>` to provide a tooltip, as the `title` prop is not supported directly. */}
                {verificationStatus === false && <span title="Verification Failed"><XCircle className="h-4 w-4 text-red-400" /></span>}
            </div>

            <div 
                 className={`
                    flex flex-col items-center justify-center transition-all duration-300
                    w-full text-center rounded-2xl bg-[#243524]
                    ${isFieldOfficer ? 'min-h-[150px]' : 'min-h-[200px]'}
                    ${file ? 'p-2 border border-solid border-gray-600' : 'p-6 border-2 border-dashed border-emerald-400'}
                    ${displayError ? '!border-red-500' : ''}`
                }
            >
                {file ? (
                    <div className="w-full flex flex-col h-full">
                        <label htmlFor={inputId} className="flex-grow w-full rounded-md overflow-hidden cursor-pointer group relative bg-black/20 flex items-center justify-center min-h-[100px]">
                            {file.type.startsWith('image/') ? (
                                 <img src={file.preview} alt="preview" className="max-w-full max-h-full object-contain" />
                            ) : (
                                <div className="text-gray-400 p-2">
                                    <FileIcon className="h-10 w-10 mx-auto" />
                                    <span className="text-xs mt-1 block break-all">{file.name}</span>
                                </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                <RefreshCw className="h-6 w-6 text-white" />
                            </div>
                        </label>
                        <div className="mt-2 flex items-center justify-center gap-2 flex-shrink-0">
                            {file.type.startsWith('image/') && (
                                 <button type="button" onClick={() => setIsPreviewOpen(true)} className="text-xs font-medium text-accent hover:underline flex items-center gap-1 p-1">
                                    <Eye className="h-3 w-3" /> View
                                </button>
                            )}
                            <button type="button" onClick={handleRemove} className="text-xs font-medium text-red-400 hover:underline flex items-center gap-1 p-1">
                                <Trash2 className="h-3 w-3" /> Remove
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <Icon className="h-10 w-10 text-gray-400 mb-2" />
                        <p className="font-semibold text-white text-lg">Upload Document</p>
                        <div className="flex items-center gap-4 mt-4">
                            <label htmlFor={inputId} className="fo-btn-primary rounded-full !bg-green-500/20 !text-green-300 hover:!bg-green-500/30 flex items-center gap-2 cursor-pointer !px-4 !py-2">
                                <UploadCloud className="h-4 w-4" />
                                Upload
                            </label>
                            {allowCapture && (
                                <button type="button" onClick={() => setIsCameraOpen(true)} className="fo-btn-secondary rounded-full !bg-gray-500/20 !text-gray-300 !border-gray-500/50 hover:!bg-gray-500/30 flex items-center gap-2 !px-4 !py-2">
                                    <Camera className="h-4 w-4" />
                                    Capture
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
            
            <input id={inputId} type="file" className="sr-only" onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])} accept={allowedTypes.join(',')}/>
            
            <div className="text-center mt-1 min-h-[16px]">
                {isBusy && <div className="text-sm flex items-center justify-center gap-2 text-muted animate-pulse"><Loader2 className="h-4 w-4 animate-spin"/> Verifying...</div>}
                {displayError && <p className="text-xs text-red-500">{displayError}</p>}
            </div>
        </div>
    );
};

export default UploadDocument;