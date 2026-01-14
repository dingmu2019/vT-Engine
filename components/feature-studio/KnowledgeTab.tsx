
import React, { useState, useRef } from 'react';
import { 
  FileText, FileSpreadsheet, FileCode, Link as LinkIcon, 
  Image as ImageIcon, Video, BookOpen, CheckCircle2, 
  Database, Loader2, UploadCloud, Plus, Trash2 
} from 'lucide-react';
import { useAuth, useSettings, useToast } from '../../contexts';
import { ModuleData, KnowledgeItem } from '../../types';

interface KnowledgeTabProps {
  data: ModuleData;
  onUpdate: (data: Partial<ModuleData>) => void;
}

export const KnowledgeTab: React.FC<KnowledgeTabProps> = ({ data, onUpdate }) => {
  const { canEditContent } = useAuth();
  const { formatTime, language } = useSettings();
  const { addToast } = useToast();

  const [newLinkUrl, setNewLinkUrl] = useState('');
  const [newLinkTitle, setNewLinkTitle] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const t = (key: string) => {
    const dict: Record<string, { en: string; zh: string }> = {
      'know_desc': { en: 'Manage documents and external links for AI context retrieval.', zh: '管理文档与外链，供 AI 上下文检索使用。' },
      'upload_file': { en: 'Upload Files', zh: '上传资料' },
      'drop_zone': { en: 'Drop PDF, Doc, Excel, Txt, Img, Video', zh: '拖入文档、图片或视频' },
      'add_link': { en: 'Add Index Link', zh: '添加外链索引' },
      'link_title': { en: 'Link Title', zh: '链接标题' },
      'link_url': { en: 'URL', zh: 'URL 地址' },
    };
    return dict[key] ? dict[key][language] : key;
  };

  const getKnowledgeIcon = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="text-red-500" size={20} />;
      case 'excel': return <FileSpreadsheet className="text-green-500" size={20} />;
      case 'api': return <FileCode className="text-blue-500" size={20} />;
      case 'web': return <LinkIcon className="text-indigo-500" size={20} />;
      case 'txt': return <FileText className="text-slate-500" size={20} />;
      case 'image': return <ImageIcon className="text-purple-500" size={20} />;
      case 'video': return <Video className="text-orange-500" size={20} />;
      default: return <BookOpen className="text-gray-500" size={20} />;
    }
  };

  const getStatusBadge = (status: KnowledgeItem['status']) => {
    switch (status) {
      case 'ready':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
             <CheckCircle2 size={12} />
             {language === 'zh' ? 'AI 就绪' : 'AI Ready'}
          </span>
        );
      case 'processing':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 animate-pulse">
             <Database size={12} className="animate-pulse" />
             {language === 'zh' ? '向量化中...' : 'Vectorizing...'}
          </span>
        );
      case 'uploading':
        return (
          <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
             <Loader2 size={12} className="animate-spin" />
             {language === 'zh' ? '切片中...' : 'Slicing...'}
          </span>
        );
      default:
        return null;
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let fileType: KnowledgeItem['type'] = 'doc';
    if (file.type.startsWith('image/')) fileType = 'image';
    else if (file.type.startsWith('video/')) fileType = 'video';
    else if (file.name.endsWith('.pdf')) fileType = 'pdf';
    else if (file.name.endsWith('.xlsx')) fileType = 'excel';
    else if (file.name.endsWith('.txt')) fileType = 'txt';
    
    const fileSize = (file.size / 1024 / 1024).toFixed(1) + ' MB';

    const newItem: KnowledgeItem = {
      id: Date.now().toString(),
      title: file.name,
      url: URL.createObjectURL(file),
      type: fileType,
      status: 'uploading',
      size: fileSize,
      updatedAt: new Date().toISOString()
    };

    onUpdate({ knowledge: [newItem, ...data.knowledge] });

    // Simulate AI Processing Chain
    setTimeout(() => {
        onUpdate({ knowledge: [ { ...newItem, status: 'processing' }, ...data.knowledge ] });
    }, 1500);

    setTimeout(() => {
        onUpdate({ knowledge: [ { ...newItem, status: 'ready' }, ...data.knowledge ] });
        addToast(language === 'zh' ? '文件切片与向量化完成' : 'File sliced and vectorized', 'success');
    }, 4500);

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAddLink = () => {
    if (!newLinkUrl || !newLinkTitle) return;
    const newItem: KnowledgeItem = {
      id: Date.now().toString(),
      title: newLinkTitle,
      url: newLinkUrl,
      type: 'web',
      status: 'ready',
      updatedAt: new Date().toISOString()
    };
    onUpdate({ knowledge: [newItem, ...data.knowledge] });
    setNewLinkUrl('');
    setNewLinkTitle('');
  };

  const handleRemoveKnowledge = (id: string) => {
      onUpdate({ knowledge: data.knowledge.filter(k => k.id !== id) });
  };

  return (
    <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-4 shrink-0">
             <p className="text-sm text-gray-500">{t('know_desc')}</p>
        </div>

        {canEditContent && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 shrink-0">
            {/* File Upload Zone */}
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-6 flex flex-col items-center justify-center text-center hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group relative"
              onClick={() => fileInputRef.current?.click()}
            >
               <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".pdf,.docx,.xlsx,.txt,image/*,video/*"
                  onChange={handleFileUpload}
               />
               <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-full mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud size={24} />
               </div>
               <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200">{t('upload_file')}</h4>
               <p className="text-xs text-gray-400 mt-1">{t('drop_zone')}</p>
            </div>

            {/* Link Input Zone */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-slate-900 flex flex-col justify-center gap-3 shadow-sm">
                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                   <LinkIcon size={16} className="text-indigo-500"/> 
                   {t('add_link')}
                </h4>
                <div className="space-y-2">
                   <input 
                      type="text" 
                      placeholder={t('link_title')}
                      value={newLinkTitle}
                      onChange={e => setNewLinkTitle(e.target.value)}
                      className="w-full text-xs px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500"
                   />
                   <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder={t('link_url')}
                        value={newLinkUrl}
                        onChange={e => setNewLinkUrl(e.target.value)}
                        className="flex-1 text-xs px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-indigo-500"
                      />
                      <button 
                        onClick={handleAddLink}
                        disabled={!newLinkUrl || !newLinkTitle}
                        className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-indigo-700 transition-colors"
                      >
                         <Plus size={16} />
                      </button>
                   </div>
                </div>
            </div>
          </div>
        )}

        <div className="space-y-3 overflow-y-auto flex-1 custom-scrollbar pb-2">
            {data.knowledge.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm group">
                    <div className="flex items-center gap-4">
                        <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-gray-700">
                            {getKnowledgeIcon(item.type)}
                        </div>
                        <div>
                            <h4 className="font-medium text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                               {item.title}
                               <a href={item.url} target="_blank" rel="noreferrer" className="text-gray-400 hover:text-indigo-500">
                                  <LinkIcon size={12} />
                               </a>
                            </h4>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] font-mono uppercase bg-gray-100 dark:bg-slate-800 text-gray-500 px-1.5 py-0.5 rounded">
                                    {item.type}
                                </span>
                                {item.size && (
                                    <span className="text-[10px] text-gray-400">
                                        {item.size}
                                    </span>
                                )}
                                <span className="text-[10px] text-gray-400">
                                    {formatTime(item.updatedAt)}
                                </span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {getStatusBadge(item.status)}
                        {canEditContent && (
                            <button 
                                onClick={() => handleRemoveKnowledge(item.id)}
                                className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <Trash2 size={16} />
                            </button>
                        )}
                    </div>
                </div>
            ))}
            {data.knowledge.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-sm border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                   No knowledge resources added yet.
                </div>
            )}
        </div>
    </div>
  );
};
