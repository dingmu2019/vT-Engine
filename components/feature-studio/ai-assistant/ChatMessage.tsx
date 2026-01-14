import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bot, User, Copy, Check, Camera, FileText, Printer, Save, Trash2, File as FileIcon, Star, ThumbsUp, ThumbsDown } from 'lucide-react';

export const ChatMessage = ({
  msg,
  metaText,
  t,
  language,
  onCopy,
  onOpenSavePromptModal,
  canDelete,
  onRequestDelete,
  onToggleFavorite,
  onSetReaction,
  onScreenshot,
  onExportPDF,
  onExportWord,
  onApplyToRequirements
}: {
  msg: any;
  metaText: string;
  t: (key: string) => string;
  language: 'zh' | 'en';
  onCopy: (text: string) => void;
  onOpenSavePromptModal: (content: string) => void;
  canDelete: boolean;
  onRequestDelete: (id: string) => void;
  onToggleFavorite: (id: string, favorite: boolean) => void;
  onSetReaction: (id: string, reaction: 'like' | 'dislike' | null) => void;
  onScreenshot: (id: string) => void;
  onExportPDF: (id: string, content: string) => void;
  onExportWord: (id: string, content: string) => void;
  onApplyToRequirements: (content: string) => void;
}) => {
  return (
    <div className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0
                        ${msg.role === 'user'
            ? 'bg-indigo-600 text-white'
            : 'bg-white dark:bg-slate-800 text-indigo-600 border border-gray-200 dark:border-gray-700'
          }`}
      >
        {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
        <div className={`text-[10px] text-gray-400 px-1 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
          {metaText}
        </div>

        {msg.attachments && msg.attachments.length > 0 && (
          <div className={`flex flex-wrap gap-2 mb-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.attachments.map((att: any) => (
              <div key={att.id} className="relative group overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800">
                {att.type === 'image' ? (
                  <img src={att.previewUrl} alt="attachment" className="h-20 w-auto object-cover" />
                ) : att.type === 'video' ? (
                  <video src={att.previewUrl} className="h-20 w-auto object-cover" />
                ) : (
                  <div className="h-20 w-20 flex flex-col items-center justify-center p-2">
                    <FileIcon size={24} className="text-indigo-500 mb-1" />
                    <span className="text-[10px] text-gray-500 truncate w-full text-center">{att.file.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div
          id={`msg-content-${msg.id}`}
          className={`px-4 py-3 rounded-2xl text-sm shadow-sm
                            ${msg.role === 'user'
            ? 'bg-indigo-600 text-white rounded-br-none'
            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-bl-none border border-gray-200 dark:border-gray-800'
          }`}
        >
          {msg.role === 'user' ? (
            <div className="group relative">
              <div className="whitespace-pre-wrap">{msg.content}</div>
              <div className="absolute top-full right-0 mt-1 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white dark:bg-slate-800 shadow-md rounded-lg p-1 border border-gray-100 dark:border-gray-700 z-10">
                <button
                  onClick={() => onCopy(msg.content)}
                  className="p-1 text-gray-400 hover:text-indigo-500 transition-colors"
                  title={t('aiAssistant.copy')}
                >
                  <Copy size={12} />
                </button>
                <button
                  onClick={() => onOpenSavePromptModal(msg.content)}
                  className="p-1 text-gray-400 hover:text-indigo-500 transition-colors"
                  title={t('aiAssistant.savePrompt')}
                >
                  <Save size={12} />
                </button>
                {canDelete && (
                  <button
                    onClick={() => onRequestDelete(String(msg.id))}
                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    title={language === 'zh' ? '删除提问与回复' : 'Delete Q&A pair'}
                  >
                    <Trash2 size={12} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {msg.role === 'model' && (
          <div className="flex gap-2 mt-1 ml-1">
            <button
              onClick={() => onCopy(msg.content)}
              className="p-1 text-gray-400 hover:text-indigo-500 transition-colors flex items-center gap-1 text-[10px]"
              title={t('aiAssistant.copy')}
            >
              <Copy size={12} /> {t('aiAssistant.copy')}
            </button>
            <button
              onClick={() => onToggleFavorite(String(msg.id), !msg.favorite)}
              className={`p-1 transition-colors flex items-center gap-1 text-[10px] ${msg.favorite ? 'text-amber-500' : 'text-gray-400 hover:text-amber-500'}`}
              title={language === 'zh' ? '收藏' : 'Favorite'}
            >
              <Star size={12} />
            </button>
            <button
              onClick={() => onSetReaction(String(msg.id), msg.reaction === 'like' ? null : 'like')}
              className={`p-1 transition-colors flex items-center gap-1 text-[10px] ${msg.reaction === 'like' ? 'text-emerald-600' : 'text-gray-400 hover:text-emerald-600'}`}
              title={language === 'zh' ? '点赞' : 'Like'}
            >
              <ThumbsUp size={12} />
            </button>
            <button
              onClick={() => onSetReaction(String(msg.id), msg.reaction === 'dislike' ? null : 'dislike')}
              className={`p-1 transition-colors flex items-center gap-1 text-[10px] ${msg.reaction === 'dislike' ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
              title={language === 'zh' ? '不认可' : 'Dislike'}
            >
              <ThumbsDown size={12} />
            </button>
            <button
              onClick={() => onScreenshot(String(msg.id))}
              className="p-1 text-gray-400 hover:text-indigo-500 transition-colors flex items-center gap-1 text-[10px]"
              title={t('aiAssistant.screenshot')}
            >
              <Camera size={12} /> {t('aiAssistant.screenshot')}
            </button>
            <button
              onClick={() => onExportPDF(String(msg.id), msg.content)}
              className="p-1 text-gray-400 hover:text-indigo-500 transition-colors flex items-center gap-1 text-[10px]"
              title={t('aiAssistant.exportPdf')}
            >
              <Printer size={12} /> {t('aiAssistant.exportPdf')}
            </button>
            <button
              onClick={() => onExportWord(String(msg.id), msg.content)}
              className="p-1 text-gray-400 hover:text-indigo-500 transition-colors flex items-center gap-1 text-[10px]"
              title={t('aiAssistant.exportWord')}
            >
              <FileText size={12} /> {t('aiAssistant.exportWord')}
            </button>
            <button
              onClick={() => onApplyToRequirements(msg.content)}
              className="p-1 text-gray-400 hover:text-green-600 transition-colors flex items-center gap-1 text-[10px]"
              title={t('aiAssistant.apply')}
            >
              <Check size={12} /> {t('aiAssistant.apply')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
