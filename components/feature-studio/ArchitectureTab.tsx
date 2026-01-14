import React from 'react';
import { Save } from 'lucide-react';
import { useAuth, useSettings, useToast } from '../../contexts';
import { ModuleData } from '../../types';

interface ArchitectureTabProps {
  data: ModuleData;
  onUpdate: (data: Partial<ModuleData>) => void;
}

export const ArchitectureTab: React.FC<ArchitectureTabProps> = ({ data, onUpdate }) => {
  const { canEditContent } = useAuth();
  const { language } = useSettings();
  const { addToast } = useToast();

  const getArchitectureDoc = () => {
    const docs = (data.knowledge || []).filter(k => k.tags?.includes('architecture'));
    if (docs.length === 0) return null;
    return docs.reduce((a, b) => (new Date(a.updatedAt).getTime() >= new Date(b.updatedAt).getTime() ? a : b));
  };

  const doc = getArchitectureDoc();
  const value = doc?.content || '';

  const updateContent = (content: string) => {
    const now = new Date().toISOString();
    if (doc) {
      onUpdate({
        knowledge: (data.knowledge || []).map(k => (k.id === doc.id ? { ...k, content, updatedAt: now } : k))
      });
      return;
    }
    onUpdate({
      knowledge: [
        ...(data.knowledge || []),
        {
          id: Date.now().toString(),
          title: 'Technical Architecture',
          type: 'doc',
          content,
          tags: ['architecture'],
          updatedAt: now,
        }
      ]
    });
  };

  const t = (key: string) => {
    const dict: Record<string, { en: string; zh: string }> = {
      title: { en: 'Technical Architecture', zh: '技术架构' },
      save: { en: 'Save', zh: '保存' },
      saved: { en: 'Saved successfully', zh: '保存成功' },
      placeholder: { en: 'Paste or edit architecture markdown here...', zh: '在此处粘贴或编辑技术架构 Markdown...' },
    };
    return dict[key] ? dict[key][language] : key;
  };

  return (
    <div className="flex flex-col h-full gap-3 relative">
      <div className="flex justify-between items-center shrink-0">
        <label className="text-sm font-semibold text-gray-500">{t('title')}</label>
        <div className="flex items-center gap-2">
          {canEditContent && (
            <button
              onClick={() => {
                addToast(t('saved'), 'success');
              }}
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
          value={value}
          onChange={(e) => {
            if (!canEditContent) return;
            updateContent(e.target.value);
          }}
          disabled={!canEditContent}
          placeholder={t('placeholder')}
          spellCheck={false}
        />
      </div>
    </div>
  );
};
