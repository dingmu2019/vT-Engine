
import React, { useEffect, useMemo, useState } from 'react';
import { 
  LayoutGrid, Users, BookTemplate, Activity, 
  ArrowRight, Zap, Shield, GitBranch, Database, Clock
} from 'lucide-react';
import { useAuth, useNavigation, useSettings } from '../contexts';
import { NavNode } from '../types';
import { api } from '../client';

interface HomeProps {
  onNavigateToModule: (id: string, name: string) => void;
  onNavigateToView: (view: 'dashboard' | 'settings' | 'users') => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigateToModule, onNavigateToView }) => {
  const { user, allUsers, canManageUsers } = useAuth();
  const { tree } = useNavigation();
  const { language } = useSettings();

  // Helper to count modules
  const countModules = (nodes: NavNode[]): number => {
    let count = 0;
    nodes.forEach(node => {
      if (node.type === 'module') count++;
      if (node.children) count += countModules(node.children);
    });
    return count;
  };

  const moduleCount = countModules(tree);
  const userCount = allUsers.length;

  const [standardsVersion, setStandardsVersion] = useState<string>('—');
  const [systemHealth, setSystemHealth] = useState<string>('—');
  const [recentLogs, setRecentLogs] = useState<Array<{ id: string; text: string; time: string }>>([]);

  const t = {
    en: {
      welcome: `Welcome back, ${user.name}`,
      subtitle: 'T-Engine is ready. What would you like to build today?',
      vision: 'Bridging Business Intent & Tech Implementation. Accelerating global SaaS delivery via structured logic and AI context.',
      stats_modules: 'Active Modules',
      stats_users: 'Team Members',
      stats_standards: 'Architecture Standards',
      stats_coverage: 'Logic Coverage',
      quick_actions: 'Quick Actions',
      go_standards: 'View Global Standards',
      manage_users: 'Manage Users',
      recent_activity: 'Recent System Activity',
      mock_activity_1: 'Paul PM updated "Lead Management" requirements',
      mock_activity_2: 'Emma Expert added 3 new logic rules to "Order"',
      mock_activity_3: 'Dave Dev exported AI Context for "Payment"',
      explore_modules: 'Explore Modules',
      module_desc: 'Browse T-Platform Functional Tree',
      doc_center: 'Documentation',
      doc_desc: 'System guidelines',
      system_health: 'System Health',
      normal: 'Normal',
    },
    zh: {
      welcome: `欢迎回来，${user.name}`,
      subtitle: 'T-Engine 引擎已就绪。今天想构建什么？',
      vision: '连接业务意图与技术实现的桥梁。通过结构化逻辑与 AI 上下文，加速内部IT系统 交付效率。',
      stats_modules: '活跃业务模块',
      stats_users: '团队成员',
      stats_standards: '架构规范版本',
      stats_coverage: '逻辑覆盖率',
      quick_actions: '快捷操作',
      go_standards: '查看全局架构规范',
      manage_users: '用户与权限管理',
      recent_activity: '近期系统动态',
      mock_activity_1: 'Paul PM 更新了 "线索管理" 的需求文档',
      mock_activity_2: 'Emma Expert 为 "订单模块" 新增了 3 条逻辑规则',
      mock_activity_3: 'Dave Dev 导出了 "支付中心" 的 AI 上下文包',
      explore_modules: '浏览模块',
      module_desc: '查看T台功能全景树',
      doc_center: '文档中心',
      doc_desc: '系统使用指南',
      system_health: '系统状态',
      normal: '运行正常',
    }
  }[language];

  const timeAgo = (iso: string) => {
    const ts = new Date(iso).getTime();
    if (!Number.isFinite(ts)) return '';
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return language === 'zh' ? '刚刚' : 'just now';
    if (mins < 60) return language === 'zh' ? `${mins} 分钟前` : `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return language === 'zh' ? `${hours} 小时前` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return language === 'zh' ? `${days} 天前` : `${days}d ago`;
  };

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const [health, version, audit] = await Promise.all([
          api.system.health(),
          api.system.getConfig('global_standards_version'),
          api.logs.getAuditCursor(6),
        ]);

        if (cancelled) return;

        setSystemHealth(health?.ok ? '100%' : '0%');
        setStandardsVersion(version || '—');

        const items = (audit?.items || []).slice(0, 3).map((l) => {
          const userName = l.userName || 'System';
          const action = l.action || '';
          const module = l.module || '';
          const details = l.details || '';
          const text = details ? `${userName} · ${action} · ${module} — ${details}` : `${userName} · ${action} · ${module}`;
          return {
            id: l.id,
            text,
            time: l.timestamp ? timeAgo(l.timestamp) : '',
          };
        });
        setRecentLogs(items);
      } catch {
        if (cancelled) return;
        setSystemHealth('—');
        setStandardsVersion('—');
        setRecentLogs([]);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [language]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-12 opacity-10 transform rotate-12 group-hover:scale-110 transition-transform duration-700">
           <LayoutGrid size={200} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4 opacity-80">
             <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-sm">
                <Zap size={16} className="text-yellow-300" />
             </div>
             <span className="text-sm font-medium tracking-wide uppercase">T-Engine v0.1.0</span>
          </div>
          <h1 className="text-4xl font-bold mb-3">{t.welcome}</h1>
          <p className="text-indigo-100 text-lg max-w-2xl">{t.subtitle}</p>
          <div className="mt-4 pt-4 border-t border-indigo-400/30">
             <p className="text-indigo-200 text-sm max-w-3xl font-light italic flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-indigo-300"></span>
                {t.vision}
             </p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                 <LayoutGrid size={24} />
              </div>
              <div>
                 <div className="text-2xl font-bold text-slate-900 dark:text-white">{moduleCount}</div>
                 <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t.stats_modules}</div>
              </div>
           </div>
        </div>
        
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-xl">
                 <Users size={24} />
              </div>
              <div>
                 <div className="text-2xl font-bold text-slate-900 dark:text-white">{userCount}</div>
                 <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t.stats_users}</div>
              </div>
           </div>
        </div>

         <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex items-center gap-4">
                 <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                     <Shield size={24} />
                  </div>
                  <div>
                 <div className="text-2xl font-bold text-slate-900 dark:text-white">{standardsVersion}</div>
                 <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t.stats_standards}</div>
                  </div>
               </div>
            </div>

         <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
           <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-xl">
                     <Activity size={24} />
                  </div>
                  <div>
                 <div className="text-2xl font-bold text-slate-900 dark:text-white">{systemHealth}</div>
                 <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">{t.system_health}</div>
                  </div>
               </div>
            </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Recent Activity */}
         <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
               <Clock size={20} className="text-indigo-500" />
               {t.recent_activity}
            </h3>
            <div className="space-y-6">
               {(recentLogs.length > 0 ? recentLogs : [
                  { id: 'placeholder_1', text: t.mock_activity_1, time: language === 'zh' ? '—' : '—' },
                  { id: 'placeholder_2', text: t.mock_activity_2, time: language === 'zh' ? '—' : '—' },
                  { id: 'placeholder_3', text: t.mock_activity_3, time: language === 'zh' ? '—' : '—' }
               ]).map((act, i) => (
                  <div key={act.id} className="flex gap-4">
                     <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 mb-1"></div>
                        <div className="w-0.5 h-full bg-gray-100 dark:bg-gray-800"></div>
                     </div>
                     <div className="pb-2">
                        <p className="text-sm text-slate-700 dark:text-slate-200">{act.text}</p>
                        <p className="text-xs text-gray-400 mt-1">{act.time}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>

         {/* Quick Actions */}
         <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white px-2">{t.quick_actions}</h3>
            
            <button 
               onClick={() => onNavigateToModule('global-standards', language === 'zh' ? '全局架构规范' : 'Global Standards')}
               className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-indigo-500 dark:hover:border-indigo-500 hover:shadow-md transition-all group text-left"
            >
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg group-hover:scale-110 transition-transform">
                     <BookTemplate size={20} />
                  </div>
                  <div>
                     <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t.go_standards}</div>
                     <div className="text-xs text-gray-500">{t.doc_desc}</div>
                  </div>
               </div>
               <ArrowRight size={16} className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
            </button>

            {canManageUsers && (
               <button 
                  onClick={() => onNavigateToView('users')}
                  className="w-full flex items-center justify-between p-4 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-md transition-all group text-left"
               >
                  <div className="flex items-center gap-3">
                     <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg group-hover:scale-110 transition-transform">
                        <Users size={20} />
                     </div>
                     <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{t.manage_users}</div>
                        <div className="text-xs text-gray-500">{t.stats_users}</div>
                     </div>
                  </div>
                  <ArrowRight size={16} className="text-gray-300 group-hover:text-purple-500 transition-colors" />
               </button>
            )}

            <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 text-white mt-4 relative overflow-hidden">
               <div className="relative z-10">
                  <div className="text-sm font-semibold mb-1">Cursor / Windsurf Ready</div>
                  <div className="text-xs text-slate-400 mb-3">
                     {language === 'zh' ? '生成的指令包已针对 AI 编程工具优化。' : 'Generated prompts are optimized for AI coding tools.'}
                  </div>
                  <div className="flex items-center gap-2 text-xs font-mono text-indigo-300">
                     <Database size={12} />
                     <span>Structure v0.1</span>
                  </div>
               </div>
               <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                  <GitBranch size={80} />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};
