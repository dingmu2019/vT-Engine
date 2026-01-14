
import React, { useState, useEffect, useRef } from 'react';
import { X, Smartphone, Monitor, RefreshCw, Loader2, Code } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import { useIntegration, useSettings, useToast } from '../../contexts';

interface MockupGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  requirements: string;
  contextName: string;
}

export const MockupGenerator: React.FC<MockupGeneratorProps> = ({ isOpen, onClose, requirements, contextName }) => {
  const { llmConfig } = useIntegration();
  const { language } = useSettings();
  const { addToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [showCode, setShowCode] = useState(false);

  const t = {
    en: {
      title: 'AI UI Mockup Generator',
      subtitle: `Visualizing requirements for: ${contextName}`,
      desktop: 'Desktop',
      mobile: 'Mobile',
      regenerate: 'Regenerate',
      generating: 'Designing UI...',
      code: 'View Code',
      preview: 'Preview',
      error: 'Generation failed'
    },
    zh: {
      title: 'AI 界面效果图生成器',
      subtitle: `正在可视化需求: ${contextName}`,
      desktop: 'PC 端',
      mobile: '移动端',
      regenerate: '重新生成',
      generating: '正在设计 UI...',
      code: '查看源码',
      preview: '预览视图',
      error: '生成失败'
    }
  }[language];

  useEffect(() => {
    if (isOpen && !generatedHtml && requirements) {
      generateMockup();
    }
  }, [isOpen, requirements]);

  const generateMockup = async () => {
    if (!llmConfig.apiKey) {
      addToast(language === 'zh' ? '请配置 API Key' : 'API Key required', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: llmConfig.apiKey });
      
      const systemPrompt = `You are a Senior UI/UX Designer and Frontend Engineer. 
      Your task is to generate a high-fidelity, modern, responsive HTML prototype based on the provided software requirements.
      
      Rules:
      1. Use Tailwind CSS via CDN for styling.
      2. Use FontAwesome via CDN for icons.
      3. The design must be professional, clean, and suitable for a B2B SaaS application.
      4. Return ONLY the raw HTML code starting with <!DOCTYPE html>.
      5. Do NOT wrap the code in markdown code blocks (no \`\`\`html).
      6. Ensure the layout is responsive (looks good on both mobile and desktop).
      7. Add dummy data to make the UI look realistic.`;

      const userPrompt = `Generate a UI mockup for the following requirements:\n\n${requirements}`;

      const response = await ai.models.generateContent({
        model: llmConfig.model,
        contents: [
            { role: 'user', parts: [{ text: systemPrompt + "\n\n" + userPrompt }] }
        ]
      });

      let html = response.text || '';
      // Cleanup markdown if present
      html = html.replace(/```html/g, '').replace(/```/g, '').trim();
      
      setGeneratedHtml(html);
    } catch (error) {
      console.error(error);
      addToast(t.error, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-slate-800/50">
          <div className="flex flex-col">
             <h3 className="font-bold text-slate-800 dark:text-white text-lg">{t.title}</h3>
             <p className="text-xs text-gray-500">{t.subtitle}</p>
          </div>
          
          <div className="flex items-center gap-4">
             {/* View Toggles */}
             <div className="flex bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700 p-1">
                <button 
                  onClick={() => setViewMode('desktop')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'desktop' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700'}`}
                >
                   <Monitor size={14} /> {t.desktop}
                </button>
                <button 
                  onClick={() => setViewMode('mobile')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'mobile' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700'}`}
                >
                   <Smartphone size={14} /> {t.mobile}
                </button>
             </div>

             <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>

             <button 
                onClick={() => setShowCode(!showCode)}
                className={`p-2 rounded-lg transition-colors ${showCode ? 'bg-indigo-100 text-indigo-600' : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-slate-700'}`}
                title={t.code}
             >
                <Code size={18} />
             </button>

             <button 
                onClick={generateMockup}
                disabled={isLoading}
                className="flex items-center gap-2 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
             >
                <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
                {isLoading ? t.generating : t.regenerate}
             </button>

             <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 ml-2">
                <X size={20} />
             </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-slate-100 dark:bg-black/40 overflow-hidden relative flex items-center justify-center p-8">
            
            {/* Loading State */}
            {isLoading && (
               <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm">
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-xl flex flex-col items-center">
                     <Loader2 size={32} className="text-indigo-600 animate-spin mb-3" />
                     <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{t.generating}</p>
                  </div>
               </div>
            )}

            {showCode ? (
                <div className="w-full h-full bg-slate-900 rounded-xl overflow-hidden border border-slate-700 shadow-xl">
                    <pre className="w-full h-full p-6 overflow-auto text-xs font-mono text-green-400 custom-scrollbar">
                        {generatedHtml}
                    </pre>
                </div>
            ) : (
                <div 
                    className={`transition-all duration-500 ease-in-out bg-white shadow-2xl overflow-hidden border-4 border-slate-800 dark:border-slate-700
                        ${viewMode === 'mobile' 
                            ? 'w-[375px] h-[667px] rounded-[30px]' 
                            : 'w-full h-full rounded-lg'
                        }
                    `}
                >
                    <iframe 
                        title="UI Preview"
                        srcDoc={generatedHtml}
                        className="w-full h-full bg-white"
                        sandbox="allow-scripts"
                    />
                </div>
            )}
        </div>

      </div>
    </div>
  );
};
