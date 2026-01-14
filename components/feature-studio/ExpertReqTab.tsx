
import React from 'react';
import { Save } from 'lucide-react';
import { useAuth, useSettings, useToast } from '../../contexts';
import { ModuleData } from '../../types';

interface ExpertReqTabProps {
  data: ModuleData;
  onUpdate: (data: Partial<ModuleData>) => void;
}

export const ExpertReqTab: React.FC<ExpertReqTabProps> = ({ data, onUpdate }) => {
  const { canEditContent } = useAuth();
  const { language } = useSettings();
  const { addToast } = useToast();

  const t = (key: string) => {
    const dict: Record<string, { en: string; zh: string }> = {
      'desc': { en: 'Business Requirements', zh: '业务需求' },
      'save': { en: 'Save', zh: '保存' },
      'save_success': { en: 'Saved successfully', zh: '保存成功' },
      'placeholder': { en: 'Enter business requirements here (Markdown supported)...', zh: '在此处输入业务需求（支持 Markdown）...' },
    };
    return dict[key] ? dict[key][language] : key;
  };

  const handleSave = () => {
      addToast(t('save_success'), 'success');
  };

  return (
    <div className="flex flex-col h-full gap-3 relative">
        <div className="flex justify-between items-center shrink-0">
          <label className="text-sm font-semibold text-gray-500">{t('desc')}</label>
          <div className="flex items-center gap-2">
            {canEditContent && (
                <button
                    onClick={handleSave}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                >
                    <Save size={14} />
                    <span>{t('save')}</span>
                </button>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 relative">
          <textarea
            className="w-full h-full p-6 bg-white dark:bg-slate-900 border-none outline-none resize-none font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 custom-scrollbar"
            value={data.expertRequirements || ''}
            onChange={(e) => {
              if (!canEditContent) return;
              onUpdate({ expertRequirements: e.target.value });
            }}
            disabled={!canEditContent}
            placeholder={t('placeholder')}
            spellCheck={false}
          />
        </div>
    </div>
  );
};
