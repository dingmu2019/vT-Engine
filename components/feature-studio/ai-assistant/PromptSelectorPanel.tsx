import React from 'react';
import { Search } from 'lucide-react';

export const PromptSelectorPanel = ({
  isOpen,
  promptSearchQuery,
  setPromptSearchQuery,
  filteredPrompts,
  onSelectPrompt,
  t
}: {
  isOpen: boolean;
  promptSearchQuery: string;
  setPromptSearchQuery: (v: string) => void;
  filteredPrompts: any[];
  onSelectPrompt: (label: string, content: string) => void;
  t: (key: string) => string;
}) => {
  if (!isOpen) return null;
  return (
    <div className="absolute bottom-full left-4 mb-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden animate-in slide-in-from-bottom-2 fade-in duration-200 z-40 max-h-80">
      <div className="p-2 border-b border-gray-100 dark:border-gray-800">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
          <input
            autoFocus
            type="text"
            value={promptSearchQuery}
            onChange={e => setPromptSearchQuery(e.target.value)}
            placeholder={t('aiAssistant.searchPrompts')}
            className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-slate-900/50 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
      </div>
      <div className="overflow-y-auto custom-scrollbar p-1">
        {filteredPrompts.length > 0 ? (
          filteredPrompts.map(p => (
            <button
              key={p.id}
              onClick={() => onSelectPrompt(p.label, p.content)}
              className="w-full text-left px-3 py-2 hover:bg-indigo-50 dark:hover:bg-slate-700/50 rounded-lg transition-colors group"
            >
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                {p.label}
              </div>
              <div className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5 font-mono opacity-80">
                {p.content}
              </div>
            </button>
          ))
        ) : (
          <div className="p-4 text-center text-xs text-gray-400">
            {t('aiAssistant.noPrompts')}
          </div>
        )}
      </div>
    </div>
  );
};

