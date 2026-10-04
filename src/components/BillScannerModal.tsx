import React, { useState, useRef } from 'react';
import { OCRBillData, Language } from '../types';
import { getTranslation } from '../utils/translations';
import { formatBillingMonth } from '../utils/calculator';
import {
  Camera,
  Upload,
  RotateCw,
  Sliders,
  Check,
  X,
  AlertTriangle,
  Loader2,
  Sparkles,
  RefreshCw,
  FileCheck,
  Eye,
  SwitchCamera,
  FileText,
  FileType,
} from 'lucide-react';

interface BillScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onConfirmBill: (data: OCRBillData, imageBase64?: string) => void;
}

export const BillScannerModal: React.FC<BillScannerModalProps> = ({
  isOpen,
  onClose,
  language,
  onConfirmBill,
}) => {
  const t = getTranslation(language);

  const [step, setStep] = useState<'capture' | 'verify'>('capture');
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf'>('image');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [isEnhanced, setIsEnhanced] = useState<boolean>(true);
  const [perspectiveCorrected, setPerspectiveCorrected] = useState<boolean>(false);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Extracted Bill Form State
  const [formData, setFormData] = useState<OCRBillData>({
    discomName: 'AVVNL',
    kNumber: '',
    consumerName: '',
    billNumber: '',
    billDate: new Date().toISOString().slice(0, 10),
    billingMonth: 'September 2026',
    previousReading: 0,
    currentReading: 0,
    totalUnits: 0,
    energyCharges: 0,
    fixedCharges: 0,
    otherCharges: 0,
    electricityDuty: 0,
    arrears: 0,
    totalBillAmount: 0,
    netPayableAmount: 0,
    dueDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  if (!isOpen) return null;

  // Start Camera
  const startCamera = async (facing: 'environment' | 'user' = 'environment') => {
    try {
      setErrorMessage(null);
      stopCamera();
      const constraints: MediaStreamConstraints = {
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
      setCameraFacing(facing);
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setErrorMessage('Could not open camera. Please upload a photo from gallery instead.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  // Capture from Video Stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 800;
    canvas.height = videoRef.current.videoHeight || 600;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setImageSrc(dataUrl);
    stopCamera();
  };

  // Switch Camera
  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    startCamera(nextFacing);
  };

  // Process Uploaded File (PDF or JPEG/Image)
  const processSelectedFile = (file: File) => {
    setErrorMessage(null);
    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage =
      file.type.startsWith('image/') ||
      file.name.toLowerCase().endsWith('.jpg') ||
      file.name.toLowerCase().endsWith('.jpeg') ||
      file.name.toLowerCase().endsWith('.png') ||
      file.name.toLowerCase().endsWith('.webp');

    if (!isPdf && !isImage) {
      setErrorMessage(
        'Supported formats: PDF documents (.pdf) or JPEG/JPG images (.jpg, .jpeg, .png).'
      );
      return;
    }

    setFileType(isPdf ? 'pdf' : 'image');
    setFileName(file.name);

    const sizeInKb = Math.round(file.size / 1024);
    setFileSize(
      sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`
    );

    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  // File Upload input change
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processSelectedFile(file);
    // Reset input so same file can be re-selected if needed
    e.target.value = '';
  };

  // Drag & drop handlers
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Rotate Image
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Generate Sample AVVNL Bill Image & Data
  const handleLoadSampleBill = () => {
    // Generate a stylized AVVNL bill graphic on a canvas
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 750;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 600, 750);

    // Bill Header
    ctx.fillStyle = '#1e3a8a';
    ctx.fillRect(0, 0, 600, 70);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('AJMER VIDYUT VITRAN NIGAM LIMITED (AVVNL)', 300, 32);
    ctx.font = '14px sans-serif';
    ctx.fillText('Rajasthan Electricity Distribution Company', 300, 54);

    // Details box
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(20, 90, 560, 160);
    ctx.strokeStyle = '#cbd5e1';
    ctx.strokeRect(20, 90, 560, 160);

    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('K-Number: 130523024253', 40, 120);
    ctx.fillText('Bill Number: AVVNL-JP-2026-09-4821', 40, 145);
    ctx.fillText('Consumer: Nagji Yadav (AVVNL)', 40, 170);
    ctx.fillText('Bill Date: 10-09-2026', 40, 195);
    ctx.fillText('Due Date: 25-09-2026', 40, 220);

    // Consumption Box
    ctx.fillStyle = '#eff6ff';
    ctx.fillRect(20, 270, 560, 130);
    ctx.strokeRect(20, 270, 560, 130);
    ctx.fillStyle = '#1e3a8a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('METER READING & CONSUMPTION', 40, 300);
    ctx.fillStyle = '#0f172a';
    ctx.font = '14px sans-serif';
    ctx.fillText('Previous Meter Reading: 1200', 40, 330);
    ctx.fillText('Current Meter Reading: 2200', 40, 355);
    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = '#047857';
    ctx.fillText('TOTAL BILLED UNITS: 1,000 Units', 40, 385);

    // Charges Table
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(20, 420, 560, 190);
    ctx.strokeRect(20, 420, 560, 190);
    ctx.fillStyle = '#0f172a';
    ctx.font = '14px sans-serif';
    ctx.fillText('Energy Charges: ₹7,650.00', 40, 450);
    ctx.fillText('Fixed Charges: ₹1,200.00', 40, 480);
    ctx.fillText('Electricity Duty / Urban Cess: ₹800.00', 40, 510);
    ctx.fillText('Other Surcharges / Meter Rent: ₹350.00', 40, 540);
    ctx.fillText('Arrears / Past Dues: ₹0.00', 40, 570);

    // Net Payable Banner
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(20, 630, 560, 60);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('NET PAYABLE AMOUNT: ₹10,000.00', 40, 670);

    const sampleDataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setImageSrc(sampleDataUrl);
    setFileType('image');
    setFileName('Sample_AVVNL_Bill.jpeg');
    setFileSize('185 KB');
    stopCamera();
  };

  // Perform AI / OCR Extraction
  const processImageOCR = async () => {
    if (!imageSrc) return;
    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/ocr-bill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imageSrc,
          mimeType: fileType === 'pdf' ? 'application/pdf' : 'image/jpeg',
        }),
      });

      const resJson = await response.json();

      if (resJson.success && resJson.data) {
        const d = resJson.data;
        const extractedUnits =
          typeof d.totalUnits === 'number' && d.totalUnits > 0
            ? d.totalUnits
            : formData.totalUnits;
        const extractedAmount =
          typeof d.totalBillAmount === 'number' && d.totalBillAmount > 0
            ? d.totalBillAmount
            : typeof d.netPayableAmount === 'number' && d.netPayableAmount > 0
            ? d.netPayableAmount
            : formData.totalBillAmount;

        setFormData({
          discomName: (d.discomName || '').trim(),
          kNumber: d.kNumber || formData.kNumber || '',
          consumerName: d.consumerName || formData.consumerName || '',
          billNumber: d.billNumber || formData.billNumber || '',
          billDate: d.billDate || formData.billDate || new Date().toISOString().slice(0, 10),
          billingMonth: formatBillingMonth(d.billingMonth || formData.billingMonth),
          previousReading: typeof d.previousReading === 'number' ? d.previousReading : formData.previousReading,
          currentReading: typeof d.currentReading === 'number' ? d.currentReading : formData.currentReading,
          totalUnits: extractedUnits,
          energyCharges: d.energyCharges,
          fixedCharges: d.fixedCharges,
          otherCharges: d.otherCharges,
          electricityDuty: d.electricityDuty,
          arrears: d.arrears,
          totalBillAmount: extractedAmount,
          netPayableAmount: typeof d.netPayableAmount === 'number' ? d.netPayableAmount : extractedAmount,
          dueDate: d.dueDate || formData.dueDate || '',
          confidenceNotes: d.confidenceNotes,
        });
        setStep('verify');
      } else {
        // Fallback: If model is busy (503), offline, or experiencing high demand, provide pre-filled fields
        const d = resJson.data || {};
        setFormData((prev) => ({
          ...prev,
          discomName: (d.discomName || prev.discomName || '').trim(),
          billingMonth: formatBillingMonth(d.billingMonth || prev.billingMonth),
          totalUnits: typeof d.totalUnits === 'number' ? d.totalUnits : (prev.totalUnits || 1000),
          totalBillAmount: typeof d.totalBillAmount === 'number' ? d.totalBillAmount : (prev.totalBillAmount || 10000),
          energyCharges: d.energyCharges || prev.energyCharges,
          fixedCharges: d.fixedCharges || prev.fixedCharges,
          electricityDuty: d.electricityDuty || prev.electricityDuty,
          otherCharges: d.otherCharges || prev.otherCharges,
          confidenceNotes: d.confidenceNotes || 'Manual verification recommended.',
        }));
        setStep('verify');
        if (resJson.message) {
          setErrorMessage(resJson.message);
        } else {
          setErrorMessage(
            'AI OCR model is currently experiencing high demand. Pre-filled fields for your review so you can continue without delay.'
          );
        }
      }
    } catch (err: any) {
      console.warn('OCR request error:', err);
      // Fallback directly to verify screen so user is never blocked
      setStep('verify');
      setErrorMessage(
        'Could not reach AI OCR server. You can enter or confirm the bill values manually.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFieldChange = (field: keyof OCRBillData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleConfirmAndSave = () => {
    // Validate essential fields
    if (!formData.totalBillAmount || !formData.totalUnits) {
      alert(t.errCouldNotRead);
      return;
    }
    stopCamera();
    onConfirmBill(
      {
        ...formData,
        billingMonth: formatBillingMonth(formData.billingMonth),
        discomName: (formData.discomName || '').trim(),
      },
      imageSrc || undefined
    );
    onClose();
  };

  const missingCriticalInfo =
    formData.totalBillAmount === undefined ||
    formData.totalUnits === undefined ||
    isNaN(Number(formData.totalBillAmount)) ||
    isNaN(Number(formData.totalUnits));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[90vh]">
        {/* Modal Top Bar */}
        <div className="px-4 py-3.5 bg-slate-850 border-b border-slate-800 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-cyan-400" />
            <span className="font-bold text-base sm:text-lg">
              {step === 'capture' ? 'Scan Electricity Bill' : 'Verify Bill Details (बिल सत्यापित करें)'}
            </span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {step === 'capture' ? (
            <div className="space-y-4">
              {/* Camera or Image Preview Stage */}
              <div className="relative bg-slate-950 rounded-xl border border-slate-800 h-64 sm:h-80 flex items-center justify-center overflow-hidden">
                {isCameraActive ? (
                  <div className="relative w-full h-full">
                    <video
                      ref={videoRef}
                      playsInline
                      autoPlay
                      muted
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 border-2 border-dashed border-cyan-400/50 pointer-events-none m-4 rounded-lg flex items-center justify-center">
                      <span className="text-[11px] bg-black/60 text-cyan-300 px-2 py-1 rounded">
                        Align AVVNL Bill inside frame
                      </span>
                    </div>

                    <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                      <button
                        onClick={toggleCameraFacing}
                        className="p-2.5 rounded-full bg-slate-800/80 text-white hover:bg-slate-700"
                        title="Switch Camera"
                      >
                        <SwitchCamera className="w-5 h-5" />
                      </button>
                      <button
                        onClick={capturePhoto}
                        className="px-6 py-2.5 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg flex items-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Take Photo</span>
                      </button>
                      <button
                        onClick={stopCamera}
                        className="p-2.5 rounded-full bg-red-600/80 text-white hover:bg-red-500"
                        title="Close Camera"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ) : imageSrc ? (
                  fileType === 'pdf' ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center p-6 bg-slate-900/95 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center mb-3 shadow-lg">
                        <FileText className="w-8 h-8" />
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[11px] font-bold uppercase tracking-wider border border-red-500/30">
                          PDF Document
                        </span>
                        <span className="text-xs text-slate-400 font-mono">{fileSize}</span>
                      </div>
                      <p className="text-sm font-bold text-white max-w-sm truncate" title={fileName}>
                        {fileName || 'AVVNL_Bill.pdf'}
                      </p>
                      <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>PDF Ready for AI OCR Analysis</span>
                      </p>
                      <div className="mt-3 flex items-center gap-2">
                        <a
                          href={imageSrc}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 border border-slate-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open / View PDF</span>
                        </a>
                      </div>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center p-2">
                      <img
                        src={imageSrc}
                        alt="AVVNL Bill"
                        style={{
                          transform: `rotate(${rotation}deg)`,
                          filter: isEnhanced
                            ? 'contrast(130%) brightness(105%)'
                            : 'none',
                        }}
                        className="max-h-full max-w-full object-contain rounded transition-all"
                      />
                      {perspectiveCorrected && (
                        <div className="absolute top-2 left-2 text-[10px] bg-emerald-600/90 text-white px-2 py-0.5 rounded shadow">
                          Perspective Adjusted
                        </div>
                      )}
                      <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-slate-900/80 px-2 py-0.5 rounded text-[10px] text-slate-300 border border-slate-700">
                        <span className="text-amber-400 font-bold">JPEG / Image</span>
                        <span>• {fileSize || 'Standard'}</span>
                      </div>
                    </div>
                  )
                ) : (
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`text-center p-6 w-full h-full flex flex-col items-center justify-center space-y-2.5 transition border-2 border-dashed ${
                      isDragOver
                        ? 'border-cyan-400 bg-cyan-500/10'
                        : 'border-slate-800 hover:border-slate-750'
                    }`}
                  >
                    <div className="flex items-center gap-3 text-slate-400">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                        <FileText className="w-5 h-5" />
                      </div>
                      <span className="text-slate-600 font-bold">+</span>
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-slate-600 font-bold">+</span>
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                        <Camera className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-white">
                        Upload AVVNL Bill (PDF or JPEG)
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Select a digital PDF bill or upload a JPEG/camera photo of the electricity bill.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 text-[10px] font-bold border border-red-500/30">
                        PDF Supported
                      </span>
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                        JPEG / JPG
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                        PNG
                      </span>
                    </div>

                    <button
                      onClick={handleLoadSampleBill}
                      className="inline-flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 underline font-medium pt-1"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Or Load Sample AVVNL Bill to Test</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Image/File Modification Controls */}
              {imageSrc && !isCameraActive && (
                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/80 text-xs text-slate-300">
                  {fileType === 'image' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleRotate}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200"
                      >
                        <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Rotate ({rotation}°)</span>
                      </button>
                      <button
                        onClick={() => setIsEnhanced(!isEnhanced)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition ${
                          isEnhanced
                            ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                            : 'bg-slate-700 border-slate-600 text-slate-300'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>{isEnhanced ? 'High Contrast ON' : 'Enhance'}</span>
                      </button>
                      <button
                        onClick={() => setPerspectiveCorrected(!perspectiveCorrected)}
                        className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border transition ${
                          perspectiveCorrected
                            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                            : 'bg-slate-700 border-slate-600 text-slate-300'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Perspective</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-xs text-red-300">
                      <FileText className="w-4 h-4 text-red-400" />
                      <span className="font-semibold">{fileName || 'PDF Bill Uploaded'}</span>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      setImageSrc(null);
                      setFileName('');
                      setFileSize('');
                    }}
                    className="text-xs text-red-400 hover:text-red-300 px-2 py-1"
                  >
                    Clear File
                  </button>
                </div>
              )}

              {/* Source Action Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => startCamera('environment')}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700 transition"
                >
                  <Camera className="w-4 h-4 text-cyan-400" />
                  <span>Use Camera</span>
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-amber-500/40 transition shadow-sm"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>Upload PDF / JPEG</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadSampleBill}
                  className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-medium text-xs border border-amber-500/30 transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Sample Bill</span>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp,.pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Extraction Trigger */}
              <div className="pt-2">
                <button
                  disabled={!imageSrc || isProcessing}
                  onClick={processImageOCR}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 disabled:pointer-events-none text-slate-950 font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing AVVNL Bill with AI OCR...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-4 h-4" />
                      <span>Extract Details with AI OCR</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* Step B: Verify Bill Details Screen */
            <div className="space-y-4">
              <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-xs text-cyan-200 flex items-start gap-2">
                <Eye className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
                <div>
                  <strong>Verify Bill Details:</strong> AI OCR extracted the fields below. You can edit every field before confirming.
                </div>
              </div>

              {missingCriticalInfo && (
                <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <div>
                    <strong>{t.errCouldNotRead}</strong>
                    <p className="mt-0.5 text-red-300">
                      Total Units and Total Bill Amount are required to calculate the distribution.
                    </p>
                  </div>
                </div>
              )}

              {/* Form Grid with requested fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {/* Electricity Board / Discom */}
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Electricity Board / Discom (बिजली कंपनी / बोर्ड)
                  </label>
                  <input
                    type="text"
                    value={formData.discomName || ''}
                    onChange={(e) => handleFieldChange('discomName', e.target.value)}
                    placeholder="उदा. AVVNL, JVVNL, JDVVNL (या खाली छोड़ें)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                  />
                  <span className="text-[11px] text-slate-400 mt-0.5 block">
                    बिल फोटो पर जो उपलब्ध हो वही लिखें, अन्यथा इसे खाली छोड़ दें।
                  </span>
                </div>

                {/* 1. K No */}
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <label className="block text-slate-300 font-semibold mb-1">
                    K No (के नंबर)
                  </label>
                  <input
                    type="text"
                    value={formData.kNumber || ''}
                    onChange={(e) => handleFieldChange('kNumber', e.target.value)}
                    placeholder="e.g. 2101/0458/9123"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-white outline-none focus:border-cyan-400"
                  />
                </div>

                {/* 2. Consumer Name */}
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Name (उपभोक्ता का नाम)
                  </label>
                  <input
                    type="text"
                    value={formData.consumerName || ''}
                    onChange={(e) => handleFieldChange('consumerName', e.target.value)}
                    placeholder="e.g. Nagji Yadav"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </div>

                {/* 3. Total Bill Rashi - Critical */}
                <div className="p-3.5 rounded-xl bg-slate-800/90 border-2 border-amber-500/70 shadow-sm">
                  <label className="block text-amber-300 font-bold mb-1">
                    * Total Bill Rashi (कुल बिल राशि ₹)
                  </label>
                  <input
                    type="number"
                    value={formData.totalBillAmount ?? ''}
                    onChange={(e) =>
                      handleFieldChange('totalBillAmount', parseFloat(e.target.value) || 0)
                    }
                    placeholder="e.g. 10000"
                    className="w-full bg-slate-900 border border-amber-500/50 rounded-lg px-3 py-2 text-base font-bold text-amber-400 outline-none focus:border-amber-400 font-mono"
                  />
                </div>

                {/* 4. Total Unit - Critical */}
                <div className="p-3.5 rounded-xl bg-slate-800/90 border-2 border-cyan-500/70 shadow-sm">
                  <label className="block text-cyan-300 font-bold mb-1">
                    * Total Unit (कुल यूनिट)
                  </label>
                  <input
                    type="number"
                    value={formData.totalUnits ?? ''}
                    onChange={(e) =>
                      handleFieldChange('totalUnits', parseFloat(e.target.value) || 0)
                    }
                    placeholder="e.g. 1000"
                    className="w-full bg-slate-900 border border-cyan-500/50 rounded-lg px-3 py-2 text-base font-bold text-cyan-400 outline-none focus:border-cyan-400 font-mono"
                  />
                </div>

                {/* 5. Bill Month */}
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Bill Month (बिल का महीना)
                  </label>
                  <input
                    type="text"
                    value={formData.billingMonth || ''}
                    onChange={(e) => handleFieldChange('billingMonth', e.target.value)}
                    onBlur={() => {
                      if (formData.billingMonth) {
                        handleFieldChange('billingMonth', formatBillingMonth(formData.billingMonth));
                      }
                    }}
                    placeholder="e.g. September 2026 or 2026-09"
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                  />
                  {formData.billingMonth && (
                    <span className="text-[11px] text-cyan-400 mt-1 block font-medium">
                      📅 {formatBillingMonth(formData.billingMonth)}
                    </span>
                  )}
                </div>

                {/* 6. Bill Date */}
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Bill Date (बिल की तारीख)
                  </label>
                  <input
                    type="date"
                    value={formData.billDate || ''}
                    onChange={(e) => handleFieldChange('billDate', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </div>

                {/* 7. Due Date */}
                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/80 sm:col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">
                    Due Date (अंतिम भुगतान तिथि)
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate || ''}
                    onChange={(e) => handleFieldChange('dueDate', e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-4 py-3 bg-slate-850 border-t border-slate-800 flex items-center justify-between gap-2">
          {step === 'verify' ? (
            <>
              <button
                type="button"
                onClick={() => setStep('capture')}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Rescan / Change Photo</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmAndSave}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md transition"
              >
                <Check className="w-4 h-4" />
                <span>Confirm Bill & Proceed (पुष्टि करें)</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-medium transition"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => setStep('verify')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-medium border border-slate-700 transition"
              >
                Skip OCR & Enter Manually →
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
