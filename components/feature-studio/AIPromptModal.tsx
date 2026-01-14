
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Sparkles, X, Copy, Download, FileText, Printer, MonitorSmartphone } from 'lucide-react';
import { useSettings, useToast } from '../../contexts';
import { ModuleData } from '../../types';
import { MockupGenerator } from './MockupGenerator';

interface AIPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ModuleData;
  user: any;
  globalStandards: string;
}

export const AIPromptModal: React.FC<AIPromptModalProps> = ({ isOpen, onClose, data, user, globalStandards }) => {
  const { language } = useSettings();
  const { addToast } = useToast();
  const [bridgeView, setBridgeView] = useState<'preview' | 'raw'>('preview');
  const [showMockup, setShowMockup] = useState(false);

  if (!isOpen) return null;

  const generateAIPrompt = () => {
    return `# T-ENGINE CONTEXT PACKAGE: ${data.name}
> Generated at: ${new Date().toISOString()}
> Module ID: ${data.id}
> User: ${user.name}

## 0. GLOBAL STANDARDS (MUST COMPLY)
${globalStandards}

---

## 1. Requirements & User Stories
${data.requirements}

---

## 2. Business Logic Engine
| Status | Rule Name | Condition (IF) | Action (THEN) |
| :--- | :--- | :--- | :--- |
${data.logicRules.map(r => `| ${r.enabled ? 'ON' : 'OFF'} | ${r.name} | \`${r.condition}\` | \`${r.action}\` |`).join('\n')}

---

## 3. Knowledge Base & References
${data.knowledge.map(k => `- [${k.type.toUpperCase()}] ${k.title} (${k.status}): ${k.url}`).join('\n')}

---

## 4. UI Component Blueprint & Visuals
**Selected UI Components:**
${data.uiComponents.filter(u => u.checked).map(u => `- [x] ${u.name}`).join('\n')}

