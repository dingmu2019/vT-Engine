import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  Send, Bot, User, Copy, Check, Sparkles, 
  Loader2, List, ArrowDown, RefreshCw, Info, X, Camera, FileText,
  Paperclip, Image as ImageIcon, Video as VideoIcon, File as FileIcon, Printer, Save
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { useAIAssistant } from '../../hooks/useAIAssistant';
import { useAuth, useSettings, useToast } from '../../contexts';
import { api } from '../../client';
import { ConfirmModal } from '../ConfirmModal';
import { AgentList } from './ai-assistant/AgentList';
import { AttachmentsPreview } from './ai-assistant/AttachmentsPreview';
import { PromptSelectorPanel } from './ai-assistant/PromptSelectorPanel';
import { SavePromptModal } from './ai-assistant/SavePromptModal';
import { normalizeChatMessage } from './ai-assistant/normalizeChatMessage';
import { ChatMessage } from './ai-assistant/ChatMessage';

interface AIAssistantTabProps {
  moduleId: string;
  moduleName: string;
  onApplyToRequirements: (content: string) => void;
}

export const AIAssistantTab: React.FC<AIAssistantTabProps> = ({ 
  moduleId, 
  moduleName, 
  onApplyToRequirements 
}) => {
  const { language } = useSettings();
  const { user } = useAuth();
  const {
    messages, setMessages,
    inputValue, setInputValue,
    isTyping,
    attachments, setAttachments,
    selectedAgentId, setSelectedAgentId,
    showAgentMenu, setShowAgentMenu,
    showSystemPrompt, setShowSystemPrompt,
    showPromptSelector, setShowPromptSelector,
    promptSearchQuery, setPromptSearchQuery,
    agentPrompts,
    isOptimizing,
    optimizedText, setOptimizedText,
    selectedPromptLabel, setSelectedPromptLabel,
    showSavePromptModal, setShowSavePromptModal,
    promptToSave, setPromptToSave,
    activeAgent,
    messagesEndRef,
    textareaRef,
    fileInputRef,
    handleOptimize,
    handleSendMessage,
    handleSavePrompt,
    processFiles,
    t
  } = useAIAssistant(moduleId, moduleName);

  const { addToast: toast } = useToast();
  const chatListRef = useRef<HTMLDivElement>(null);
  const loadingMoreRef = useRef(false);
  const feedbackRollbackRef = useRef<Record<string, { favorite: boolean; reaction: 'like' | 'dislike' | null }>>({});
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const pageSize = 20;
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const canDeleteMessage = useCallback((msg: any) => {
    if (!msg || msg.role !== 'user') return false;
    if (user?.role === 'Admin') return true;
    if (!user?.id) return false;
    if (String(msg.actorId || '') !== String(user.id)) return false;
    const ts = msg.timestamp ? new Date(msg.timestamp).getTime() : NaN;
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts <= 12 * 60 * 60 * 1000;
  }, [user?.id, user?.role]);

  const formatTimestamp = useCallback((ts?: string) => {
    if (!ts) return '';
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }, [language]);

  const getMetaText = useCallback((msg: any) => {
    const time = formatTimestamp(msg.timestamp);
    const label = msg.promptLabel ? ` · ${msg.promptLabel}` : '';
    if (language === 'zh') {
      return msg.role === 'user'
        ? `提问：${msg.actorName || '用户'} · ${time}${label}`
        : `回复：${msg.actorName || 'AI'} · ${time}${label}`;
    }
    return msg.role === 'user'
      ? `Ask: ${msg.actorName || 'User'} · ${time}${label}`
      : `Reply: ${msg.actorName || 'AI'} · ${time}${label}`;
  }, [formatTimestamp, language]);

  const fetchInitial = useCallback(async () => {
    try {
      const res = await api.aiChat.getCursor(moduleId, pageSize);
      const items = (res?.items || []) as any[];
      const asc = [...items].reverse();
      setMessages(asc.map(normalizeChatMessage));
      setCursor(res?.nextCursor || null);
      setHasMore(!!res?.hasMore);
      requestAnimationFrame(() => {
        chatListRef.current?.scrollTo({ top: chatListRef.current.scrollHeight, behavior: 'auto' });
      });
    } catch (e) {
      console.error(e);
      setMessages([]);
      setCursor(null);
      setHasMore(false);
    }
  }, [moduleId, setMessages]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor || loadingMoreRef.current) return;
    const el = chatListRef.current;
    if (!el) return;
    const prevScrollHeight = el.scrollHeight;
    const prevScrollTop = el.scrollTop;
    try {
      loadingMoreRef.current = true;
      setLoadingMore(true);
      const res = await api.aiChat.getCursor(moduleId, pageSize, cursor);
      const items = (res?.items || []) as any[];
      const asc = [...items].reverse();
      setMessages(prev => [
        ...asc.map(normalizeChatMessage),
        ...prev
      ]);
      setCursor(res?.nextCursor || null);
      setHasMore(!!res?.hasMore);
      requestAnimationFrame(() => {
        const nextScrollHeight = el.scrollHeight;
        el.scrollTop = nextScrollHeight - prevScrollHeight + prevScrollTop;
      });
    } catch (e) {
      console.error(e);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [cursor, hasMore, moduleId, setMessages]);
  
  // Re-implement DOM handlers using 't' from hook
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast(t('aiAssistant.copied'), 'success');
  };

  const confirmDelete = useCallback(async () => {
    if (!pendingDeleteId || deleting) return;
    try {
      setDeleting(true);
      const res = await api.aiChat.deletePair(pendingDeleteId);
      const ids = (res?.deletedIds || []) as string[];
      setMessages(prev => prev.filter(m => !ids.includes(String(m.id))));
      toast(language === 'zh' ? '已删除' : 'Deleted', 'success');
    } catch (e: any) {
      console.error(e);
      toast(language === 'zh' ? `删除失败：${e.message || ''}` : `Delete failed: ${e.message || ''}`, 'error');
    } finally {
      setDeleting(false);
      setPendingDeleteId(null);
    }
  }, [deleting, language, pendingDeleteId, setMessages, toast]);

  const optimisticUpdateFeedback = useCallback((id: string, patch: { favorite?: boolean; reaction?: 'like' | 'dislike' | null }) => {
    setMessages(prev => prev.map((m: any) => {
      if (String(m.id) !== String(id)) return m;
      if (!feedbackRollbackRef.current[String(id)]) {
        feedbackRollbackRef.current[String(id)] = { favorite: !!m.favorite, reaction: (m.reaction === 'like' || m.reaction === 'dislike') ? m.reaction : null };
      }
      return { ...m, ...patch };
    }));
  }, [setMessages]);

  const rollbackFeedback = useCallback((id: string) => {
    const before = feedbackRollbackRef.current[String(id)];
    if (!before) return;
    setMessages(prev => prev.map((m: any) => (String(m.id) === String(id) ? { ...m, ...before } : m)));
    delete feedbackRollbackRef.current[String(id)];
  }, [setMessages]);

  const commitFeedback = useCallback((id: string, next: { favorite: boolean; reaction: 'like' | 'dislike' | null }) => {
    setMessages(prev => prev.map((m: any) => (String(m.id) === String(id) ? { ...m, favorite: !!next.favorite, reaction: next.reaction } : m)));
    delete feedbackRollbackRef.current[String(id)];
  }, [setMessages]);

  const handleToggleFavorite = useCallback(async (id: string, favorite: boolean) => {
    optimisticUpdateFeedback(id, { favorite });
    try {
      const res = await api.aiChat.setFeedback(id, { favorite });
      commitFeedback(id, res);
    } catch (e: any) {
      console.error(e);
      rollbackFeedback(id);
      toast(language === 'zh' ? '操作失败' : 'Failed', 'error');
    }
  }, [commitFeedback, language, optimisticUpdateFeedback, rollbackFeedback, toast]);

  const handleSetReaction = useCallback(async (id: string, reaction: 'like' | 'dislike' | null) => {
    optimisticUpdateFeedback(id, { reaction });
    try {
      const res = await api.aiChat.setFeedback(id, { reaction });
      commitFeedback(id, res);
    } catch (e: any) {
      console.error(e);
      rollbackFeedback(id);
      toast(language === 'zh' ? '操作失败' : 'Failed', 'error');
    }
  }, [commitFeedback, language, optimisticUpdateFeedback, rollbackFeedback, toast]);

  const handleScreenshot = async (msgId: string) => {
    const element = document.getElementById(`msg-content-${msgId}`);
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
      });
      
      canvas.toBlob(async (blob) => {
        if (!blob) {
            toast(t('aiAssistant.screenshotFailed'), 'error');
            return;
        }
        try {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            toast(t('aiAssistant.screenshotSaved'), 'success');
        } catch (err) {
            console.error('Clipboard write failed', err);
            toast(t('aiAssistant.screenshotFailed'), 'error');
        }
      }, 'image/png');
    } catch (err) {
      console.error('Screenshot generation failed', err);
      toast(t('aiAssistant.screenshotFailed'), 'error');
    }
  };

  const generateFileName = (content: string) => {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const cleanModuleName = (moduleName || 'Module').replace(/[^\w\u4e00-\u9fa5]/g, '_');
    const keywords = content.replace(/[^\w\u4e00-\u9fa5]/g, '').substring(0, 15) || 'AI_Output';
    return `${cleanModuleName}+${timestamp}+${keywords}`;
  };

  const handleExportPDF = (msgId: string, content: string) => {
    const element = document.getElementById(`msg-content-${msgId}`);
    if (!element) return;
    const fileName = generateFileName(content);
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${fileName}</title>
          <style>
            body { font-family: sans-serif; line-height: 1.6; padding: 2rem; }
            img { max-width: 100%; }
          </style>
        </head>
        <body>${element.innerHTML}</body>
      </html>
    `;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportWord = (msgId: string, content: string) => {
    const element = document.getElementById(`msg-content-${msgId}`);
    if (!element) return;
    const fileName = generateFileName(content);
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset="utf-8"><title>${fileName}</title></head>
      <body>${element.innerHTML}</body></html>
    `;
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // UI Handlers
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
            const file = items[i].getAsFile();
            if (file) files.push(file);
        }
    }
    if (files.length > 0) {
        e.preventDefault();
        processFiles(files);
    }
  };

  const handleSelectPrompt = (label: string, content: string) => {
    const processedContent = content.replace('{$MenuName}', moduleName);
    setInputValue(processedContent);
    setSelectedPromptLabel(label);
    setShowPromptSelector(false);
    if (textareaRef.current) {
        textareaRef.current.focus();
        setTimeout(() => {
            if(textareaRef.current) {
                textareaRef.current.style.height = 'auto';
                textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
            }
        }, 0);
    }
  };

  const handleSwitchAgent = (agentId: string) => {
      setSelectedAgentId(agentId);
      setShowAgentMenu(false);
  };

  const removeAttachment = (id: string) => {
      setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const files = Array.from(e.target.files) as File[];
        processFiles(files);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyOptimization = () => {
      if (optimizedText) {
          setInputValue(optimizedText);
          setOptimizedText(null);
          setTimeout(() => {
              if (textareaRef.current) {
                  textareaRef.current.style.height = 'auto';
                  textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
              }
          }, 0);
      }
  };

  const openSavePromptModal = (content: string) => {
      setPromptToSave({ label: '', content });
      setShowSavePromptModal(true);
  };

  const filteredPrompts = agentPrompts.filter(p => 
    p.label.toLowerCase().includes(promptSearchQuery.toLowerCase()) || 
    p.content.toLowerCase().includes(promptSearchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black/20 relative">
        {/* Toolbar / Agent Info */}
        <div className="px-4 py-2 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shrink-0">
            {/* Agent Selector Dropdown */}
            <div className="relative" ref={null}>
                <button 
                    onClick={() => setShowAgentMenu(!showAgentMenu)}
                    className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-slate-800 p-1.5 -ml-1.5 rounded-lg transition-colors group"
                >
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/40 dark:to-purple-900/40 flex items-center justify-center text-lg border border-indigo-50 dark:border-indigo-800">
                        {activeAgent.avatar}
                    </div>
                    <div className="text-left">
                        <div className="text-xs text-gray-400 font-medium">{t('aiAssistant.agent')}</div>
                        <div className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                            {activeAgent.name}
                            <ArrowDown size={12} className="text-gray-400" />
                        </div>
                    </div>
                </button>

                {showAgentMenu && (
                    <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700 mb-1">
                            {t('aiAssistant.switchAgent')}
                        </div>
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                            <AgentList 
                                activeAgentId={activeAgent.id} 
                                onSelect={handleSwitchAgent} 
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1">
                <button 
                    onClick={() => setShowSystemPrompt(true)}
                    className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title={t('aiAssistant.viewPrompt')}
                >
                    <Info size={18} />
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1"></div>
                <button 
                    onClick={() => setMessages([])}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    title={t('aiAssistant.clear')}
                >
                    <RefreshCw size={18} />
                </button>
            </div>
        </div>

        {/* System Prompt Modal */}
        {showSystemPrompt && (
            <div className="absolute inset-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 bg-white dark:bg-slate-900">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                           <Sparkles size={18} className="text-amber-500" />
                           {t('aiAssistant.systemPromptTitle')}
                        </h3>
                        <p className="text-xs text-gray-500">{activeAgent.name} - {activeAgent.role}</p>
                    </div>
                    <button 
                        onClick={() => setShowSystemPrompt(false)}
                        className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    <div className="bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 font-mono text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                        {activeAgent.systemPrompt}
                    </div>
                </div>
                <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-900 shrink-0 flex justify-end">
                     <button 
                        onClick={() => setShowSystemPrompt(false)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                    >
                        {t('aiAssistant.close')}
                    </button>
                </div>
            </div>
        )}

        {/* Chat Area */}
        <div
          ref={chatListRef}
          onScroll={() => {
            const el = chatListRef.current;
            if (!el) return;
            if (el.scrollTop <= 80) loadMore();
          }}
          className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar"
        >
            {loadingMore && (
              <div className="flex justify-center py-2 text-[10px] text-gray-400">
                {t('aiAssistant.loading') || 'Loading...'}
              </div>
            )}
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 opacity-60">
                    <Bot size={48} className="text-indigo-200 dark:text-indigo-900" />
                    <div className="text-center max-w-xs">
                        <p className="text-sm mb-2">{activeAgent.description}</p>
                        <p className="text-xs text-gray-400 italic">"{activeAgent.role}"</p>
                    </div>
                </div>
            )}
            
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                msg={msg}
                metaText={getMetaText(msg)}
                t={t}
                language={language}
                onCopy={copyToClipboard}
                onOpenSavePromptModal={openSavePromptModal}
                canDelete={canDeleteMessage(msg)}
                onRequestDelete={setPendingDeleteId}
                onToggleFavorite={handleToggleFavorite}
                onSetReaction={handleSetReaction}
                onScreenshot={handleScreenshot}
                onExportPDF={handleExportPDF}
                onExportWord={handleExportWord}
                onApplyToRequirements={(content) => {
                  onApplyToRequirements(content);
                  toast(t('aiAssistant.applied'), 'success');
                }}
              />
            ))}

            {isTyping && (
                <div className="flex gap-3">
                     <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-indigo-600 shrink-0">
                        <Bot size={16} />
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl rounded-bl-none border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-indigo-500" />
                        <span className="text-xs text-gray-500">{t('aiAssistant.thinking')}</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-3 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 shrink-0 relative">
            <PromptSelectorPanel
              isOpen={showPromptSelector}
              promptSearchQuery={promptSearchQuery}
              setPromptSearchQuery={setPromptSearchQuery}
              filteredPrompts={filteredPrompts}
              onSelectPrompt={handleSelectPrompt}
              t={t}
            />

            <AttachmentsPreview attachments={attachments} removeAttachment={removeAttachment} />

            {/* Optimization Confirmation Panel */}
            {optimizedText && (
                <div className="absolute bottom-full left-0 right-0 mb-2 mx-4 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-indigo-100 dark:border-indigo-900 p-4 animate-in slide-in-from-bottom-2 z-40">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm">
                            <Sparkles size={16} />
                            {t('aiAssistant.optimize')}
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setOptimizedText(null)}
                                className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                            >
                                {t('aiAssistant.discard')}
                            </button>
                            <button 
                                onClick={handleApplyOptimization}
                                className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                {t('aiAssistant.useOptimized')}
                            </button>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg text-sm text-slate-700 dark:text-slate-300 border border-gray-100 dark:border-gray-800 whitespace-pre-wrap max-h-40 overflow-y-auto custom-scrollbar">
                        {optimizedText}
                    </div>
                </div>
            )}

            <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                {/* Paperclip Button */}
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-1 p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title={t('aiAssistant.uploadTooltip')}
                >
                    <Paperclip size={18} />
                </button>
                
                {/* Optimize Button */}
                <button 
                    onClick={handleOptimize}
                    disabled={!inputValue.trim() || isOptimizing}
                    className={`mb-1 p-2 rounded-lg transition-colors ${isOptimizing ? 'text-indigo-600 animate-pulse' : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-200 dark:hover:bg-slate-700'}`}
                    title={t('aiAssistant.optimize')}
                >
                    {isOptimizing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                </button>

                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.json"
                    onChange={handleFileSelect}
                />

                <button 
                    onClick={() => setShowPromptSelector(!showPromptSelector)}
                    className={`mb-1 p-2 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-slate-700 ${showPromptSelector ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'text-gray-400'}`}
                    title={t('aiAssistant.commonPrompts')}
                >
                    <List size={18} />
                </button>
                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    onPaste={handlePaste}
                    placeholder={t('aiAssistant.placeholder')}
                    className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none outline-none resize-none text-sm text-slate-800 dark:text-slate-200 py-2 px-2 custom-scrollbar"
                    rows={1}
                />
                <button
                    onClick={handleSendMessage}
                    disabled={(!inputValue.trim() && attachments.length === 0) || isTyping}
                    className="mb-1 p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all hover:scale-105 active:scale-95"
                >
                    <Send size={18} />
                </button>
            </div>
        </div>

        <SavePromptModal
          isOpen={showSavePromptModal}
          onClose={() => setShowSavePromptModal(false)}
          promptToSave={promptToSave}
          setPromptToSave={setPromptToSave as any}
          onSave={handleSavePrompt}
          t={t}
        />

        <ConfirmModal
          isOpen={!!pendingDeleteId}
          onClose={() => {
            if (deleting) return;
            setPendingDeleteId(null);
          }}
          onConfirm={confirmDelete}
          title={language === 'zh' ? '确认删除？' : 'Confirm delete?'}
          message={language === 'zh'
            ? '仅能删除近12小时内的本人提问；管理员可删除任意时间任意用户。将同时删除该提问及其对应回复。'
            : 'You can only delete your own questions within 12 hours; admins can delete any. This deletes both the question and its reply.'}
          confirmText={language === 'zh' ? '删除' : 'Delete'}
          cancelText={language === 'zh' ? '取消' : 'Cancel'}
          type="danger"
        />
    </div>
  );
};
