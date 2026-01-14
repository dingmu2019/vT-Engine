import { useState, useRef, useEffect } from 'react';
import { useIntegration, useSettings, useToast, useAgents, useAuth, useNavigation } from '../contexts';
import { PromptTemplate } from '../types';
import { useTranslation } from './useTranslation';
import { api } from '../client';

export interface Attachment {
  id: string;
  file: File;
  previewUrl: string;
  type: 'image' | 'video' | 'file';
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  actorId?: string;
  actorName?: string;
  actorAvatar?: string;
  agentId?: string;
  promptLabel?: string | null;
  favorite?: boolean;
  reaction?: 'like' | 'dislike' | null;
  attachments?: Attachment[];
}

export const useAIAssistant = (moduleId: string, moduleName: string) => {
  const { llmConfig } = useIntegration();
  const { t } = useTranslation();
  const { addToast } = useToast();
  const { agents, getPrompts, addPrompt } = useAgents();
  const { user } = useAuth();
  const { globalStandards } = useNavigation();

  // Chat State
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Attachments State
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  // Agent Selection State
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [showAgentMenu, setShowAgentMenu] = useState(false);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  
  // Prompt Selector State
  const [showPromptSelector, setShowPromptSelector] = useState(false);
  const [promptSearchQuery, setPromptSearchQuery] = useState('');
  const [agentPrompts, setAgentPrompts] = useState<PromptTemplate[]>([]);

  // Optimization State
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizedText, setOptimizedText] = useState<string | null>(null);
  const [selectedPromptLabel, setSelectedPromptLabel] = useState<string | null>(null);

  // Save Prompt State
  const [showSavePromptModal, setShowSavePromptModal] = useState(false);
  const [promptToSave, setPromptToSave] = useState({ label: '', content: '' });

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  // Auto-select agent
  const lastModuleIdRef = useRef<string>('');

  useEffect(() => {
    if (moduleId !== lastModuleIdRef.current && agents.length > 0) {
        lastModuleIdRef.current = moduleId;
        const match = agents.find(a => 
            Array.isArray(a.scope) && a.scope.some(s => (moduleId && moduleId.includes(s)) || s === 'all')
        );
        if (match) {
            setSelectedAgentId(match.id);
        } else {
            setSelectedAgentId(agents[0].id);
        }
    } else if (agents.length > 0 && !selectedAgentId) {
         setSelectedAgentId(agents[0].id);
    }
  }, [moduleId, agents, selectedAgentId]);

  const activeAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  useEffect(() => {
    const lastId = messages[messages.length - 1]?.id || null;
    if (!lastId) {
      lastMessageIdRef.current = null;
      return;
    }
    if (lastMessageIdRef.current !== lastId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    lastMessageIdRef.current = lastId;
  }, [messages, isTyping, attachments]);

  useEffect(() => {
    const fetchAgentPrompts = async () => {
      if (!selectedAgentId) return;
      try {
        const list = await getPrompts(selectedAgentId);
        setAgentPrompts(list || []);
      } catch (e) {
        // keep empty
      }
    };
    fetchAgentPrompts();
  }, [selectedAgentId]);

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

  const callLLM = async (prompt: string, historyMessages: Message[] = [], currentAttachments: Attachment[] = [], isOptimization = false) => {
      if (!llmConfig.apiKey) {
          throw new Error(t('aiAssistant.errorKey'));
      }

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

      let contents: any[] = [];

      if (!isOptimization) {
          contents = historyMessages.map(m => ({
              role: m.role,
              parts: [{ text: m.content }] 
          }));
      }

      const currentParts: any[] = [{ text: prompt }];
      for (const att of currentAttachments) {
          const part = await fileToGenerativePart(att.file);
          currentParts.push(part);
      }
      
      contents.push({
          role: 'user',
          parts: currentParts
      });

      const payload: any = {
           contents: contents,
           generationConfig: {
               temperature: llmConfig.temperature || 0.7,
               maxOutputTokens: llmConfig.maxTokens || 4096,
           }
      };
      
      if (!isOptimization && activeAgent?.systemPrompt) {
            const fullSystemInstruction = `
${activeAgent.systemPrompt}

GLOBAL STANDARDS:
${globalStandards || 'No specific standards.'}

CURRENT CONTEXT:
Module: ${moduleName} (ID: ${moduleId})
User: ${user?.name || 'User'}

INSTRUCTIONS:
- Provide concise, professional, and structured responses.
- Use Markdown for formatting.
            `;
            payload.systemInstruction = { parts: [{ text: fullSystemInstruction }] };
      }

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
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  };

  const handleOptimize = async () => {
      if (!inputValue.trim() || !llmConfig.apiKey) return;
      setIsOptimizing(true);
      try {
          const prompt = `Please optimize the following user question/instruction to be more clear, precise, and suitable for an AI assistant. Output ONLY the optimized text without explanations.\n\nInput: ${inputValue}`;
          const result = await callLLM(prompt, [], [], true);
          setOptimizedText(result.trim());
      } catch (e: any) {
          console.error(e);
          addToast(t('aiAssistant.errorGen'), 'error');
      } finally {
          setIsOptimizing(false);
      }
  };

  const handleSendMessage = async () => {
    if ((!inputValue.trim() && attachments.length === 0) || !activeAgent) return;
    
    if (!llmConfig.apiKey) {
        addToast(t('aiAssistant.errorKey'), 'error');
        return;
    }

    const currentAttachments = [...attachments];
    const currentInput = inputValue.trim();

    const userMsg: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: currentInput,
        timestamp: new Date().toISOString(),
        actorId: user?.id || '',
        actorName: user?.name || 'User',
        actorAvatar: user?.avatar || '',
        agentId: activeAgent.id,
        promptLabel: selectedPromptLabel,
        attachments: currentAttachments
    };

    const nextHistory = [...messages, userMsg];
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setAttachments([]);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsTyping(true);

    try {
        const promptLabel = selectedPromptLabel || undefined;
        api.aiChat.addMessage(moduleId, 'user', currentInput, { userAvatar: user.avatar, agentId: activeAgent.id, promptLabel }).catch(() => {});
        const responseText = await callLLM(currentInput, nextHistory, currentAttachments);
        const aiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            content: responseText,
            timestamp: new Date().toISOString(),
            actorId: activeAgent.id,
            actorName: activeAgent.name,
            actorAvatar: activeAgent.avatar,
            agentId: activeAgent.id,
            promptLabel,
            favorite: false,
            reaction: null
        };
        setMessages(prev => [...prev, aiMsg]);
        api.aiChat.addMessage(moduleId, 'model', responseText, { actorId: activeAgent.id, actorName: activeAgent.name, actorAvatar: activeAgent.avatar, agentId: activeAgent.id, promptLabel }).catch(() => {});
        setSelectedPromptLabel(null);
    } catch (error: any) {
        console.error('AI Error:', error);
        addToast(t('aiAssistant.errorGen') + ` ${error.message}`, 'error');
    } finally {
        setIsTyping(false);
    }
  };

  const handleSavePrompt = async () => {
      if (!activeAgent || !promptToSave.label) return;
      try {
          await addPrompt(activeAgent.id, { 
              id: '', 
              label: promptToSave.label, 
              content: promptToSave.content 
          });
          const list = await getPrompts(activeAgent.id);
          setAgentPrompts(list || []);
          addToast(t('aiAssistant.savedPrompt'), 'success');
          setShowSavePromptModal(false);
      } catch (e) {
          addToast(t('aiAssistant.failedSavePrompt'), 'error');
      }
  };

  const processFiles = (files: File[]) => {
    const validFiles: Attachment[] = [];
    files.forEach(file => {
        if (file.size > 30 * 1024 * 1024) {
            addToast(`${file.name}: ${t('aiAssistant.sizeError')}`, 'error');
            return;
        }
        let type: 'image' | 'video' | 'file' = 'file';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type.startsWith('video/')) type = 'video';

        validFiles.push({
            id: Date.now().toString() + Math.random(),
            file,
            previewUrl: URL.createObjectURL(file),
            type
        });
    });
    setAttachments(prev => [...prev, ...validFiles]);
  };

  return {
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

    // Actions
    handleOptimize,
    handleSendMessage,
    handleSavePrompt,
    processFiles,
    t // Export translation function for component use
  };
};