**Prototype Snapshots:**
${data.figmaLinks && data.figmaLinks.length > 0 ? data.figmaLinks.map(l => `- [Figma] ${l.title}: ${l.url}`).join('\n') : '> No Figma links attached.'}
${data.prototypeImages && data.prototypeImages.length > 0 ? data.prototypeImages.map(img => `- [Image] ${img.name}`).join('\n') : '> No prototype images attached.'}
    `;
  };

  const promptContent = generateAIPrompt();

  const t = (key: string) => {
    const dict: Record<string, { en: string; zh: string }> = {
      'close': { en: 'Close', zh: '关闭' },
      'copy': { en: 'Copy to Clipboard', zh: '复制到剪贴板' },
      'raw_mode': { en: 'Raw Text', zh: '源码模式' },
      'preview_mode': { en: 'Preview', zh: '预览模式' },
      'download_md': { en: 'Markdown', zh: 'Markdown' },
      'download_word': { en: 'Word (.doc)', zh: 'Word 文档' },
      'print_pdf': { en: 'Print / PDF', zh: '打印 / PDF' },
      'token_est': { en: 'Est. Tokens', zh: '预估 Token' },
      'chars': { en: 'Chars', zh: '字符数' },
      'view_ui': { en: 'View Mockup', zh: '查看效果图' }
    };
    return dict[key] ? dict[key][language] : key;
  };

  const copyToClipboard = () => {
      navigator.clipboard.writeText(promptContent);
      addToast(language === 'zh' ? "指令已复制到剪贴板！" : "Prompt copied to clipboard!", 'success');
      onClose();
  };

  const downloadContext = () => {
      const blob = new Blob([promptContent], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `T-Engine-Context-${data.name}-${Date.now()}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast(language === 'zh' ? '上下文文件已下载' : 'Context file downloaded', 'success');
  };

  const createExportHTML = () => {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>T-Engine Spec: ${data.name}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 900px; margin: 0 auto; padding: 40px; }
            h1 { border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; font-size: 24px; }
            h2 { color: #2563eb; margin-top: 30px; border-bottom: 1px solid #eee; padding-bottom: 5px; font-size: 18px; }
            h3 { font-size: 16px; margin-top: 20px; color: #4b5563; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 14px; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; vertical-align: top; }
            th { background-color: #f8f9fa; font-weight: bold; color: #333; }
            .meta { color: #666; font-size: 12px; margin-bottom: 40px; border: 1px solid #eee; padding: 15px; background: #f9fafb; border-radius: 4px; }
            .tag { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
            .tag-on { background: #dcfce7; color: #166534; }
            .tag-off { background: #f3f4f6; color: #374151; }
            pre { background: #f8f9fa; padding: 15px; border-radius: 5px; overflow-x: auto; white-space: pre-wrap; font-family: Consolas, monospace; font-size: 13px; border: 1px solid #eee; }
            code { font-family: Consolas, monospace; background: #f1f5f9; padding: 2px 4px; border-radius: 3px; font-size: 0.9em; }
            blockquote { border-left: 4px solid #ddd; padding-left: 15px; color: #555; margin: 15px 0; }
            ul { margin: 10px 0; padding-left: 20px; }
            li { margin-bottom: 5px; }
            a { color: #2563eb; text-decoration: none; }
            a:hover { text-decoration: underline; }
            .section-number { color: #9ca3af; margin-right: 8px; font-weight: normal; }
            @media print {
              body { padding: 0; max-width: 100%; }
              h2 { break-before: auto; page-break-inside: avoid; }
              pre { white-space: pre-wrap; word-wrap: break-word; }
            }
          </style>
        </head>
        <body>
          <h1>${data.name} <span style="font-weight:normal; font-size: 0.6em; color:#666; float:right;">T-Engine Spec</span></h1>
          
          <div class="meta">
            <div><strong>Module ID:</strong> ${data.id}</div>
            <div><strong>Generated By:</strong> ${user.name} (${user.email})</div>
            <div><strong>Generated At:</strong> ${new Date().toLocaleString()}</div>
            <div><strong>Version Tag:</strong> ${data.versions && data.versions.length > 0 ? data.versions[0].tag : 'Draft'}</div>
          </div>

          <h2><span class="section-number">0.</span>Global Architecture Standards</h2>
          <pre>${globalStandards}</pre>

          <h2><span class="section-number">1.</span>Requirements & User Stories</h2>
          <pre>${data.requirements}</pre>

          <h2><span class="section-number">2.</span>Business Logic Engine</h2>
          ${data.logicRules.length > 0 ? `
            <table>
              <thead>
                <tr>
                  <th width="10%">Status</th>
                  <th width="20%">Rule Name</th>
                  <th width="35%">Condition (IF)</th>
                  <th width="35%">Action (THEN)</th>
                </tr>
              </thead>
              <tbody>
                ${data.logicRules.map(r => `
                  <tr>
                    <td><span class="tag ${r.enabled ? 'tag-on' : 'tag-off'}">${r.enabled ? 'ON' : 'OFF'}</span></td>
                    <td><strong>${r.name}</strong></td>
                    <td><code>${r.condition}</code></td>
                    <td><code>${r.action}</code></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p>No logic rules defined.</p>'}

          <h2><span class="section-number">3.</span>Knowledge Base</h2>
          ${data.knowledge.length > 0 ? `
            <ul>
              ${data.knowledge.map(k => `
                <li>
                  <strong>[${k.type.toUpperCase()}]</strong> ${k.title} 
                  <br><small><a href="${k.url}">${k.url}</a></small>
                </li>
              `).join('')}
            </ul>
          ` : '<p>No references attached.</p>'}

          <h2><span class="section-number">4.</span>UI Blueprint</h2>
          <h3>Selected Components</h3>
          ${data.uiComponents.some(u => u.checked) ? `
            <ul>
               ${data.uiComponents.filter(u => u.checked).map(u => `<li>${u.name}</li>`).join('')}
            </ul>
          ` : '<p>No components selected.</p>'}

          <h3>Prototype Assets</h3>
          <ul>
             ${data.figmaLinks && data.figmaLinks.length > 0 ? data.figmaLinks.map(l => `<li>[Figma] <a href="${l.url}">${l.title}</a></li>`).join('') : ''}
             ${data.prototypeImages && data.prototypeImages.length > 0 ? data.prototypeImages.map(i => `<li>[Image] ${i.name}</li>`).join('') : ''}
             ${(!data.figmaLinks?.length && !data.prototypeImages?.length) ? '<li>No visual assets.</li>' : ''}
          </ul>
        </body>
      </html>
    `;
  };

  const handleExportWord = () => {
      const htmlContent = createExportHTML();
      const blob = new Blob([htmlContent], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `T-Engine-Spec-${data.name}-${Date.now()}.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast(language === 'zh' ? 'Word 文档已下载' : 'Word document downloaded', 'success');
  };

  const handlePrintPDF = () => {
      const htmlContent = createExportHTML();
      const printWindow = window.open('', '_blank');
      if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();
          printWindow.focus();
          setTimeout(() => {
              printWindow.print();
              printWindow.close();
          }, 250);
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between bg-gray-50 dark:bg-slate-800/50">
                <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                        <Sparkles size={18} className="text-amber-500"/>
                        {language === 'zh' ? 'AI 上下文桥接' : 'AI Context Bridge'}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                        {language === 'zh' ? '生成标准化的上下文 Prompt，供 ChatGPT / Claude / Gemini 使用。' : 'Generate standardized context prompts for ChatGPT / Claude / Gemini.'}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowMockup(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                    >
                        <MonitorSmartphone size={14} />
                        <span className="hidden sm:inline">{t('view_ui')}</span>
                    </button>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
                </div>
            </div>
            
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex items-center gap-2 px-6 py-2 border-b border-gray-100 dark:border-gray-800">
                        <button 
                        onClick={() => setBridgeView('preview')}
                        className={`text-xs px-3 py-1 rounded-full border transition-all ${bridgeView === 'preview' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800' : 'text-gray-500 border-transparent hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                        >
                        {t('preview_mode')}
                        </button>
                        <button 
                        onClick={() => setBridgeView('raw')}
                        className={`text-xs px-3 py-1 rounded-full border transition-all ${bridgeView === 'raw' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800' : 'text-gray-500 border-transparent hover:bg-gray-100 dark:hover:bg-slate-800'}`}
                        >
                        {t('raw_mode')}
                        </button>
                        <div className="flex-1"></div>
                        <div className="text-[10px] text-gray-400 font-mono">
                            {t('token_est')}: ~{(promptContent.length / 4).toFixed(0)} | {t('chars')}: {promptContent.length}
                        </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-black/20 custom-scrollbar">
                        {bridgeView === 'preview' ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none prose-th:text-slate-700 dark:prose-th:text-slate-200 prose-td:text-slate-600 dark:prose-td:text-slate-300">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>{promptContent}</ReactMarkdown>
                            </div>
                        ) : (
                            <pre className="font-mono text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{promptContent}</pre>
                        )}
                </div>
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex justify-between gap-3 bg-white dark:bg-slate-900 items-center">
                <div className="flex gap-2">
                    <button 
                        onClick={handleExportWord}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        title={language === 'zh' ? '导出为 Word' : 'Export to Word'}
                    >
                        <FileText size={14} />
                        <span className="hidden sm:inline">{t('download_word')}</span>
                    </button>
                    <button 
                        onClick={handlePrintPDF}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        title={language === 'zh' ? '打印或另存为 PDF' : 'Print or Save as PDF'}
                    >
                        <Printer size={14} />
                        <span className="hidden sm:inline">{t('print_pdf')}</span>
                    </button>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={downloadContext}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-xs hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                    >
                        <Download size={14} />
                        {t('download_md')}
                    </button>
                    <button 
                        onClick={copyToClipboard}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 shadow-md transition-colors"
                    >
                        <Copy size={14} />
                        {t('copy')}
                    </button>
                </div>
            </div>
        </div>

        {/* Mockup Generator Modal */}
        <MockupGenerator 
            isOpen={showMockup}
            onClose={() => setShowMockup(false)}
            requirements={data.requirements}
            contextName={data.name}
        />
    </div>
  );
};
