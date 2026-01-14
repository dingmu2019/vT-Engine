
import React, { useState, useRef, useEffect } from 'react';
import { 
  BookTemplate, Bot, Blocks, Database, Settings, Users, 
  BookOpenCheck, HelpCircle, Keyboard, LifeBuoy, MessageSquare, Info, 
  Menu, ChevronDown, ChevronUp, ClipboardList, Sparkles
} from 'lucide-react';
import { useSettings, useAuth, useToast } from '../../contexts';

// --- System Menu Item Component ---
const SystemMenuItem: React.FC<{ icon: React.ElementType, label: string, onClick?: () => void }> = ({ icon: Icon, label, onClick }) => (
    <button 
        onClick={onClick}
        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-md transition-colors text-left"
    >
        <Icon size={16} className="text-slate-400 dark:text-slate-500" />
        <span>{label}</span>
    </button>
);

interface SidebarMenuProps {
  onNavigate: (view: 'dashboard' | 'settings' | 'users' | 'agents' | 'integrations' | 'schema-query' | 'audit-logs' | 'optimization-agent') => void;
  onSelectModule: (id: string, name: string) => void;
  currentView: 'dashboard' | 'settings' | 'users' | 'agents' | 'integrations' | 'schema-query' | 'audit-logs' | 'optimization-agent';
  selectedModuleId: string | null;
  onOpenGuide: () => void;
  onOpenAbout: () => void;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({ 
  onNavigate, onSelectModule, currentView, selectedModuleId, onOpenGuide, onOpenAbout 
}) => {
  const { language } = useSettings();
  const { canManageUsers } = useAuth();
  const { addToast } = useToast();

  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const systemMenuRef = useRef<HTMLDivElement>(null);

  // Handle click outside system menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (systemMenuRef.current && !systemMenuRef.current.contains(event.target as Node)) {
            setIsSystemMenuOpen(false);
        }
    };
    if (isSystemMenuOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSystemMenuOpen]);

  const handleSystemAction = (action: string) => {
      addToast(`${action} ${language === 'zh' ? '功能开发中' : 'feature coming soon'}`, 'info');
      setIsSystemMenuOpen(false);
  };

  const t = {
      zh: {
          systemMenu: '系统菜单',
          help: '帮助中心',
          shortcuts: '快捷键',
          support: '联系支持',
          feedback: '功能反馈',
          about: '关于 T-Engine',
          settings: '个人设置',
          users: '用户管理',
          agents: 'AI Agent 管理',
          integrations: '集成管理',
          guide: '系统功能说明',
          schema: '数据库结构查询',
          audit: '审计日志',
          optAgent: '功能优化 AI Agent'
      },
      en: {
          systemMenu: 'System Menu',
          help: 'Help Center',
          shortcuts: 'Shortcuts',
          support: 'Contact Support',
          feedback: 'Feedback',
          about: 'About T-Engine',
          settings: 'Profile Settings',
          users: 'User Management',
          agents: 'AI Agent Management',
          integrations: 'Integration Management',
          guide: 'System Guide',
          schema: 'Database Schema',
          audit: 'Audit Logs',
          optAgent: 'Optimization AI Agent'
      }
  }[language];
  
  // Logic to determine if the system menu button should be highlighted
  const isSystemSelected = (currentView === 'dashboard' && selectedModuleId === 'global-standards') || 
                           currentView === 'settings' || 
                           currentView === 'users' || 
                           currentView === 'agents' || 
                           currentView === 'integrations' ||
                           currentView === 'schema-query' ||
                           currentView === 'audit-logs' ||
                           currentView === 'optimization-agent';

  return (
    <div className="px-3 pb-4 shrink-0 relative" ref={systemMenuRef}>
         {/* Collapsible Menu Popup */}
         {isSystemMenuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-200 z-50">
                <div className="p-1">
                    <SystemMenuItem 
                        icon={BookTemplate} 
                        label={language === 'zh' ? '全局架构规范' : 'Global Standards'} 
                        onClick={() => {
                            onSelectModule('global-standards', language === 'zh' ? '全局架构规范' : 'Global Standards');
                            setIsSystemMenuOpen(false);
                        }}
                    />
                     <SystemMenuItem 
                        icon={Bot} 
                        label={t.agents} 
                        onClick={() => {
                            onNavigate('agents');
                            setIsSystemMenuOpen(false);
                        }}
                    />
                    <SystemMenuItem 
                        icon={Blocks} 
                        label={t.integrations} 
                        onClick={() => {
                            onNavigate('integrations');
                            setIsSystemMenuOpen(false);
                        }}
                    />
                    <SystemMenuItem 
                        icon={Database} 
                        label={t.schema} 
                        onClick={() => {
                            onNavigate('schema-query');
                            setIsSystemMenuOpen(false);
                        }}
                    />
                    <SystemMenuItem 
                        icon={Sparkles} 
                        label={t.optAgent} 
                        onClick={() => {
                            onNavigate('optimization-agent');
                            setIsSystemMenuOpen(false);
                        }}
                    />
                    {canManageUsers && (
                        <SystemMenuItem 
                            icon={ClipboardList} 
                            label={t.audit} 
                            onClick={() => {
                                onNavigate('audit-logs');
                                setIsSystemMenuOpen(false);
                            }}
                        />
                    )}
                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                    <SystemMenuItem 
                        icon={Settings} 
                        label={t.settings} 
                        onClick={() => {
                            onNavigate('settings');
                            setIsSystemMenuOpen(false);
                        }}
                    />
                    {canManageUsers && (
                      <SystemMenuItem 
                          icon={Users} 
                          label={t.users} 
                          onClick={() => {
                              onNavigate('users');
                              setIsSystemMenuOpen(false);
                          }}
                      />
                    )}
                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                    <SystemMenuItem 
                        icon={BookOpenCheck} 
                        label={t.guide} 
                        onClick={() => {
                            onOpenGuide();
                            setIsSystemMenuOpen(false);
                        }} 
                    />
                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                    <SystemMenuItem 
                        icon={Info} 
                        label={t.about} 
                        onClick={() => {
                            onOpenAbout();
                            setIsSystemMenuOpen(false);
                        }} 
                    />
                </div>
            </div>
         )}

        <button 
            onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
            className={`flex items-center justify-between w-full px-3 py-2.5 rounded-lg border text-sm font-medium transition-all
                ${isSystemMenuOpen || isSystemSelected
                    ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 shadow-sm' 
                    : 'bg-transparent border-transparent text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:border-gray-200 dark:hover:border-gray-700'
                }`}
        >
            <div className="flex items-center gap-3">
                <Menu size={18} />
                <span>{t.systemMenu}</span>
            </div>
            {isSystemMenuOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
    </div>
  );
};
