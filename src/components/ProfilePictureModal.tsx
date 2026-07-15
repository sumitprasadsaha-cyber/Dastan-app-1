import React, { useRef } from "react";
import { Image, X } from "lucide-react";

interface ProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhoto: (dataUrl: string) => void;
}

export default function ProfilePictureModal({
  isOpen,
  onClose,
  onSelectPhoto
}: ProfilePictureModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle local file picking
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") {
          onSelectPhoto(reader.result);
          onClose();
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center p-0" id="profile-picture-modal">
      {/* Background Overlay dismissal */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal box */}
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl animate-slideUp z-10 flex flex-col gap-5 border border-slate-100 dark:border-slate-800 m-0 sm:m-4">
        {/* Close indicator/handle for bottom-sheet */}
        <div className="w-12 h-1 bg-slate-200 dark:bg-slate-700 rounded-full self-center sm:hidden mb-1" />

        {/* Header */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
            Update Student Photo
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Native File Selector Hidden Input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
          id="profile-picture-file-input"
        />

        {/* Select from device action section */}
        <div className="flex flex-col gap-3 py-4">
          <button
            onClick={triggerFileSelect}
            className="w-full py-6 px-5 border-2 border-dashed border-blue-200 dark:border-blue-900/50 hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 rounded-2xl flex flex-col items-center justify-center gap-3 font-bold text-slate-700 dark:text-slate-300 transition-all duration-200 cursor-pointer group"
          >
            <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-full group-hover:scale-110 transition-transform">
              <Image className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex flex-col items-center text-center">
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">Select Photo from Gallery</span>
              <span className="text-xs text-slate-400 dark:text-slate-500 mt-1">Supports PNG, JPG, JPEG</span>
            </div>
          </button>
        </div>

        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 text-center leading-relaxed">
          Photo changes are persisted to your local tuition registry.
        </p>
      </div>
    </div>
  );
}
