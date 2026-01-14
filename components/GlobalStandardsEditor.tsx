
import React from 'react';
import { BookTemplate, ShieldCheck, Globe } from 'lucide-react';
import { useAuth, useNavigation, useSettings, useToast } from '../contexts';

export const GlobalStandardsEditor: React.FC = () => {
  const { canManageGlobalStandards } = useAuth();
  const { globalStandards, updateGlobalStandards } = useNavigation();
  const { language } = useSettings();
  const { addToast } = useToast();

  const t = {
    en: {
      title: 'Global Architecture Standards',
      subtitle: 'Define system-wide rules injected into every AI prompt context.',
      content: 'Standards Content',
      placeholder: 'E.g., All currency must be in cents...',
      readOnly: 'Read-only View (Admin/PM access required to edit)',
      saved: 'Standards updated'
    },
    zh: {
      title: '全局架构规范',
      subtitle: '定义全系统通用规则，将自动注入到所有 AI 指令包中。',
      content: '规范内容',
      placeholder: '例如：所有货币单位必须为分...',
      readOnly: '只读视图 (需要管理员或 PM 权限编辑)',
      saved: '规范已更新'
    }
  };

  const text = t[language];

  const handleChange = (val: string) => {
    updateGlobalStandards(val);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black/20">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0">
        <div>
           <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
             <BookTemplate className="text-amber-500" />
             {text.title}
           </h2>
           <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{text.subtitle}</p>
        </div>
        {!canManageGlobalStandards && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-slate-800 text-gray-500 rounded-lg text-xs font-medium border border-gray-200 dark:border-gray-700">
                <ShieldCheck size={14} />
                {text.readOnly}
            </div>
        )}
      </div>

      {/* Editor Content */}
      <div className="flex-1 p-6 overflow-hidden">
         <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 flex items-center gap-2">
                    <BookTemplate size={14} className="text-indigo-500" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{text.content}</span>
                </div>
                <textarea 
                    className="flex-1 w-full p-4 resize-none outline-none text-sm font-mono text-slate-800 dark:text-slate-200 bg-transparent disabled:opacity-80"
                    value={globalStandards}
                    onChange={(e) => handleChange(e.target.value)}
                    disabled={!canManageGlobalStandards}
                    placeholder={text.placeholder}
                />
            </div>
      </div>
    </div>
  );
};
