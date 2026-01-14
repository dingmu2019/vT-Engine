import React from 'react';
import { Video as VideoIcon, File as FileIcon, X } from 'lucide-react';

export const AttachmentsPreview = ({ attachments, removeAttachment }: { attachments: any[]; removeAttachment: (id: string) => void }) => {
  if (!attachments || attachments.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto mb-3 pb-2 custom-scrollbar">
      {attachments.map(att => (
        <div key={att.id} className="relative shrink-0 group">
          <div className="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-50 dark:bg-slate-800 flex items-center justify-center">
            {att.type === 'image' ? (
              <img src={att.previewUrl} alt="preview" className="w-full h-full object-cover" />
            ) : att.type === 'video' ? (
              <VideoIcon size={20} className="text-indigo-500" />
            ) : (
              <FileIcon size={20} className="text-gray-500" />
            )}
          </div>
          <button
            onClick={() => removeAttachment(att.id)}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 shadow-sm z-10"
          >
            <X size={10} />
          </button>
          <div className="text-[9px] text-gray-500 truncate w-16 mt-0.5">{att.file.name}</div>
        </div>
      ))}
    </div>
  );
};

