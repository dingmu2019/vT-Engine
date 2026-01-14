
import React, { useState, useRef, useEffect } from 'react';
import { LogOut, Settings, User as UserIcon, ChevronDown, Users, Bot, Globe, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth, useSettings } from '../contexts';

interface HeaderProps {
  moduleName: string;
  onNavigate: (view: 'dashboard' | 'settings' | 'users' | 'agents' | 'integrations' | 'schema-query' | 'audit-logs' | 'optimization-agent') => void;
  onGoHome: () => void; // New prop
  currentView: 'dashboard' | 'settings' | 'users' | 'agents' | 'integrations' | 'schema-query' | 'audit-logs' | 'optimization-agent';
}

export const Header: React.FC<HeaderProps> = ({ moduleName, onNavigate, onGoHome, currentView }) => {
  const { user, logout, canManageUsers } = useAuth();
  const { language, setLanguage, theme, toggleTheme } = useSettings();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTitle = () => {
    if (currentView === 'settings') return language === 'zh' ? '个人设置' : 'Settings';
    if (currentView === 'users') return language === 'zh' ? '用户管理' : 'User Management';
    if (currentView === 'agents') return language === 'zh' ? 'AI Agent 管理' : 'AI Agent Management';
    if (currentView === 'integrations') return language === 'zh' ? '集成管理' : 'Integration Management';
    if (currentView === 'schema-query') return language === 'zh' ? '数据库结构查询' : 'Database Schema';
    if (currentView === 'audit-logs') return language === 'zh' ? '审计日志' : 'Audit Logs';
    if (currentView === 'optimization-agent') return language === 'zh' ? '功能优化 AI Agent' : 'Optimization AI Agent';
    // If no moduleName, we are at Home
    return moduleName || (language === 'zh' ? '首页' : 'Home');
  };

  return (
    <header className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between shrink-0 z-20">
      {/* Left: Breadcrumb / Title */}
      <div className="flex items-center gap-2">
        <span className="text-gray-400 text-sm hidden sm:inline">T-Engine /</span>
        <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
          {getTitle()}
        </h2>
      </div>

      {/* Right: Controls */}
      <div className="flex items-center gap-2">
        
        {/* Language Toggle */}
        <button
          onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
          className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
          title={language === 'zh' ? 'Switch to English' : '切换到中文'}
        >
          <Globe size={18} />
          <span className="text-xs font-bold uppercase">{language === 'zh' ? 'CN' : 'EN'}</span>
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 hover:text-amber-500 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          title={theme === 'system' ? 'System Theme' : theme === 'light' ? 'Light Mode' : 'Dark Mode'}
        >
          {theme === 'light' ? <Sun size={18} /> : theme === 'dark' ? <Moon size={18} /> : <Monitor size={18} />}
        </button>

        <div className="h-5 w-px bg-gray-200 dark:bg-gray-800 mx-2"></div>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors outline-none"
            >
               <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white overflow-hidden shadow-sm
                  ${user.role === 'Admin' ? 'bg-red-500' : user.role === 'PM' ? 'bg-purple-500' : user.role === 'Expert' ? 'bg-green-500' : 'bg-blue-500'}`}>
                   {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                   ) : (
                      user.avatar
                   )}
               </div>
               <div className="text-left hidden md:block">
                  <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{user.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user.role}</div>
               </div>
               <ChevronDown size={14} className="text-gray-400" />
            </button>

            {showDropdown && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-gray-100 dark:border-gray-800 py-2 animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                      <div className="text-xs text-gray-500">Signed in as</div>
                      <div className="font-medium text-sm text-slate-900 dark:text-white truncate">{user.email}</div>
                  </div>
                  
                  <button 
                    onClick={() => {
                        onNavigate('settings');
                        setShowDropdown(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
                  >
                      <Settings size={16} />
                      {language === 'zh' ? '个人设置' : 'Settings'}
                  </button>

                  {canManageUsers && (
                    <button 
                        onClick={() => {
                            onNavigate('users');
                            setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                        <Users size={16} />
                        {language === 'zh' ? '用户管理' : 'User Management'}
                    </button>
                  )}

                   <button 
                        onClick={() => {
                            onNavigate('agents');
                            setShowDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 flex items-center gap-2"
                    >
                        <Bot size={16} />
                        {language === 'zh' ? 'AI Agent 管理' : 'AI Agents'}
                    </button>

                  <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>

                  <button 
                    onClick={logout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                  >
                      <LogOut size={16} />
                      {language === 'zh' ? '退出登录' : 'Sign Out'}
                  </button>
              </div>
            )}
        </div>

      </div>
    </header>
  );
};
