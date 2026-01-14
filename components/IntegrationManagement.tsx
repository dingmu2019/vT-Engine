import React, { useState } from 'react';
import { 
  Cpu, Mail, MessageSquare, Building2, Save, Eye, EyeOff, 
  CheckCircle, AlertCircle, Globe, Server, Loader2, Database, Power, X
} from 'lucide-react';
import { LLM_PROVIDERS, DB_PROVIDERS } from '../constants';
import { useIntegrationLogic } from '../hooks/useIntegrationLogic';

export const IntegrationManagement: React.FC = () => {
  const {
    t,
    language,
    activeTab,
    setActiveTab,
    localConfig,
    updateLocal,
    isEnabled,
    handleToggle,
    handleSave,
    isSaving,
    isTesting,
    handleTestConnection,
    handleProviderChange,
    handleDbTypeChange,
    
    // Email Test
    showEmailTestDialog,
    setShowEmailTestDialog,
    emailTestConfig,
    setEmailTestConfig,
    isSendingEmail,
    handleSendTestEmail,

    // WeChat Test
    showWechatTestDialog,
    setShowWechatTestDialog,
    wechatTestConfig,
    setWechatTestConfig,
    isSendingWechat,
    handleSendTestWechat
  } = useIntegrationLogic();

  const [showKey, setShowKey] = useState(false);
  const [showEmailPass, setShowEmailPass] = useState(false);
  const [showDbPass, setShowDbPass] = useState(false);

  const currentProvider = LLM_PROVIDERS.find(p => p.id === localConfig.provider);

  const renderTabButton = (id: any, icon: React.ElementType, label: string) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all ${
        activeTab === id 
          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
          : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
      }`}
    >
      <div className={`p-1.5 rounded-lg ${activeTab === id ? 'bg-white/20' : 'bg-gray-100 dark:bg-slate-900'}`}>
         {React.createElement(icon, { size: 18 })}
      </div>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-in fade-in duration-500">
       {/* Header */}
       <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Cpu className="text-indigo-600" />
          {t('integration.title')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{t('integration.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Sidebar Tabs */}
          <div className="space-y-2">
              {renderTabButton('llm', Cpu, t('integration.tabs.llm'))}
              {renderTabButton('email', Mail, t('integration.tabs.email'))}
              {renderTabButton('database', Database, t('integration.tabs.database'))}
              {renderTabButton('wechat', MessageSquare, t('integration.tabs.wechat'))}
              {renderTabButton('enterprise', Building2, t('integration.tabs.enterprise'))}
          </div>

          {/* Content Area */}
          <div className="md:col-span-3 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6 flex flex-col min-h-[500px]">
              
              {/* Toolbar */}
              <div className="flex items-center justify-between pb-6 border-b border-gray-100 dark:border-gray-800 mb-6">
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                      {activeTab === 'llm' && <Globe size={20} className="text-indigo-500" />}
                      {activeTab === 'email' && <Mail size={20} className="text-indigo-500" />}
                      {activeTab === 'database' && <Database size={20} className="text-indigo-500" />}
                      {activeTab === 'wechat' && <MessageSquare size={20} className="text-indigo-500" />}
                      {activeTab === 'enterprise' && <Building2 size={20} className="text-indigo-500" />}
                      {t(`integration.tabs.${activeTab}`)}
                  </h3>
                  
                  {/* Hot-plug Toggle */}
                  <div className="flex items-center gap-3">
                      <span className={`text-sm font-medium ${isEnabled ? 'text-green-600' : 'text-gray-400'}`}>
                          {isEnabled ? t('common.enabled') : t('common.disabled')}
                      </span>
                      <button 
                          onClick={handleToggle}
                          className={`w-12 h-6 rounded-full p-1 transition-colors flex items-center ${isEnabled ? 'bg-green-500' : 'bg-gray-200 dark:bg-slate-700'}`}
                      >
                          <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-0'}`} />
                      </button>
                  </div>
              </div>

              {/* Form Content - Driven by localConfig */}
              <div className="flex-1">
                  {activeTab === 'llm' && (
                      <div className="grid grid-cols-2 gap-6">
                          <div className="col-span-2 space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.llm.provider')}</label>
                             <select 
                                value={localConfig.provider || ''}
                                onChange={e => handleProviderChange(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                             >
                                 {LLM_PROVIDERS.map(p => (
                                   <option key={p.id} value={p.id}>{p.name}</option>
                                 ))}
                             </select>
                          </div>

                          <div className="col-span-2 space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.llm.endpoint')}</label>
                             <div className="relative">
                               <Server className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                               <input 
                                  type="text"
                                  value={localConfig.baseUrl || ''}
                                  onChange={e => updateLocal('baseUrl', e.target.value)}
                                  className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-xs"
                               />
                             </div>
                             {localConfig.provider === 'azure' && (
                               <p className="text-xs text-amber-600 dark:text-amber-400">{t('integration.llm.azure_hint')}</p>
                             )}
                          </div>

                          <div className="col-span-2 space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.llm.model')}</label>
                             <div className="flex gap-2">
                               <select 
                                  value={localConfig.model || ''}
                                  onChange={e => updateLocal('model', e.target.value)}
                                  className="flex-1 px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                               >
                                   {currentProvider?.models.map(m => (
                                     <option key={m} value={m}>{m}</option>
                                   ))}
                               </select>
                               <input 
                                  type="text"
                                  placeholder="Custom Model ID"
                                  value={localConfig.model || ''}
                                  onChange={e => updateLocal('model', e.target.value)}
                                  className="w-1/3 px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none placeholder:text-xs"
                               />
                             </div>
                          </div>

                          <div className="col-span-2 space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.llm.apiKey')}</label>
                             <div className="relative">
                                <input 
                                    type={showKey ? "text" : "password"}
                                    value={localConfig.apiKey || ''}
                                    onChange={e => updateLocal('apiKey', e.target.value)}
                                    className="w-full pl-4 pr-10 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm"
                                    placeholder="sk-..."
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowKey(!showKey)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                             </div>
                          </div>
                          
                          <div className="space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Max Tokens</label>
                             <input 
                                type="number"
                                value={localConfig.maxTokens || 2048}
                                onChange={e => updateLocal('maxTokens', parseInt(e.target.value))}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                             />
                          </div>

                           <div className="space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Temperature</label>
                             <input 
                                type="number"
                                step="0.1"
                                max="1"
                                min="0"
                                value={localConfig.temperature || 0.7}
                                onChange={e => updateLocal('temperature', parseFloat(e.target.value))}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                             />
                          </div>
                      </div>
                  )}

                  {activeTab === 'email' && (
                      <div className="grid grid-cols-2 gap-6">
                           <div className="col-span-2 md:col-span-1 space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.email.host')}</label>
                             <input type="text" value={localConfig.host || ''} onChange={e => updateLocal('host', e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="smtp.example.com" />
                           </div>
                           <div className="col-span-2 md:col-span-1 space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.email.port')}</label>
                             <input type="number" value={localConfig.port || ''} onChange={e => updateLocal('port', parseInt(e.target.value))} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="587" />
                           </div>
                           
                           <div className="col-span-2 space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.email.user')}</label>
                             <input type="email" value={localConfig.user || ''} onChange={e => updateLocal('user', e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="user@example.com" />
                           </div>

                           <div className="col-span-2 space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.email.pass')}</label>
                             <div className="relative">
                                <input 
                                    type={showEmailPass ? "text" : "password"}
                                    value={localConfig.pass || ''}
                                    onChange={e => updateLocal('pass', e.target.value)}
                                    className="w-full pl-4 pr-10 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                                    placeholder="••••••••"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowEmailPass(!showEmailPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showEmailPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                             </div>
                           </div>

                           <div className="col-span-2 space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.email.sender')}</label>
                             <input type="text" value={localConfig.senderName || ''} onChange={e => updateLocal('senderName', e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" placeholder="System Notification" />
                           </div>
                      </div>
                  )}

                  {activeTab === 'database' && (
                      <div className="grid grid-cols-2 gap-6">
                           <div className="col-span-2 space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.database.type')}</label>
                             <select 
                                value={localConfig.type || ''}
                                onChange={e => handleDbTypeChange(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                             >
                                 {DB_PROVIDERS.map(p => (
                                   <option key={p.id} value={p.id}>{p.name}</option>
                                 ))}
                             </select>
                           </div>

                           {localConfig.type === 'supabase' && (
                               <div className="col-span-2 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300 mb-2">
                                   <p className="flex items-center gap-2">
                                       <AlertCircle size={16} />
                                       Supabase 连接通常使用环境变量配置。在此处填写将覆盖环境变量。
                                   </p>
                                   <p className="mt-1 ml-6 text-xs opacity-80">
                                       推荐使用: Project URL 作为 Host, 5432 作为 Port, 'postgres' 作为 Database Name。
                                   </p>
                               </div>
                           )}

                           <div className="col-span-2 md:col-span-1 space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.database.host')}</label>
                             <input 
                                type="text" 
                                value={localConfig.host || ''} 
                                onChange={e => updateLocal('host', e.target.value)} 
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                                placeholder="localhost" 
                             />
                           </div>
                           <div className="col-span-2 md:col-span-1 space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.database.port')}</label>
                             <input 
                                type="number" 
                                value={localConfig.port || ''} 
                                onChange={e => updateLocal('port', parseInt(e.target.value))} 
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                             />
                           </div>
                           
                           <div className="col-span-2 space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.database.dbName')}</label>
                             <input 
                                type="text" 
                                value={localConfig.database || ''} 
                                onChange={e => updateLocal('database', e.target.value)} 
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                                placeholder="my_database" 
                             />
                           </div>

                           <div className="col-span-2 md:col-span-1 space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.database.username')}</label>
                             <input 
                                type="text" 
                                value={localConfig.username || ''} 
                                onChange={e => updateLocal('username', e.target.value)} 
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                                placeholder="root" 
                             />
                           </div>

                           <div className="col-span-2 md:col-span-1 space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.database.password')}</label>
                             <div className="relative">
                                <input 
                                    type={showDbPass ? "text" : "password"}
                                    value={localConfig.password || ''}
                                    onChange={e => updateLocal('password', e.target.value)}
                                    className="w-full pl-4 pr-10 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                                    placeholder="••••••••"
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowDbPass(!showDbPass)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showDbPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                             </div>
                           </div>
                      </div>
                  )}

                  {activeTab === 'wechat' && (
                      <div className="space-y-4">
                           <div className="space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Corp ID</label>
                             <input 
                                type="text" 
                                placeholder="ww..." 
                                value={localConfig.corpId || ''}
                                onChange={e => updateLocal('corpId', e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none" 
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Agent ID</label>
                             <input 
                                type="text" 
                                placeholder="1000001" 
                                value={localConfig.agentId || ''}
                                onChange={e => updateLocal('agentId', e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none" 
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Agent Secret</label>
                             <input 
                                type="password" 
                                placeholder="Key..." 
                                value={localConfig.secret || ''}
                                onChange={e => updateLocal('secret', e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none" 
                             />
                           </div>
                      </div>
                  )}

                  {activeTab === 'enterprise' && (
                      <div className="space-y-4">
                           <div className="space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.enterprise.name')}</label>
                             <input type="text" value={localConfig.name || ''} onChange={e => updateLocal('name', e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                           </div>
                           <div className="space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.enterprise.address')}</label>
                             <input type="text" value={localConfig.address || ''} onChange={e => updateLocal('address', e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500" />
                           </div>
                           <div className="space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.enterprise.overview')}</label>
                             <textarea 
                                value={localConfig.companyOverview || ''} 
                                onChange={e => updateLocal('companyOverview', e.target.value)} 
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-xs custom-scrollbar" 
                                rows={10}
                             />
                           </div>
                           <div className="space-y-2">
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.enterprise.dept')}</label>
                             <textarea 
                                value={localConfig.deptOverview || ''} 
                                onChange={e => updateLocal('deptOverview', e.target.value)} 
                                className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none font-mono text-xs custom-scrollbar" 
                                rows={6}
                             />
                           </div>
                      </div>
                  )}
              </div>

              {/* Footer Actions */}
              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
                   {activeTab === 'wechat' && (
                       <button
                           onClick={() => setShowWechatTestDialog(true)}
                           disabled={!isEnabled}
                           className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                           <MessageSquare size={16} />
                           {t('integration.wechat.testSend')}
                       </button>
                   )}
                   {activeTab === 'email' && (
                       <button
                           onClick={() => setShowEmailTestDialog(true)}
                           disabled={!isEnabled}
                           className="px-4 py-2 text-sm text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                           <Mail size={16} />
                           {t('integration.email.testSend')}
                       </button>
                   )}
                   <button 
                      onClick={handleTestConnection}
                      disabled={isTesting || !isEnabled}
                      className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800 rounded-lg transition-colors border border-gray-200 dark:border-gray-700 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      {isTesting && <Loader2 size={14} className="animate-spin" />}
                      {isTesting ? t('common.testing') : t('common.test')}
                   </button>
                   <button 
                      onClick={handleSave}
                      disabled={isSaving || !isEnabled}
                      className="flex items-center gap-2 px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                   >
                      {isSaving && <Loader2 size={14} className="animate-spin" />}
                      {isSaving ? t('common.saving') : t('common.save')}
                   </button>
              </div>

          </div>
      </div>

      {/* Email Test Dialog */}
      {showEmailTestDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 border border-gray-200 dark:border-gray-800 m-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('integration.email.testDialogTitle')}</h3>
              <button 
                onClick={() => setShowEmailTestDialog(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.email.recipient')}</label>
                <input 
                  type="email" 
                  value={emailTestConfig.to}
                  onChange={e => setEmailTestConfig(prev => ({ ...prev, to: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="receiver@example.com"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.email.subject')}</label>
                <input 
                  type="text" 
                  value={emailTestConfig.subject}
                  onChange={e => setEmailTestConfig(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Test Email Subject"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.email.content')}</label>
                <textarea 
                  value={emailTestConfig.content}
                  onChange={e => setEmailTestConfig(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-32"
                  placeholder="Hello, this is a test email."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button 
                onClick={() => setShowEmailTestDialog(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleSendTestEmail}
                disabled={isSendingEmail}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSendingEmail && <Loader2 size={14} className="animate-spin" />}
                {isSendingEmail ? t('integration.email.sending') : t('integration.email.send')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* WeChat Test Dialog */}
      {showWechatTestDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 border border-gray-200 dark:border-gray-800 m-4">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('integration.wechat.testDialogTitle')}</h3>
              <button 
                onClick={() => setShowWechatTestDialog(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.wechat.content')}</label>
                <textarea 
                  value={wechatTestConfig.content}
                  onChange={e => setWechatTestConfig(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-28"
                  placeholder={t('integration.wechat.contentPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('integration.wechat.toUser')}</label>
                <input 
                  type="text" 
                  value={wechatTestConfig.toUser}
                  onChange={e => setWechatTestConfig(prev => ({ ...prev, toUser: e.target.value }))}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={t('integration.wechat.toUserPlaceholder')}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button 
                onClick={() => setShowWechatTestDialog(false)}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button 
                onClick={handleSendTestWechat}
                disabled={isSendingWechat}
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSendingWechat && <Loader2 size={14} className="animate-spin" />}
                {isSendingWechat ? t('integration.wechat.sending') : t('integration.wechat.send')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
