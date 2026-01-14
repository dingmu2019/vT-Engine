
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Edit3, Columns, Eye, Bold, Italic, Strikethrough, 
  List, ListOrdered, Heading1, Heading2, Heading3, 
  Code as CodeIcon, Quote, Link as LinkIcon,
  History, X, Save, RotateCcw, MonitorSmartphone
} from 'lucide-react';
import { useAuth, useSettings, useToast } from '../../contexts';
import { ModuleData, ModuleVersion } from '../../types';
import { MockupGenerator } from './MockupGenerator';
import { ConfirmModal } from '../ConfirmModal';

interface RequirementsTabProps {
  data: ModuleData;
  onUpdate: (data: Partial<ModuleData>) => void;
}

type EditorViewMode = 'edit' | 'split' | 'preview';

export const RequirementsTab: React.FC<RequirementsTabProps> = ({ data, onUpdate }) => {
  const { canEditContent, user } = useAuth();
  const { formatTime, language } = useSettings();
  const { addToast } = useToast();

  const [reqViewMode, setReqViewMode] = useState<EditorViewMode>('split');
  const [showHistory, setShowHistory] = useState(false);
  const [showMockup, setShowMockup] = useState(false);
  
  // Version History State
  const [newVersionTag, setNewVersionTag] = useState('');
  const [newVersionNote, setNewVersionNote] = useState('');
  
  // Confirmation State
  const [confirmRestoreVersion, setConfirmRestoreVersion] = useState<ModuleVersion | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const scrollSource = useRef<string | null>(null);

  const t = (key: string) => {
    const dict: Record<string, { en: string; zh: string }> = {
      'req_desc': { en: 'User Stories & Acceptance Criteria', zh: '用户故事与验收标准' },
      'history': { en: 'Version History', zh: '历史版本' },
      'view_ui': { en: 'View Mockup', zh: '查看效果图' },
      'view_edit': { en: 'Edit', zh: '编辑' },
      'view_split': { en: 'Split', zh: '双栏' },
      'view_preview': { en: 'Preview', zh: '预览' },
      'snapshot_create': { en: 'Create Snapshot', zh: '创建快照' },
      'tag': { en: 'Tag (e.g. v1.0)', zh: '版本号 (如 v1.0)' },
      'note': { en: 'Note', zh: '备注' },
      'save_snap': { en: 'Save', zh: '保存' },
      'restore': { en: 'Restore', zh: '回滚' },
    };
    return dict[key] ? dict[key][language] : key;
  };

  const handleTextareaScroll = (e: React.UIEvent<HTMLTextAreaElement>) => {
    if (scrollSource.current === 'preview') return;
    scrollSource.current = 'editor';
    const target = e.currentTarget;
    if (previewRef.current) {
      const percentage = target.scrollTop / (target.scrollHeight - target.clientHeight);
      if (!isNaN(percentage)) {
         previewRef.current.scrollTop = percentage * (previewRef.current.scrollHeight - previewRef.current.clientHeight);
      }
    }
    setTimeout(() => { if (scrollSource.current === 'editor') scrollSource.current = null; }, 50);
  };

  const handlePreviewScroll = (e: React.UIEvent<HTMLDivElement>) => {
      if (scrollSource.current === 'editor') return;
      scrollSource.current = 'preview';
      const target = e.currentTarget;
      const percentage = target.scrollTop / (target.scrollHeight - target.clientHeight);
      const textarea = textareaRef.current;
      if (textarea && !isNaN(percentage)) {
          textarea.scrollTop = percentage * (textarea.scrollHeight - textarea.clientHeight);
      }
      setTimeout(() => { if (scrollSource.current === 'preview') scrollSource.current = null; }, 50);
  };

  const insertFormat = (type: 'bold' | 'italic' | 'strike' | 'code' | 'h1' | 'h2' | 'h3' | 'ul' | 'ol' | 'quote' | 'link') => {
    const textarea = textareaRef.current;
    if (!textarea || !canEditContent) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);
    
    let before = '';
    let after = '';

    switch (type) {
        case 'bold': before = '**'; after = '**'; break;
        case 'italic': before = '*'; after = '*'; break;
        case 'strike': before = '~~'; after = '~~'; break;
        case 'code': 
            if (selectedText.includes('\n')) { before = '```\n'; after = '\n```'; }
            else { before = '`'; after = '`'; }
            break;
        case 'h1': before = '# '; break;
        case 'h2': before = '## '; break;
        case 'h3': before = '### '; break;
        case 'ul': before = '- '; break;
        case 'ol': before = '1. '; break;
        case 'quote': before = '> '; break;
        case 'link': before = '['; after = '](url)'; break;
    }

    // Simple insertion logic
    const insertion = before + (selectedText || (type === 'ul' || type === 'ol' || type === 'quote' || type.startsWith('h') ? 'Text' : type)) + after;
    const newValue = text.substring(0, start) + insertion + text.substring(end);
    
    onUpdate({ requirements: newValue });
    
    // Restore focus and selection
    setTimeout(() => {
        if (textarea) {
            textarea.focus();
            const newCursorPos = start + before.length + (selectedText.length || (type === 'ul' || type === 'ol' || type === 'quote' || type.startsWith('h') ? 4 : type.length));
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
    }, 0);
  };

  const handleSaveSnapshot = () => {
      if (!newVersionTag) {
          addToast(language === 'zh' ? '请输入版本号' : 'Please enter a version tag', 'error');
          return;
      }
      const snapshot: ModuleVersion = {
          id: Date.now().toString(),
          tag: newVersionTag,
          note: newVersionNote,
          timestamp: new Date().toISOString(),
          createdBy: user.name,
          data: {
              requirements: data.requirements,
              logicRules: JSON.parse(JSON.stringify(data.logicRules)),
              uiComponents: JSON.parse(JSON.stringify(data.uiComponents))
          }
      };
      onUpdate({ versions: [snapshot, ...data.versions] });
      addToast(language === 'zh' ? '快照已保存' : 'Snapshot saved', 'success');
      setNewVersionTag('');
      setNewVersionNote('');
  };

  const handleRestoreSnapshot = (v: ModuleVersion) => {
      setConfirmRestoreVersion(v);
  };

  const executeRestoreSnapshot = () => {
      if (!confirmRestoreVersion) return;
      
      const v = confirmRestoreVersion;
      onUpdate({
          requirements: v.data.requirements,
          logicRules: JSON.parse(JSON.stringify(v.data.logicRules)),
          uiComponents: JSON.parse(JSON.stringify(v.data.uiComponents))
      });
      addToast(language === 'zh' ? '版本已回滚' : 'Version restored', 'success');
      setShowHistory(false);
      setConfirmRestoreVersion(null);
  };

  return (
    <div className="flex flex-col h-full gap-3 relative">
        <div className="flex justify-between items-center shrink-0">
          <label className="text-sm font-semibold text-gray-500">{t('req_desc')}</label>
          <div className="flex items-center gap-2">
             <button
               onClick={() => setShowMockup(true)}
               className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
             >
                <MonitorSmartphone size={14} />
                <span className="hidden sm:inline">{t('view_ui')}</span>
             </button>

             <button
               onClick={() => setShowHistory(!showHistory)}
               className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border border-gray-200 dark:border-gray-700
                  ${showHistory 
                    ? 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300' 
                    : 'bg-white dark:bg-slate-800 text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
             >
                <History size={14} />
                <span className="hidden sm:inline">{t('history')}</span>
             </button>
             <div className="h-4 w-px bg-gray-300 dark:bg-gray-700 mx-1"></div>
             <div className="flex bg-gray-100 dark:bg-slate-800 rounded-lg p-1">
                {(['edit', 'split', 'preview'] as EditorViewMode[]).map(mode => (
                    <button 
                        key={mode}
                        onClick={() => setReqViewMode(mode)} 
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${reqViewMode===mode ? 'bg-white dark:bg-slate-700 shadow-sm text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        {mode === 'edit' && <Edit3 size={14} />}
                        {mode === 'split' && <Columns size={14} />}
                        {mode === 'preview' && <Eye size={14} />}
                        {t(`view_${mode}`)}
                    </button>
                ))}
             </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-0 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 relative">
          
          {(reqViewMode === 'edit' || reqViewMode === 'split') && canEditContent && (
             <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900/50 overflow-x-auto custom-scrollbar shrink-0">
                <button onClick={() => insertFormat('bold')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300" title="Bold"><Bold size={14}/></button>
                <button onClick={() => insertFormat('italic')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300" title="Italic"><Italic size={14}/></button>
                <button onClick={() => insertFormat('strike')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300" title="Strikethrough"><Strikethrough size={14}/></button>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1"></div>
                <button onClick={() => insertFormat('h1')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300" title="Heading 1"><Heading1 size={14}/></button>
                <button onClick={() => insertFormat('h2')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300" title="Heading 2"><Heading2 size={14}/></button>
                <button onClick={() => insertFormat('h3')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300" title="Heading 3"><Heading3 size={14}/></button>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1"></div>
                <button onClick={() => insertFormat('ul')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300" title="Bulleted List"><List size={14}/></button>
                <button onClick={() => insertFormat('ol')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300" title="Ordered List"><ListOrdered size={14}/></button>
                <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1"></div>
                <button onClick={() => insertFormat('code')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300" title="Code Block"><CodeIcon size={14}/></button>
                <button onClick={() => insertFormat('quote')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300" title="Quote"><Quote size={14}/></button>
                <button onClick={() => insertFormat('link')} className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300" title="Link"><LinkIcon size={14}/></button>
             </div>
          )}

          <div className="flex-1 flex h-full overflow-hidden relative">
            {showHistory && (
               <div className="absolute top-0 right-0 bottom-0 w-80 bg-white dark:bg-slate-900 border-l border-gray-200 dark:border-gray-700 z-20 shadow-xl flex flex-col animate-in slide-in-from-right duration-200">
                  <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                     <h3 className="font-semibold text-sm text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <History size={16} /> {t('history')}
                     </h3>
                     <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-gray-600"><X size={16}/></button>
                  </div>
                  
                  {canEditContent && (
                      <div className="p-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-800/50 space-y-3">
                          <div className="text-xs font-semibold text-gray-500 uppercase">{t('snapshot_create')}</div>
                          <input type="text" placeholder={t('tag')} value={newVersionTag} onChange={(e) => setNewVersionTag(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs outline-none focus:border-indigo-500" />
                          <input type="text" placeholder={t('note')} value={newVersionNote} onChange={(e) => setNewVersionNote(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-md text-xs outline-none focus:border-indigo-500" />
                          <button onClick={handleSaveSnapshot} disabled={!newVersionTag} className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-xs font-medium disabled:opacity-50 transition-colors">
                              <Save size={14} /> {t('save_snap')}
                          </button>
                      </div>
                  )}

                  <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
                      {data.versions && data.versions.length > 0 ? (
                          data.versions.map((v) => (
                              <div key={v.id} className="group p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500 transition-colors">
                                  <div className="flex items-center justify-between mb-1">
                                      <span className="font-bold text-sm text-indigo-600 dark:text-indigo-400">{v.tag}</span>
                                      <span className="text-[10px] text-gray-400">{formatTime(v.timestamp)}</span>
                                  </div>
                                  <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">{v.note}</p>
                                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                                      <span className="text-[10px] text-gray-400">{v.createdBy}</span>
                                      {canEditContent && (
                                          <button onClick={() => handleRestoreSnapshot(v)} className="flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                              <RotateCcw size={10} /> {t('restore')}
                                          </button>
                                      )}
                                  </div>
                              </div>
                          ))
                      ) : (
                          <div className="text-center py-8 text-gray-400 text-xs">No history available</div>
                      )}
                  </div>
               </div>
            )}

            {(reqViewMode === 'edit' || reqViewMode === 'split') && (
              <div className={`flex-1 h-full overflow-hidden ${reqViewMode === 'split' ? 'w-1/2 border-r border-gray-200 dark:border-gray-800' : 'w-full'}`}>
                   <textarea
                      ref={textareaRef}
                      className="w-full h-full p-6 bg-white dark:bg-slate-900 border-none outline-none resize-none font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 custom-scrollbar"
                      value={data.requirements || ''}
                      onScroll={handleTextareaScroll}
                      onChange={(e) => {
                           if (!canEditContent) return;
                           onUpdate({ requirements: e.target.value });
                      }}
                      disabled={!canEditContent}
                      placeholder={language === 'zh' ? '在此处输入需求文档（支持 Markdown）...' : 'Enter requirements here (Markdown supported)...'}
                      spellCheck={false}
                   />
              </div>
            )}

            {(reqViewMode === 'preview' || reqViewMode === 'split') && (
               <div 
                  ref={previewRef}
                  onScroll={handlePreviewScroll}
                  className={`flex-1 h-full overflow-y-auto p-6 bg-gray-50/50 dark:bg-slate-900/50 prose prose-sm dark:prose-invert max-w-none custom-scrollbar
                  prose-headings:font-bold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-slate-600 dark:prose-p:text-slate-300
                  prose-a:text-indigo-600 dark:prose-a:text-indigo-400 hover:prose-a:underline
                  prose-pre:bg-gray-800 dark:prose-pre:bg-black prose-pre:rounded-lg
                  prose-blockquote:border-l-4 prose-blockquote:border-indigo-400 prose-blockquote:bg-indigo-50 dark:prose-blockquote:bg-indigo-900/10 prose-blockquote:px-4 prose-blockquote:py-1 prose-blockquote:not-italic
                  prose-th:text-slate-700 dark:prose-th:text-slate-200 prose-td:text-slate-600 dark:prose-td:text-slate-300
                  ${reqViewMode === 'split' ? 'w-1/2' : 'w-full'}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {data.requirements || (language === 'zh' ? '*暂无内容，请点击编辑开始编写...*' : '*No content, click Edit to start writing...*')}
                  </ReactMarkdown>
               </div>
            )}
          </div>
        </div>

        {/* Mockup Modal */}
        <MockupGenerator 
            isOpen={showMockup}
            onClose={() => setShowMockup(false)}
            requirements={data.requirements}
            contextName={data.name}
        />

        {/* Confirmation Modal */}
        <ConfirmModal
            isOpen={!!confirmRestoreVersion}
            onClose={() => setConfirmRestoreVersion(null)}
            onConfirm={executeRestoreSnapshot}
            title={language === 'zh' ? '确认回滚' : 'Confirm Restore'}
            message={confirmRestoreVersion ? (language === 'zh' ? `确认回滚到版本 ${confirmRestoreVersion.tag}? 当前未保存的内容将丢失。` : `Restore version ${confirmRestoreVersion.tag}? Unsaved changes will be lost.`) : ''}
            confirmText={language === 'zh' ? '回滚' : 'Restore'}
            cancelText={language === 'zh' ? '取消' : 'Cancel'}
            type="warning"
        />
    </div>
  );
};
