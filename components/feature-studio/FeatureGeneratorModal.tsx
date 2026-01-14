import React, { useState } from 'react';
import { X, Sparkles, CheckCircle, Loader2, ArrowRight, FileText, Server, ListTodo, Layout } from 'lucide-react';
import { useIntegration, useToast, useSettings } from '../../contexts';
import { AIService } from '../../services/ai';
import { WORKFLOW_PROMPTS } from '../../data/workflow_prompts';

interface FeatureGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete: (data: GeneratedData) => void;
}

export interface GeneratedData {
    prd: string;
    architecture: string;
    tasks: any[];
    uiBlueprint: any;
}

type StepStatus = 'pending' | 'loading' | 'success' | 'error';

export const FeatureGeneratorModal: React.FC<FeatureGeneratorModalProps> = ({ isOpen, onClose, onComplete }) => {
    const { llmConfig } = useIntegration();
    const { addToast } = useToast();
    const { language } = useSettings();
    const isZh = language === 'zh';

    const [featureName, setFeatureName] = useState('');
    const [description, setDescription] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    const labels = {
        title: isZh ? '自动架构师 Agent' : 'Auto-Architect Agent',
        subtitle: isZh ? '通过简单的描述生成完整的功能方案包。' : 'Generate a complete feature package from a simple description.',
        featureName: isZh ? '功能名称' : 'Feature Name',
        featureNamePlaceholder: isZh ? '例如：线索管理、支付网关' : 'e.g. Lead Management, Payment Gateway',
        description: isZh ? '描述 (可选)' : 'Description (Optional)',
        descriptionPlaceholder: isZh ? '描述关键能力...' : 'Describe the key capabilities...',
        steps: {
            prd: {
                title: isZh ? '生成 PRD' : 'Generating PRD',
                desc: isZh ? '需求文档、用户故事、验收标准' : 'Requirements, User Stories, Acceptance Criteria'
            },
            arch: {
                title: isZh ? '设计技术架构' : 'Designing Architecture',
                desc: isZh ? '数据模型、API 端点、技术栈' : 'Data Models, API Endpoints, Tech Stack'
            },
            tasks: {
                title: isZh ? '规划实施任务' : 'Planning Tasks',
                desc: isZh ? '实施步骤拆解' : 'Breakdown of implementation steps'
            },
            ui: {
                title: isZh ? '绘制 UI 蓝图' : 'Drafting UI',
                desc: isZh ? '布局结构与组件映射' : 'Layout structure and component mapping'
            }
        },
        buttons: {
            start: isZh ? '启动自动架构' : 'Start Auto-Architect',
            apply: isZh ? '应用到工作区' : 'Apply to Workspace'
        },
        errors: {
            enterName: isZh ? '请输入功能名称' : 'Please enter a feature name',
            apiKeyMissing: isZh ? '缺少 API Key，请检查集成设置。' : 'API Key missing. Check Integration Settings.',
            fail: isZh ? '生成失败: ' : 'Generation failed: '
        }
    };

    const [steps, setSteps] = useState<{
        prd: StepStatus;
        arch: StepStatus;
        tasks: StepStatus;
        ui: StepStatus;
    }>({
        prd: 'pending',
        arch: 'pending',
        tasks: 'pending',
        ui: 'pending'
    });

    const [results, setResults] = useState<GeneratedData>({
        prd: '',
        architecture: '',
        tasks: [],
        uiBlueprint: null
    });

    if (!isOpen) return null;

    const runGeneration = async () => {
        if (!featureName.trim()) {
            addToast(labels.errors.enterName, 'error');
            return;
        }
        if (!llmConfig.apiKey) {
            addToast(labels.errors.apiKeyMissing, 'error');
            return;
        }

        setIsGenerating(true);
        const ai = new AIService(llmConfig);
        const langContext = isZh ? "Please respond in Chinese (Simplified)." : "";

        try {
            // 1. Generate PRD
            setSteps(s => ({ ...s, prd: 'loading' }));
            const prdPrompt = WORKFLOW_PROMPTS.PRD.replace('{featureName}', featureName).replace('{description}', description);
            const prd = await ai.generateContent(`You are a helpful product expert. ${langContext}`, prdPrompt);
            setResults(prev => ({ ...prev, prd }));
            setSteps(s => ({ ...s, prd: 'success' }));

            // 2. Generate Architecture
            setSteps(s => ({ ...s, arch: 'loading' }));
            const archPrompt = WORKFLOW_PROMPTS.ARCH.replace('{featureName}', featureName);
            const arch = await ai.generateContent(`You are a system architect. ${langContext}`, `Context: ${prd.substring(0, 1000)}...\n\n${archPrompt}`);
            setResults(prev => ({ ...prev, architecture: arch }));
            setSteps(s => ({ ...s, arch: 'success' }));

            // 3. Generate Tasks
            setSteps(s => ({ ...s, tasks: 'loading' }));
            const tasksPrompt = WORKFLOW_PROMPTS.TASKS.replace('{featureName}', featureName);
            // Context: PRD (Goals/Stories) + Architecture (Data/API)
            const tasksContext = `Context from PRD:\n${prd.substring(0, 800)}...\n\nContext from Architecture:\n${results.architecture ? results.architecture.substring(0, 800) : arch.substring(0, 800)}...\n\n`;
            const tasksRaw = await ai.generateContent(`You are a project manager. Return pure JSON. ${langContext}`, tasksContext + tasksPrompt);
            try {
                const jsonStr = tasksRaw.replace(/```json/g, '').replace(/```/g, '').trim();
                const tasks = JSON.parse(jsonStr);
                setResults(prev => ({ ...prev, tasks }));
                setSteps(s => ({ ...s, tasks: 'success' }));
            } catch (e) {
                console.error("JSON Parse Error (Tasks)", e);
                setSteps(s => ({ ...s, tasks: 'error' }));
            }

            // 4. Generate UI
            setSteps(s => ({ ...s, ui: 'loading' }));
            const uiPrompt = WORKFLOW_PROMPTS.UI.replace('{featureName}', featureName);
            // Context: PRD (User Stories) + Architecture (Data Model fields)
            const uiContext = `Context from PRD:\n${prd.substring(0, 800)}...\n\nContext from Architecture:\n${results.architecture ? results.architecture.substring(0, 800) : arch.substring(0, 800)}...\n\n`;
            const uiRaw = await ai.generateContent(`You are a UI designer. Return pure JSON. ${langContext}`, uiContext + uiPrompt);
            try {
                const jsonStr = uiRaw.replace(/```json/g, '').replace(/```/g, '').trim();
                const ui = JSON.parse(jsonStr);
                setResults(prev => ({ ...prev, uiBlueprint: ui }));
                setSteps(s => ({ ...s, ui: 'success' }));
            } catch (e) {
                 console.error("JSON Parse Error (UI)", e);
                 setSteps(s => ({ ...s, ui: 'error' }));
            }

            setIsGenerating(false);
            
        } catch (error: any) {
            console.error(error);
            addToast(`${labels.errors.fail}${error.message}`, 'error');
            setIsGenerating(false);
        }
    };

    const handleApply = () => {
        onComplete(results);
        onClose();
    };

    const StepIcon = ({ status }: { status: StepStatus }) => {
        switch (status) {
            case 'pending': return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
            case 'loading': return <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />;
            case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
            case 'error': return <X className="w-5 h-5 text-red-500" />;
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="text-indigo-500" />
                            {labels.title}
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{labels.subtitle}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full text-gray-400">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto space-y-6">
                    {!isGenerating && steps.prd === 'pending' ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{labels.featureName}</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder={labels.featureNamePlaceholder}
                                    value={featureName}
                                    onChange={e => setFeatureName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{labels.description}</label>
                                <textarea 
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-indigo-500 min-h-[100px]"
                                    placeholder={labels.descriptionPlaceholder}
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                <StepIcon status={steps.prd} />
                                <div className="flex-1">
                                    <h4 className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        <FileText size={16} /> {labels.steps.prd.title}
                                    </h4>
                                    <p className="text-xs text-gray-500">{labels.steps.prd.desc}</p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                <StepIcon status={steps.arch} />
                                <div className="flex-1">
                                    <h4 className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        <Server size={16} /> {labels.steps.arch.title}
                                    </h4>
                                    <p className="text-xs text-gray-500">{labels.steps.arch.desc}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                <StepIcon status={steps.tasks} />
                                <div className="flex-1">
                                    <h4 className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        <ListTodo size={16} /> {labels.steps.tasks.title}
                                    </h4>
                                    <p className="text-xs text-gray-500">{labels.steps.tasks.desc}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                <StepIcon status={steps.ui} />
                                <div className="flex-1">
                                    <h4 className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-2">
                                        <Layout size={16} /> {labels.steps.ui.title}
                                    </h4>
                                    <p className="text-xs text-gray-500">{labels.steps.ui.desc}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                    {steps.ui === 'success' ? (
                        <button 
                            onClick={handleApply}
                            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                        >
                            <CheckCircle size={18} /> {labels.buttons.apply}
                        </button>
                    ) : (
                        !isGenerating && (
                            <button 
                                onClick={runGeneration}
                                disabled={!featureName.trim()}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Sparkles size={18} /> {labels.buttons.start}
                                <ArrowRight size={16} />
                            </button>
                        )
                    )}
                </div>
            </div>
        </div>
    );
};
