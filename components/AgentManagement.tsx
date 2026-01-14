
import React, { useState } from 'react';
import { Bot, Plus, Edit2, Trash2, CheckCircle, XCircle, BrainCircuit, Sparkles, MessageSquare, Settings, List, Save, RotateCcw, Clock, User } from 'lucide-react';
import { ConfirmDialog } from './common/ConfirmDialog';
import { useAgents, useSettings, useToast } from '../contexts';
import { AIAgent, PromptTemplate } from '../types';

export const AgentManagement: React.FC = () => {
  // ... (hooks kept same) ...
  const { agents, addAgent, updateAgent, deleteAgent, getPrompts, addPrompt, updatePrompt, deletePrompt } = useAgents();
  const { language } = useSettings();
  const { addToast } = useToast();

  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'prompts'>('config');

  // Form State
  const [formData, setFormData] = useState<Partial<AIAgent>>({
    name: '',
    role: '',
    avatar: '🤖',
    description: '',
    systemPrompt: '',
    pmInteractionExample: '',
    scope: [],
    commonPrompts: []
  });

  // Prompt Management State
  const [promptInput, setPromptInput] = useState({ label: '', content: '' });
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmPayload, setConfirmPayload] = useState<{ type: 'agent' | 'prompt'; id: string; name?: string } | null>(null);

  // Load prompts when opening modal
  React.useEffect(() => {
      if (showModal && editingAgent && activeTab === 'prompts') {
          getPrompts(editingAgent.id).then(prompts => {
              setFormData(prev => ({ ...prev, commonPrompts: prompts }));
          });
      }
  }, [showModal, editingAgent, activeTab]);

  const formatDate = (dateStr?: string) => {
      if (!dateStr) return '';
      return new Date(dateStr).toLocaleDateString(language === 'zh' ? 'zh-CN' : 'en-US', {
          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
  };

  const t = {
    // ... (previous t object kept same)
    en: {
        title: 'AI Agent Assistants',
        subtitle: 'Configure specialized AI agents for different system modules',
        add: 'New Agent',
        edit: 'Edit Agent',
        name: 'Agent Name',
        role: 'Role / Title',
        avatar: 'Avatar (Emoji)',
        desc: 'Description',
        prompt: 'System Prompt (Instruction)',
        example: 'PM Interaction Example',
        status: 'Status',
        save: 'Save Agent',
        cancel: 'Cancel',
        active: 'Active',
        inactive: 'Inactive',
        deleteConfirm: 'Are you sure you want to delete this agent?',
        promptPlace: 'e.g. You are an expert in...',
        examplePlace: 'e.g. PM: How to improve... Agent: You should...',
        descPlace: 'Briefly describe what this agent does...',
        tabs: {
            config: 'Configuration',
            prompts: 'Common Prompts'
        },
        prompts: {
            title: 'Manage Common Prompts',
            addTitle: 'Add / Edit Prompt',
            label: 'Label',
            content: 'Content',
            labelPh: 'e.g. Refine Requirements',
            contentPh: 'Prompt content...',
            addBtn: 'Add Prompt',
            updateBtn: 'Update Prompt',
            cancelEdit: 'Cancel Edit',
            empty: 'No common prompts defined yet.',
            audit: {
                created: 'Created',
                updated: 'Updated',
                usage: 'Uses'
            }
        }
    },
    zh: {
        title: 'AI Agent 产品助理',
        subtitle: '为不同系统模块配置专属 AI 智能体',
        add: '新建 Agent',
        edit: '编辑 Agent',
        name: '助理名称',
        role: '角色 / 头衔',
        avatar: '头像 (Emoji)',
        desc: '功能描述',
        prompt: '系统提示词 (System Prompt)',
        example: 'PM 互动示例 (Interaction Example)',
        status: '状态',
        save: '保存配置',
        cancel: '取消',
        active: '启用',
        inactive: '停用',
        deleteConfirm: '确定要删除该 AI 助理吗？',
        promptPlace: '例如：你是一个销售领域的专家...',
        examplePlace: '例如：PM: 如何提升转化率？ Agent: 建议优化...',
        descPlace: '简要描述该助理的职责...',
        tabs: {
            config: '基础配置',
            prompts: '常用提示词'
        },
        prompts: {
            title: '管理常用提示词',
            addTitle: '添加 / 编辑提示词',
            label: '标题',
            content: '内容',
            labelPh: '例如：优化需求描述',
            contentPh: '输入提示词内容...',
            addBtn: '添加提示词',
            updateBtn: '更新提示词',
            cancelEdit: '取消编辑',
            empty: '暂无常用提示词。',
            audit: {
                created: '创建于',
                updated: '更新于',
                usage: '使用次数'
            }
        }
    }
  }[language];

  // ... (handlers kept same) ...
  const handleOpenModal = (agent?: AIAgent) => {
      setActiveTab('config');
      setPromptInput({ label: '', content: '' });
      setEditingPromptId(null);

      if (agent) {
          setEditingAgent(agent);
          setFormData({
              ...agent,
              commonPrompts: agent.commonPrompts || []
          });
      } else {
          setEditingAgent(null);
          setFormData({
              name: '',
              role: '',
              avatar: '🤖',
              description: '',
              systemPrompt: '',
              pmInteractionExample: '',
              scope: [],
              status: 'active',
              commonPrompts: []
          });
      }
      setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!formData.name || !formData.systemPrompt) {
          addToast(language === 'zh' ? '请填写名称和提示词' : 'Name and Prompt are required', 'error');
          return;
      }

      try {
        if (editingAgent) {
            await updateAgent(editingAgent.id, formData);
            addToast(language === 'zh' ? '更新成功' : 'Agent updated', 'success');
        } else {
            await addAgent(formData as Omit<AIAgent, 'id' | 'status'>);
            addToast(language === 'zh' ? '创建成功' : 'Agent created', 'success');
        }
        setShowModal(false);
      } catch (e) {
        addToast(language === 'zh' ? '保存失败' : 'Failed to save', 'error');
      }
  };

  const handleDelete = async (id: string) => {
      const target = agents.find(a => a.id === id);
      setConfirmPayload({ type: 'agent', id, name: target?.name });
      setConfirmOpen(true);
  };

  const handleAddOrUpdatePrompt = async () => {
      if (!promptInput.label || !promptInput.content) {
          addToast(language === 'zh' ? '请填写标题和内容' : 'Label and content required', 'error');
          return;
      }

      if (!editingAgent) {
          setFormData(prev => {
            const currentPrompts = prev.commonPrompts || [];
            const newP: PromptTemplate = { id: Date.now().toString(), label: promptInput.label, content: promptInput.content };
            return { ...prev, commonPrompts: [...currentPrompts, newP] };
          });
          setPromptInput({ label: '', content: '' });
          return;
      }
      
      try {
        if (editingPromptId) {
            const p: PromptTemplate = { id: editingPromptId, label: promptInput.label, content: promptInput.content };
            await updatePrompt(editingAgent.id, p);
            
            // Refresh local list (optimistic update for fields we know, keeping audit fields if present)
            setFormData(prev => ({
                ...prev,
                commonPrompts: prev.commonPrompts?.map(item => item.id === editingPromptId ? { ...item, ...p, updatedAt: new Date().toISOString() } : item)
            }));
        } else {
            const newP: PromptTemplate = { id: '', label: promptInput.label, content: promptInput.content }; 
            await addPrompt(editingAgent.id, newP);
            const freshPrompts = await getPrompts(editingAgent.id);
            setFormData(prev => ({ ...prev, commonPrompts: freshPrompts }));
        }
        setPromptInput({ label: '', content: '' });
        setEditingPromptId(null);
      } catch (e) {
        addToast(language === 'zh' ? '保存提示词失败' : 'Failed to save prompt', 'error');
      }
  };

  const handleEditPrompt = (p: PromptTemplate) => {
      setPromptInput({ label: p.label, content: p.content });
      setEditingPromptId(p.id);
  };

  const handleDeletePrompt = async (id: string) => {
      if (!editingAgent) {
          setFormData(prev => ({
            ...prev,
            commonPrompts: prev.commonPrompts?.filter(p => p.id !== id)
          }));
          return;
      }
      const targetPrompt = formData.commonPrompts?.find(p => p.id === id);
      setConfirmPayload({ type: 'prompt', id, name: targetPrompt?.label });
      setConfirmOpen(true);
  };

  const handleCancelEditPrompt = () => {
      setEditingPromptId(null);
      setPromptInput({ label: '', content: '' });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6 animate-in fade-in duration-500">
        {/* ... (Header and Grid kept same) ... */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Bot className="text-indigo-600" />
                    {t.title}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t.subtitle}</p>
            </div>
            <button 
                onClick={() => handleOpenModal()}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/20 transition-all font-medium text-sm"
            >
                <Plus size={18} />
                {t.add}
            </button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map(agent => (
                <div key={agent.id} className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all group flex flex-col">
                    {/* ... (Card content same) ... */}
                    <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30 flex items-center justify-center text-2xl border border-indigo-50 dark:border-indigo-900/50">
                                {agent.avatar}
                            </div>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium border flex items-center gap-1 ${agent.status === 'active' ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900' : 'bg-gray-50 dark:bg-slate-800 text-gray-500 border-gray-200 dark:border-gray-700'}`}>
                                {agent.status === 'active' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                                {agent.status === 'active' ? t.active : t.inactive}
                            </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">{agent.name}</h3>
                        <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-2">{agent.role}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-4 h-10">{agent.description}</p>
                        
                        <div className="space-y-3">
                            <div className="bg-gray-50 dark:bg-black/20 rounded-lg p-3 border border-gray-100 dark:border-gray-800">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase mb-1">
                                    <Sparkles size={10} /> System Prompt
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 font-mono line-clamp-3 leading-relaxed opacity-80">
                                    {agent.systemPrompt}
                                </p>
                            </div>
                            
                            {agent.commonPrompts && agent.commonPrompts.length > 0 && (
                                <div className="flex gap-2 flex-wrap">
                                    {agent.commonPrompts.slice(0, 3).map(p => (
                                        <span key={p.id} className="text-[10px] px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded border border-indigo-100 dark:border-indigo-800/50 truncate max-w-[100px]">
                                            {p.label}
                                        </span>
                                    ))}
                                    {agent.commonPrompts.length > 3 && (
                                        <span className="text-[10px] px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-500 rounded border border-gray-100 dark:border-gray-700">
                                            +{agent.commonPrompts.length - 3}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/30 flex justify-between items-center rounded-b-xl">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                             <MessageSquare size={12} />
                             <span>@{agent.name}</span>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleOpenModal(agent)}
                                className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                            <button 
                                onClick={() => handleDelete(agent.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-white dark:hover:bg-slate-700 rounded transition-colors"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>

        {/* Modal */}
        {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                    {/* Modal Header */}
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-800/30 rounded-t-xl">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                            {editingAgent ? <Edit2 size={18} /> : <BrainCircuit size={18} />}
                            {editingAgent ? t.edit : t.add}
                        </h3>
                        <div className="flex bg-gray-200 dark:bg-slate-700 rounded-lg p-1 text-xs font-medium">
                            <button 
                                onClick={() => setActiveTab('config')}
                                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${activeTab === 'config' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                            >
                                <Settings size={14} />
                                {t.tabs.config}
                            </button>
                             <button 
                                onClick={() => setActiveTab('prompts')}
                                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${activeTab === 'prompts' ? 'bg-white dark:bg-slate-600 text-indigo-600 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                            >
                                <List size={14} />
                                {t.tabs.prompts}
                            </button>
                        </div>
                    </div>

                    {/* Modal Body */}
                    <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                        
                        {/* TAB 1: Config */}
                        {activeTab === 'config' && (
                            <div className="space-y-4">
                                {/* ... (Config fields same as before) ... */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="col-span-2 sm:col-span-1 space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.name} *</label>
                                        <input 
                                            autoFocus
                                            type="text" 
                                            value={formData.name || ''}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            placeholder="e.g. Sales Copilot"
                                        />
                                    </div>
                                    <div className="col-span-2 sm:col-span-1 space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.role}</label>
                                        <input 
                                            type="text" 
                                            value={formData.role || ''}
                                            onChange={e => setFormData({...formData, role: e.target.value})}
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                            placeholder="e.g. Senior Marketing Specialist"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-6 gap-4">
                                    <div className="col-span-1 space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.avatar}</label>
                                        <input 
                                            type="text" 
                                            maxLength={2}
                                            value={formData.avatar || ''}
                                            onChange={e => setFormData({...formData, avatar: e.target.value})}
                                            className="w-full px-3 py-2 text-center bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-lg"
                                        />
                                    </div>
                                    <div className="col-span-5 space-y-2">
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.desc}</label>
                                        <textarea 
                                            value={formData.description || ''}
                                            onChange={e => setFormData({...formData, description: e.target.value})}
                                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none h-[80px] custom-scrollbar"
                                            placeholder={t.descPlace}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <Sparkles size={14} className="text-amber-500" />
                                        {t.prompt} *
                                    </label>
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-slate-800">
                                        <textarea
                                            value={formData.systemPrompt || ''}
                                            onChange={e => setFormData({...formData, systemPrompt: e.target.value})}
                                            className="w-full p-3 bg-transparent outline-none text-sm font-mono text-slate-700 dark:text-slate-300 h-[160px] resize-none custom-scrollbar"
                                            placeholder={t.promptPlace}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <MessageSquare size={14} className="text-blue-500" />
                                        {t.example}
                                    </label>
                                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-slate-800">
                                        <textarea
                                            value={formData.pmInteractionExample || ''}
                                            onChange={e => setFormData({...formData, pmInteractionExample: e.target.value})}
                                            className="w-full p-3 bg-transparent outline-none text-sm font-mono text-slate-700 dark:text-slate-300 h-[100px] resize-none custom-scrollbar"
                                            placeholder={t.examplePlace}
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3 py-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.status}</label>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData({...formData, status: formData.status === 'active' ? 'inactive' : 'active'})}
                                        className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${formData.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}
                                    >
                                        {formData.status === 'active' ? t.active : t.inactive}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: Common Prompts */}
                        {activeTab === 'prompts' && (
                            <div className="flex flex-col h-full">
                                <div className="mb-4">
                                     <h4 className="font-semibold text-sm text-slate-800 dark:text-white mb-3">{t.prompts.title}</h4>
                                     
                                     {/* Prompt List */}
                                     <div className="space-y-3 mb-6">
                                        {formData.commonPrompts && formData.commonPrompts.length > 0 ? (
                                            formData.commonPrompts.map(p => (
                                                <div key={p.id} className="group p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors flex justify-between items-start gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-semibold text-sm text-slate-700 dark:text-slate-200 truncate">{p.label}</span>
                                                            {p.usageCount !== undefined && (
                                                                <span className="text-[10px] text-gray-400 flex items-center gap-0.5 bg-gray-50 dark:bg-slate-700/50 px-1.5 py-0.5 rounded">
                                                                    <BrainCircuit size={10} /> {p.usageCount}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 font-mono bg-gray-50 dark:bg-slate-900/50 p-1.5 rounded mb-2">
                                                            {p.content}
                                                        </p>
                                                        {/* Audit Info */}
                                                        <div className="flex items-center gap-3 text-[10px] text-gray-400">
                                                            {p.updatedAt && (
                                                                <span className="flex items-center gap-1">
                                                                    <Clock size={10} />
                                                                    {t.prompts.audit.updated} {formatDate(p.updatedAt)}
                                                                </span>
                                                            )}
                                                            {p.createdBy && (
                                                                <span className="flex items-center gap-1">
                                                                    <User size={10} />
                                                                    {p.createdBy === 'system' ? 'System' : p.createdBy}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => handleEditPrompt(p)}
                                                            className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDeletePrompt(p.id)}
                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-gray-400 text-sm border border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                                {t.prompts.empty}
                                            </div>
                                        )}
                                     </div>

                                     {/* Add/Edit Section */}
                                     <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
                                          <div className="flex justify-between items-center mb-3">
                                              <h5 className="text-xs font-bold text-gray-500 uppercase">{t.prompts.addTitle}</h5>
                                              {editingPromptId && (
                                                  <button onClick={handleCancelEditPrompt} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                                                      <RotateCcw size={10} /> {t.prompts.cancelEdit}
                                                  </button>
                                              )}
                                          </div>
                                          <div className="space-y-3">
                                              <div>
                                                  <input 
                                                      type="text" 
                                                      value={promptInput.label}
                                                      onChange={e => setPromptInput({...promptInput, label: e.target.value})}
                                                      placeholder={t.prompts.labelPh}
                                                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                                                  />
                                              </div>
                                              <div>
                                                  <textarea 
                                                      value={promptInput.content}
                                                      onChange={e => setPromptInput({...promptInput, content: e.target.value})}
                                                      placeholder={t.prompts.contentPh}
                                                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono h-20 resize-none custom-scrollbar"
                                                  />
                                              </div>
                                              <div className="flex justify-end">
                                                  <button 
                                                      type="button"
                                                      onClick={handleAddOrUpdatePrompt}
                                                      disabled={!promptInput.label || !promptInput.content}
                                                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                                  >
                                                      {editingPromptId ? <Save size={14} /> : <Plus size={14} />}
                                                      {editingPromptId ? t.prompts.updateBtn : t.prompts.addBtn}
                                                  </button>
                                              </div>
                                          </div>
                                     </div>
                                </div>
                            </div>
                        )}

                    </div>

                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl">
                        <button 
                            type="button" 
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        >
                            {t.cancel}
                        </button>
                        <button 
                            type="button" 
                            onClick={handleSave}
                            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md transition-colors"
                        >
                            {t.save}
                        </button>
                    </div>
                </div>
            </div>
        )}
        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmOpen}
          title={language === 'zh' ? '确认删除' : 'Confirm Deletion'}
          message={
            confirmPayload?.type === 'agent'
              ? (language === 'zh'
                  ? `确定要删除该 AI 助理${confirmPayload?.name ? `「${confirmPayload.name}」` : ''}吗？此操作不可恢复。`
                  : `Are you sure you want to delete this agent${confirmPayload?.name ? ` "${confirmPayload.name}"` : ''}? This cannot be undone.`)
              : (language === 'zh'
                  ? `确定要删除提示词${confirmPayload?.name ? `「${confirmPayload.name}」` : ''}吗？此操作不可恢复。`
                  : `Are you sure you want to delete the prompt${confirmPayload?.name ? ` "${confirmPayload.name}"` : ''}? This cannot be undone.`)
          }
          confirmText={language === 'zh' ? '删除' : 'Delete'}
          cancelText={language === 'zh' ? '取消' : 'Cancel'}
          destructive
          onCancel={() => { setConfirmOpen(false); setConfirmPayload(null); }}
          onConfirm={async () => {
            if (!confirmPayload) return;
            try {
              if (confirmPayload.type === 'agent') {
                await deleteAgent(confirmPayload.id);
                addToast(language === 'zh' ? '已删除' : 'Deleted', 'info');
              } else {
                if (editingAgent) {
                  await deletePrompt(editingAgent.id, confirmPayload.id);
                  setFormData(prev => ({
                    ...prev,
                    commonPrompts: prev.commonPrompts?.filter(p => p.id !== confirmPayload.id)
                  }));
                  if (editingPromptId === confirmPayload.id) {
                    setEditingPromptId(null);
                    setPromptInput({ label: '', content: '' });
                  }
                }
              }
            } catch (e) {
              addToast(language === 'zh' ? '删除失败' : 'Failed to delete', 'error');
            } finally {
              setConfirmOpen(false);
              setConfirmPayload(null);
            }
          }}
        />

    </div>
  );
};
