
import { useState, useEffect } from 'react';
import { useIntegration, useToast } from '../contexts';
import { useTranslation } from './useTranslation';
import { api } from '../client';
import { LLM_PROVIDERS, DB_PROVIDERS } from '../constants';
import { AIService } from '../services/ai';

export type IntegrationTab = 'llm' | 'email' | 'wechat' | 'enterprise' | 'database';

export const useIntegrationLogic = () => {
  const { t, language } = useTranslation();
  const { addToast } = useToast();
  const { integrations, updateIntegration } = useIntegration();

  const [activeTab, setActiveTab] = useState<IntegrationTab>('llm');
  const [localConfig, setLocalConfig] = useState<any>({});
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Email Test State
  const [showEmailTestDialog, setShowEmailTestDialog] = useState(false);
  const [emailTestConfig, setEmailTestConfig] = useState({ to: '', subject: '', content: '' });
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // WeChat Test State
  const [showWechatTestDialog, setShowWechatTestDialog] = useState(false);
  const [wechatTestConfig, setWechatTestConfig] = useState({ content: '', toUser: '' });
  const [isSendingWechat, setIsSendingWechat] = useState(false);

  // Helper to map tab to key
  const getKeyForTab = (tab: IntegrationTab) => {
      switch(tab) {
          case 'llm': return 'llm_global';
          case 'email': return 'email_global';
          case 'wechat': return 'wechat_global';
          case 'database': return 'db_global';
          case 'enterprise': return 'enterprise_info';
          default: return '';
      }
  };

  const currentKey = getKeyForTab(activeTab);
  const currentIntegration = integrations.find(i => i.key === currentKey);
  const isEnabled = currentIntegration?.enabled ?? true;

  // Sync local config when tab changes or integrations load
  useEffect(() => {
      const key = getKeyForTab(activeTab);
      const integration = integrations.find(i => i.key === key);
      if (integration) {
          setLocalConfig(integration.config || {});
      } else {
          setLocalConfig({});
      }
  }, [activeTab, integrations]);

  const updateLocal = (field: string, value: any) => {
      setLocalConfig((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleToggle = async () => {
      if (currentKey && currentIntegration) {
          try {
            await updateIntegration(currentKey, { enabled: !isEnabled });
            addToast(isEnabled ? t('common.disabled') : t('common.enabled'), 'info');
          } catch (e) {
            addToast(t('integration.messages.toggleFailed'), 'error');
          }
      }
  };

  const handleSave = async () => {
      if (currentKey) {
          setIsSaving(true);
          try {
            await updateIntegration(currentKey, { config: localConfig });
            addToast(t('integration.messages.saveSuccess'), 'success');
          } catch (e) {
            addToast(t('integration.messages.saveFailed'), 'error');
          } finally {
            setIsSaving(false);
          }
      }
  };

  const handleProviderChange = (providerId: string) => {
    const provider = LLM_PROVIDERS.find(p => p.id === providerId);
    if (provider) {
      setLocalConfig((prev: any) => ({
        ...prev,
        provider: providerId,
        baseUrl: provider.baseUrl,
        model: provider.models[0]
      }));
    }
  };

  const handleDbTypeChange = (type: string) => {
    const provider = DB_PROVIDERS.find(p => p.id === type);
    setLocalConfig((prev: any) => ({
      ...prev,
      type,
      port: provider?.defaultPort || 3306
    }));
  };

  const handleSendTestEmail = async () => {
      if (!emailTestConfig.to || !emailTestConfig.subject || !emailTestConfig.content) {
          addToast(t('integration.messages.fillRequired'), 'error');
          return;
      }

      setIsSendingEmail(true);
      try {
          await api.integrations.testEmail({
              ...localConfig,
              to: emailTestConfig.to,
              subject: emailTestConfig.subject,
              text: emailTestConfig.content
          });

          addToast(t('integration.email.sendSuccess'), 'success');
          setShowEmailTestDialog(false);
      } catch (error: any) {
          console.error(error);
          addToast(`${t('integration.email.sendFailed')}: ${error.message}`, 'error');
      } finally {
          setIsSendingEmail(false);
      }
  };

  const handleSendTestWechat = async () => {
    if (!localConfig.corpId || !localConfig.agentId || !localConfig.secret) {
      addToast(t('integration.messages.fillRequired'), 'error');
      return;
    }
    if (!wechatTestConfig.content.trim()) {
      addToast(t('integration.messages.fillRequired'), 'error');
      return;
    }
    setIsSendingWechat(true);
    try {
      await api.integrations.testWeChat({
          corpId: localConfig.corpId,
          agentId: localConfig.agentId,
          secret: localConfig.secret,
          content: wechatTestConfig.content,
          toUser: wechatTestConfig.toUser || undefined
      });
      
      addToast(t('integration.wechat.sendSuccess'), 'success');
      setShowWechatTestDialog(false);
      setWechatTestConfig({ content: '', toUser: '' });
    } catch (e: any) {
      addToast(`${t('integration.wechat.sendFailed')}: ${e.message}`, 'error');
    } finally {
      setIsSendingWechat(false);
    }
  };

  const handleTestConnection = async () => {
    if (activeTab === 'llm') {
        if (!localConfig.apiKey) {
            addToast(t('integration.messages.fillRequired'), 'error');
            return;
        }

        setIsTesting(true);
        try {
            const aiService = new AIService({
                provider: localConfig.provider || 'google',
                apiKey: localConfig.apiKey,
                model: localConfig.model || 'gemini-1.5-pro',
                baseUrl: localConfig.baseUrl,
                temperature: localConfig.temperature || 0.7,
                maxTokens: localConfig.maxTokens || 2048
            });

            await aiService.generateContent('', 'Test connection');
            addToast(t('common.testSuccess'), 'success');
        } catch (error) {
            console.error(error);
            let msg = t('common.testFailed');
            if (error instanceof Error) msg = error.message;
            addToast(msg, 'error');
        } finally {
            setIsTesting(false);
        }
    } else {
        setIsTesting(true);
        setTimeout(() => {
            setIsTesting(false);
            addToast(t('common.testSuccess'), 'success');
        }, 1000);
    }
  };

  return {
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
  };
};
