import React from 'react';
import { Save, X } from 'lucide-react';

export const SavePromptModal = ({
  isOpen,
  onClose,
  promptToSave,
  setPromptToSave,
  onSave,
  t
}: {
  isOpen: boolean;
  onClose: () => void;
  promptToSave: { label: string; content: string };
  setPromptToSave: (v: { label: string; content: string }) => void;
  onSave: () => void;
  t: (key: string) => string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/50">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Save size={18} className="text-indigo-500" />
            {t('aiAssistant.savePrompt')}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              {t('aiAssistant.promptLabel')}
            </label>
            <input
              type="text"
              value={promptToSave.label}
              onChange={(e) => setPromptToSave({ ...promptToSave, label: e.target.value })}
              className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
              placeholder="e.g., Code Review Standard"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Content
            </label>
            <div className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-950 border border-gray-200 dark:border-gray-800 rounded-xl text-sm text-slate-600 dark:text-slate-400 max-h-32 overflow-y-auto">
              {promptToSave.content}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              {t('aiAssistant.discard')}
            </button>
            <button
              onClick={onSave}
              disabled={!promptToSave.label.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl shadow-sm shadow-indigo-200 dark:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('aiAssistant.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

