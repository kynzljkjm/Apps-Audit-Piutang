import React, { useRef, useState } from 'react';
import { Upload, FileType, X } from 'lucide-react';
import { UploadedFile } from '../types';

interface FileUploaderProps {
  onFileSelect: (file: UploadedFile) => void;
  disabled?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileSelect, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  const processFile = (file: File) => {
    return new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove data URL prefix (e.g., "data:image/jpeg;base64,") to get raw base64
        const base64Data = base64String.split(',')[1];
        
        onFileSelect({
          name: file.name,
          type: file.type,
          data: base64Data,
          size: file.size
        });
        resolve();
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await processFile(file);
    }
  };

  return (
    <div 
      onClick={() => !disabled && fileInputRef.current?.click()}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300
        ${isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,application/pdf"
      />
      <div className="flex flex-col items-center justify-center gap-3">
        <div className="bg-indigo-100 p-4 rounded-full text-indigo-600">
          <Upload className="w-6 h-6" />
        </div>
        <div className="text-slate-700">
          <span className="font-semibold text-indigo-600">Klik untuk upload</span> atau drag & drop
        </div>
        <p className="text-xs text-slate-500 max-w-xs">
          Mendukung PDF, Gambar (Buku Besar, Aging Schedule, Invoice, dll).
        </p>
      </div>
    </div>
  );
};

export default FileUploader;
