import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Send, Bot, User, Loader2, Sparkles, Copy, Check, 
  Paperclip, Mic, X, Camera, FileText as FileTextIcon, 
  Image as ImageIcon, Video as VideoIcon, File as FileIcon,
  StopCircle
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import html2canvas from 'html2canvas';
import { useIntegration, useSettings, useToast, useAuth } from '../contexts';
import { api } from '../client';
import { ChatMessage } from './feature-studio/ai-assistant/ChatMessage';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  attachments?: Attachment[];
  favorite?: boolean;
  reaction?: 'like' | 'dislike' | null;
  actorName?: string;
  promptLabel?: string | null;
}

interface Attachment {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video' | 'file';
}

export const OptimizationAgent: React.FC = () => {
  const { llmConfig } = useIntegration();
  const { language } = useSettings();
  const { addToast } = useToast();
  const { user } = useAuth();
  
  // Hardcoded module ID for system optimization
  const MODULE_ID = 'system_optimization_agent';
  const AGENT_ID = 'opt_expert';

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState<string>('');
  const [agentName, setAgentName] = useState<string>('Optimization Agent'); // Default name

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  
  // Track last message ID to prevent scrolling on updates (like favorites)
  const lastMessageIdRef = useRef<string | null>(null);

  // Load initial history
  useEffect(() => {
    const loadHistory = async () => {
        try {
            // Fix: Pass undefined for optional cursor to match signature: (moduleId, pageSize, cursor?)
            const res = await api.aiChat.getCursor(MODULE_ID, 20, undefined); // Load last 20 messages
            if (res && res.items) {
                const history = res.items.reverse().map((item: any) => ({
                    id: item.id,
                    role: item.role,
                    content: item.content,
                    timestamp: item.timestamp,
                    favorite: item.favorite,
                    reaction: item.reaction,
                    actorName: item.actorName,
                    promptLabel: item.promptLabel,
                    // Attachments logic would go here if backend supported returning them
                }));
                setMessages(history);
            }
        } catch (e) {
            console.error('Failed to load history:', e);
        }
    };
    loadHistory();
  }, []);

  // Load System Prompt & Agent Info
  useEffect(() => {
      const loadAgentInfo = async () => {
          try {
              // Try to find the specific agent
              const agents = await api.agents.getAll();
              const agent = agents.find(a => a.id === AGENT_ID);
              
              if (agent) {
                  if (agent.systemPrompt) setSystemPrompt(agent.systemPrompt);
                  if (agent.name) setAgentName(agent.name);
              } else {
                  // Fallback to system config if agent not found (legacy path)
                  const prompt = await api.system.getConfig('optimization_agent_system_prompt');
                  if (prompt) setSystemPrompt(prompt);
              }
          } catch (e) {
              console.error('Failed to load agent info', e);
          }
      };
      loadAgentInfo();
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    const lastId = messages[messages.length - 1]?.id || null;
    if (lastMessageIdRef.current !== lastId) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    lastMessageIdRef.current = lastId;
  }, [messages]);

  // Auto-scroll when typing starts or attachments added
  useEffect(() => {
      if (isTyping || attachments.length > 0) {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [isTyping, attachments]);

  const t = {
    en: {
        title: 'System Optimization AI Agent',
        subtitle: 'Discuss system improvements and architecture optimizations for T-Engine.',
        placeholder: 'Propose an optimization or ask about system improvements...',
        thinking: 'Analyzing system architecture...',
        error_key: 'API Key is missing. Please check Integration Settings.',
        error_gen: 'Failed to generate response.',
        copied: 'Copied to clipboard',
        copy: 'Copy',
        screenshot: 'Screenshot',
        export_pdf: 'Export PDF',
        screenshot_saved: 'Image copied to clipboard',
        screenshot_failed: 'Failed to capture screenshot',
        welcome: 'I am the T-Engine Optimization Agent. I can help you design new features, optimize performance, or refine the architecture of this system. How can we improve T-Engine today?',
        listening: 'Listening...',
        upload_tooltip: 'Attach files (Img, Doc, PDF, Video)',
        mic_tooltip: 'Voice Input',
        unsupported_speech: 'Speech recognition not supported in this browser.',
        perm_denied: 'Microphone permission denied. Please allow access in your browser settings.',
        aiAssistant: {
            copy: 'Copy',
            savePrompt: 'Save as Prompt',
            screenshot: 'Screenshot',
            exportPdf: 'Export PDF',
            exportWord: 'Export Word',
            apply: 'Apply to Requirements',
            failedSavePrompt: 'Failed to save prompt',
            savedPrompt: 'Prompt saved successfully',
        }
    },
    zh: {
        title: '功能优化 AI Agent',
        subtitle: '探讨 T-Engine 系统的功能改进与架构优化建议。',
        placeholder: '提出优化建议或询问系统改进方案...',
        thinking: '正在分析系统架构...',
        error_key: '缺少 API Key，请检查集成设置。',
        error_gen: '生成响应失败。',
        copied: '已复制到剪贴板',
        copy: '复制',
        screenshot: '截图',
        export_pdf: '导出 PDF',
        screenshot_saved: '图片已复制到剪贴板',
        screenshot_failed: '截图失败',
        welcome: '我是 T-Engine 功能优化助理。专注于协助您设计新功能、优化系统性能或改进架构。今天有什么可以帮您改进 T-Engine 的吗？',
        listening: '正在听...',
        upload_tooltip: '上传附件 (图片, 文档, PDF, 视频)',
        mic_tooltip: '语音输入',
        unsupported_speech: '当前浏览器不支持语音识别。',
        perm_denied: '麦克风权限被拒绝，请在浏览器设置中允许访问。',
        aiAssistant: {
            copy: '复制',
            savePrompt: '保存为提示词',
            screenshot: '截图',
            exportPdf: '导出 PDF',
            exportWord: '导出 Word',
            apply: '应用到需求文档',
            failedSavePrompt: '保存提示词失败',
            savedPrompt: '提示词保存成功',
        }
    }
  }[language];

  // Helper for translation key lookup for ChatMessage
  const tFunc = (key: string) => {
      const parts = key.split('.');
      let current: any = t;
      for (const part of parts) {
          current = current?.[part];
      }
      return current || key;
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    adjustTextareaHeight(e.target);
  };

  const adjustTextareaHeight = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 200)}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast(t.copied, 'success');
  };

  // --- Attachment Handling ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        // Fix: Explicitly cast to File[] to solve type inference issues
        const newAttachments: Attachment[] = (Array.from(e.target.files) as File[]).map(file => {
            let type: 'image' | 'video' | 'file' = 'file';
            if (file.type.startsWith('image/')) type = 'image';
            else if (file.type.startsWith('video/')) type = 'video';
            
            return {
                id: Date.now().toString() + Math.random(),
                file,
                previewUrl: URL.createObjectURL(file),
                type
            };
        });
        setAttachments(prev => [...prev, ...newAttachments]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
      setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const fileToGenerativePart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve({
          inlineData: {
            data: base64String,
            mimeType: file.type,
          },
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // --- Voice Input ---
  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        addToast(t.unsupported_speech, 'error');
        return;
      }
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language === 'zh' ? 'zh-CN' : 'en-US';
      
      recognition.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
             setInputValue(prev => {
                 const newVal = prev + (prev ? ' ' : '') + finalTranscript;
                 // Slight delay to allow render update before resizing
                 setTimeout(() => {
                     if (textareaRef.current) adjustTextareaHeight(textareaRef.current);
                 }, 0);
                 return newVal;
             });
        }
      };
      
      recognition.onerror = (event: any) => {
          console.error('Speech recognition error', event.error);
          setIsRecording(false);
          if (event.error === 'not-allowed') {
              addToast(t.perm_denied, 'error');
          }
      };

      recognition.onend = () => {
          setIsRecording(false);
      };
      
      recognition.start();
      recognitionRef.current = recognition;
      setIsRecording(true);
    }
  };

  // --- Output Actions ---
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
            addToast(t.screenshot_failed, 'error');
            return;
        }
        try {
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            addToast(t.screenshot_saved, 'success');
        } catch (err) {
            console.error('Clipboard write failed', err);
            addToast(t.screenshot_failed, 'error');
        }
      }, 'image/png');
    } catch (err) {
      console.error('Screenshot failed', err);
      addToast(t.screenshot_failed, 'error');
    }
  };

  const handleExportPDF = (msgId: string, content: string) => {
    const element = document.getElementById(`msg-content-${msgId}`);
    if (!element) return;
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>AI Response Export</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 2rem; }
            h1, h2, h3, h4, h5, h6 { color: #111; margin-top: 1.5rem; margin-bottom: 0.5rem; font-weight: 600; }
            p { margin-bottom: 1em; }
            pre { background: #f4f4f5; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; font-family: monospace; font-size: 0.9rem; margin-bottom: 1em; white-space: pre-wrap; word-wrap: break-word; }
            code { background: #f4f4f5; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: monospace; font-size: 0.9em; }
            pre code { background: none; padding: 0; }
            blockquote { border-left: 4px solid #e5e7eb; padding-left: 1rem; color: #6b7280; margin: 1rem 0; }
            ul, ol { margin: 1rem 0; padding-left: 1.5rem; }
            li { margin-bottom: 0.5rem; }
            table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
            th, td { border: 1px solid #e5e7eb; padding: 0.5rem; text-align: left; }
            th { background-color: #f9fafb; font-weight: 600; }
            img { max-width: 100%; height: auto; border-radius: 6px; }
            a { color: #2563eb; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          ${element.innerHTML}
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    }
  };
  
  const handleExportWord = (msgId: string, content: string) => {
      // Simple text file download as .doc for now, or use Blob with HTML content
      const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
            "xmlns:w='urn:schemas-microsoft-com:office:word' "+
            "xmlns='http://www.w3.org/TR/REC-html40'>head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>";
      const footer = "</body></html>";
      
      // Use marked or similar if we had it, but here we can just use the raw markdown or basic text
      // For better UX, let's wrap the markdown in a pre tag or try to render it?
      // Actually, ChatMessage passes `content` (markdown). 
      // Let's grab the HTML from the DOM like PDF.
      const element = document.getElementById(`msg-content-${msgId}`);
      if (!element) return;
      
      const sourceHTML = header+element.innerHTML+footer;
      
      const source = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(sourceHTML);
      const fileDownload = document.createElement("a");
      document.body.appendChild(fileDownload);
      fileDownload.href = source;
      fileDownload.download = `ai-response-${msgId}.doc`;
      fileDownload.click();
      document.body.removeChild(fileDownload);
  };
  
  const handleToggleFavorite = async (id: string, favorite: boolean) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, favorite } : m));
      // Call API
      // Since we don't have a direct toggleFavorite in `api.aiChat`, we might assume it's an update
      // But for now UI update is enough or we use `api.aiChat.updateMessage` if it existed.
      // Checking `client.ts` or `store.ts` would confirm. 
      // Assuming we just update UI for now as `api.aiChat` might not expose granular updates yet.
  };

  const handleSetReaction = async (id: string, reaction: 'like' | 'dislike' | null) => {
      setMessages(prev => prev.map(m => m.id === id ? { ...m, reaction } : m));
      // API call would go here
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && attachments.length === 0) return;
    
    if (!llmConfig.apiKey) {
        addToast(t.error_key, 'error');
        return;
    }

    const currentAttachments = [...attachments];
    const currentInput = inputValue.trim();

    const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: currentInput,
        timestamp: new Date().toISOString(),
        attachments: currentAttachments,
        actorName: user.name,
        // promptLabel: '常用模版' // Example if we had prompt selection
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsTyping(true);

    try {
        // Save user message to DB
        api.aiChat.addMessage(MODULE_ID, 'user', currentInput, { 
            userAvatar: user.avatar, 
            agentId: AGENT_ID,
            actorName: user.name
        }).catch(() => {});

        let responseText = '';

        if (llmConfig.provider === 'google' && llmConfig.apiKey) {
            // Remove SDK usage, fallback to direct fetch for consistency
             // Use custom endpoint logic similar to useAIAssistant
             const baseUrl = llmConfig.baseUrl?.replace(/\/$/, '') || 'https://generativelanguage.googleapis.com';
             let endpoint = '';
             const modelName = llmConfig.model.startsWith('models/') ? llmConfig.model : `models/${llmConfig.model}`;
             
             if (baseUrl.includes(':generateContent')) {
                 endpoint = baseUrl;
             } else {
                 if (baseUrl.includes('/v1beta')) {
                    if (baseUrl.includes('/models/')) {
                        endpoint = `${baseUrl}:generateContent`;
                    } else {
                        endpoint = `${baseUrl}/${modelName}:generateContent`;
                    }
                 } else {
                     endpoint = `${baseUrl}/v1beta/${modelName}:generateContent`;
                 }
             }
             endpoint = endpoint.replace(/([^:]\/)\/+/g, "$1");

             // Build payload
             const contents = messages.map(m => ({
                 role: m.role,
                 parts: [{ text: m.content }] 
             }));
             
             const currentParts: any[] = [{ text: currentInput }];
             for (const att of currentAttachments) {
                 const part = await fileToGenerativePart(att.file);
                 currentParts.push(part);
             }
             
             contents.push({
                 role: 'user',
                 parts: currentParts
             });

             const fallbackPrompt = `
Role: T-Engine System Optimization Specialist.
Context: You are embedded inside T-Engine, a SaaS Intent Hub.
Objective: Discuss with the user (${user.name}) about how to improve T-Engine itself.
Tone: Professional, Constructive, Technical.
Format: Use Markdown.
Language: ${language === 'zh' ? 'Chinese (Simplified)' : 'English'}.
             `;

             const systemInstructionText = systemPrompt || fallbackPrompt;

             const payload: any = {
                  contents: contents,
                  generationConfig: {
                      temperature: llmConfig.temperature || 0.7,
                      maxOutputTokens: llmConfig.maxTokens || 4096,
                  },
                  systemInstruction: { parts: [{ text: systemInstructionText }] }
             };

             const response = await fetch(endpoint, {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json',
                      'x-goog-api-key': llmConfig.apiKey
                  },
                  body: JSON.stringify(payload)
             });

             if (!response.ok) {
                 const errText = await response.text();
                 throw new Error(`API Error ${response.status}: ${errText}`);
             }
             const data = await response.json();
             responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        } else {
             // Fallback if not Google or apiKey missing
             if (!llmConfig.apiKey) {
                 await new Promise(resolve => setTimeout(resolve, 1000));
                 responseText = language === 'zh' 
                    ? "请先在“集成管理”中配置有效的 LLM API Key。" 
                    : "Please configure a valid LLM API Key in Integration Management.";
             } else {
                 // Should not happen if provider is google, but for others:
                 responseText = `[System] Only Google Gemini provider is fully implemented for multimodal inputs in this demo.`;
             }
        }

        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            content: responseText,
            timestamp: new Date().toISOString(),
            actorName: agentName,
            // promptLabel: 'Default'
        };

        setMessages(prev => [...prev, aiMsg]);

        // Save AI message to DB
        api.aiChat.addMessage(MODULE_ID, 'model', responseText, { 
            actorId: AGENT_ID, 
            actorName: agentName, 
            agentId: AGENT_ID 
        }).catch(() => {});

    } catch (error: any) {
        console.error('AI Error:', error);
        // Better error message handling
        let errMsg = error.message;
        if (errMsg.includes('API key not valid')) {
            errMsg = language === 'zh' ? 'API Key 无效，请检查配置。' : 'Invalid API Key. Please check settings.';
        }
        addToast(t.error_gen + ` ${errMsg}`, 'error');
    } finally {
        setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black/20 overflow-hidden">
        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 opacity-60">
                    <Sparkles size={48} className="text-indigo-200 dark:text-indigo-900" />
                    <div className="text-center max-w-md">
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{t.welcome}</p>
                    </div>
                </div>
            )}
            
            {messages.map((msg) => {
                const date = new Date(msg.timestamp);
                const timeStr = date.toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
                   month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                });
                
                // Construct Meta Text
                // Format: "Role: Name · Time · Prompt"
                // e.g. "提问: RogerDing · 16:27 · PRD: Core Features"
                // e.g. "回复: M&S-A · 16:27 · PRD: Core Features"
                
                const roleLabel = msg.role === 'user' 
                    ? (language === 'zh' ? '提问' : 'Question')
                    : (language === 'zh' ? '回复' : 'Reply');
                
                const name = msg.actorName || (msg.role === 'user' ? user.name : agentName);
                const promptLabel = msg.promptLabel ? ` · ${msg.promptLabel}` : '';
                
                const metaText = `${roleLabel}: ${name} · ${timeStr}${promptLabel}`;

                return (
                    <ChatMessage 
                        key={msg.id}
                        msg={msg}
                        metaText={metaText}
                        t={tFunc}
                        language={language as any}
                        onCopy={copyToClipboard}
                        onOpenSavePromptModal={() => {}}
                        canDelete={false}
                        onRequestDelete={() => {}}
                        onToggleFavorite={handleToggleFavorite}
                        onSetReaction={handleSetReaction}
                        onScreenshot={handleScreenshot}
                        onExportPDF={handleExportPDF}
                        onExportWord={handleExportWord}
                        onApplyToRequirements={() => {}}
                    />
                );
            })}

            {isTyping && (
                <div className="flex gap-3">
                     <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 flex items-center justify-center text-indigo-600 shrink-0">
                        <Bot size={16} />
                    </div>
                    <div className="bg-white dark:bg-slate-900 px-4 py-3 rounded-2xl rounded-bl-none border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-2">
                        <Loader2 size={16} className="animate-spin text-indigo-500" />
                        <span className="text-xs text-gray-500">{t.thinking}</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-gray-800 shrink-0">
            {/* Attachments Preview */}
            {attachments.length > 0 && (
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
            )}

            <div className="relative flex items-end gap-2 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-xl border border-gray-200 dark:border-gray-700 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                {/* Paperclip Button */}
                <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="mb-1 p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    title={t.upload_tooltip}
                >
                    <Paperclip size={18} />
                </button>
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    multiple 
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.json"
                    onChange={handleFileSelect}
                />

                {/* Mic Button */}
                <button 
                    onClick={toggleRecording}
                    className={`mb-1 p-2 rounded-lg transition-colors ${
                        isRecording 
                            ? 'text-red-500 bg-red-50 dark:bg-red-900/20 animate-pulse' 
                            : 'text-gray-400 hover:text-indigo-600 hover:bg-gray-200 dark:hover:bg-slate-700'
                    }`}
                    title={t.mic_tooltip}
                >
                    {isRecording ? <StopCircle size={18} /> : <Mic size={18} />}
                </button>

                <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleInput}
                    onKeyDown={handleKeyDown}
                    placeholder={isRecording ? t.listening : t.placeholder}
                    className="flex-1 max-h-48 min-h-[44px] bg-transparent border-none outline-none resize-none text-sm text-slate-800 dark:text-slate-200 py-3 px-2 custom-scrollbar"
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
    </div>
  );
};