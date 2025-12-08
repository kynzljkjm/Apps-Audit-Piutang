import React, { useRef, useState } from 'react';
import { Upload, FileText, AlertCircle, FileCheck, FileSpreadsheet } from 'lucide-react';
import { UploadedFile } from '../types';

interface FileUploaderProps {
  onFileSelect: (file: UploadedFile) => void;
  disabled?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await validateAndProcessFile(file);
    }
    // Reset input agar bisa upload file yang sama jika perlu
    if (event.target) event.target.value = ''; 
  };

  const validateAndProcessFile = async (file: File) => {
    setErrorMessage(null);
    
    // Validasi Tipe File
    // Browser kadang mendeteksi CSV sebagai application/vnd.ms-excel atau text/plain
    const validTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/webp', 
      'image/heic',
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      'text/plain' // Fallback untuk CSV di beberapa OS
    ];

    const isCsvExtension = file.name.toLowerCase().endsWith('.csv');
    
    if (!validTypes.includes(file.type) && !isCsvExtension) {
      setErrorMessage("Format tidak didukung. Harap unggah PDF, Gambar, atau CSV.");
      return;
    }

    // Validasi Ukuran (Misal 20MB)
    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage("Ukuran file terlalu besar. Maksimal 20MB.");
      return;
    }

    await processFile(file);
  };

  const processFile = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Hapus prefix data URL
        const base64Data = base64String.split(',')[1];
        
        // Normalisasi tipe untuk CSV agar konsisten di backend AI
        let fileType = file.type;
        if (file.name.toLowerCase().endsWith('.csv')) {
            fileType = 'text/csv';
        }

        onFileSelect({
          name: file.name,
          type: fileType,
          data: base64Data,
          size: file.size
        });
        resolve();
      };
      reader.onerror = error => {
        console.error(error);
        setErrorMessage("Gagal membaca file.");
        reject(error);
      };
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await validateAndProcessFile(file);
    }
  };

  return (
    <div className="w-full">
      <div 
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01] shadow-lg shadow-indigo-100' 
            : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-white hover:border-slate-300' : ''}
          ${errorMessage ? 'border-red-300 bg-red-50' : ''}
        `}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="application/pdf,image/jpeg,image/png,image/webp,text/csv,.csv"
        />
        
        <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
          {/* Icon Area */}
          <div className={`
            mb-5 p-4 rounded-full transition-all duration-300 transform group-hover:scale-110
            ${isDragging ? 'bg-white shadow-md text-indigo-600' : 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-100 group-hover:text-indigo-600'}
          `}>
            {isDragging ? (
              <Upload className="w-8 h-8 animate-bounce" />
            ) : (
              <div className="relative">
                <FileText className="w-8 h-8" />
                <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border-2 border-white shadow-sm">
                   <Upload className="w-3.5 h-3.5 text-indigo-600" />
                </div>
              </div>
            )}
          </div>

          {/* Text Area */}
          <h3 className="text-lg font-semibold text-slate-800 mb-2">
            {isDragging ? 'Lepaskan dokumen audit di sini' : 'Unggah Dokumen Audit'}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6 leading-relaxed">
            Klik atau drag file ke area ini. <br/>
            Mendukung format <span className="font-medium text-slate-700">PDF, JPG, PNG, CSV</span>.
          </p>

          {/* Supported Types Badges */}
          <div className="flex flex-wrap justify-center gap-2 mb-2">
             <Badge text="Buku Besar Piutang" />
             <Badge text="Aging Schedule" />
             <Badge text="File CSV / Excel" icon={<FileSpreadsheet className="w-3 h-3 text-green-600"/>} />
             <Badge text="Invoice / Faktur" />
          </div>
          
          {errorMessage && (
            <div className="mt-4 flex items-center gap-2 text-red-600 text-sm bg-red-100/50 px-4 py-2 rounded-lg animate-in fade-in slide-in-from-bottom-2 border border-red-200">
               <AlertCircle className="w-4 h-4 shrink-0" />
               <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Badge = ({ text, icon }: { text: string, icon?: React.ReactNode }) => (
  <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-md uppercase tracking-wide border border-slate-200 flex items-center gap-1">
    {icon || <FileCheck className="w-3 h-3 text-slate-400" />}
    {text}
  </span>
);

export default FileUploader;