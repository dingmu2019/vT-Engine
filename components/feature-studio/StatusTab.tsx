
import React from 'react';
import { 
  CheckCircle, Circle, Calendar, User, Users, Info 
} from 'lucide-react';
import { useAuth, useSettings, useNavigation, useToast } from '../../contexts';
import { ModuleData, Role } from '../../types';

interface StatusTabProps {
  data: ModuleData;
  onUpdate: (data: Partial<ModuleData>) => void;
}

export const StatusTab: React.FC<StatusTabProps> = ({ data, onUpdate }) => {
  const { canManageStructure, allUsers } = useAuth();
  const { language } = useSettings();
  const { updateNode } = useNavigation();
  const { addToast } = useToast();

  const t = {
    en: {
      statusTitle: 'Development Status',
      statusDesc: 'Manage the lifecycle stage of this module.',
      draft: 'Draft (Planning)',
      ready: 'Ready (AI Context Complete)',
      planning: 'Planning',
      ownersTitle: 'Module Owners',
      ownersDesc: 'Assign key personnel responsible for this module.',
      rolePM: 'Product Manager',
      roleDev: 'Tech Lead / Developer',
      roleExpert: 'Business Expert',
      timelineTitle: 'Timeline',
      startDate: 'Plan Start Date',
      endDate: 'Plan End Date',
      save: 'Save Changes',
      toastUpdated: 'Status updated successfully'
    },
    zh: {
      statusTitle: '功能开发状态',
      statusDesc: '管理该功能模块的生命周期阶段。',
      draft: '草稿 (规划中)',
      ready: '就绪 (AI 上下文已完善)',
      planning: '规划中',
      ownersTitle: '责任人分配',
      ownersDesc: '指定该模块的核心负责人。',
      rolePM: '产品经理 (PM)',
      roleDev: '研发负责人 (Dev)',
      roleExpert: '业务专家 (Expert)',
      timelineTitle: '开发排期',
      startDate: '计划开始时间',
      endDate: '计划结束时间',
      save: '保存更改',
      toastUpdated: '状态已更新'
    }
  }[language];

  // Helper to get users by role
  const getUsersByRole = (role: Role) => allUsers.filter(u => u.role === role || u.role === 'Admin');

  const handleStatusChange = (status: 'draft' | 'ready') => {
    if (!canManageStructure) return;
    onUpdate({ status });
    // Sync with Sidebar Tree
    updateNode(data.id, { status });
    addToast(t.toastUpdated, 'success');
  };

  const handleOwnerChange = (roleKey: 'pm' | 'dev' | 'expert', userId: string) => {
    if (!canManageStructure) return;
    
    // For simplicity, we toggle the selection (single select behavior for now, stored as array)
    // If we wanted multi-select, logic would differ.
    // Assuming single owner per role for this UI, but data structure supports array.
    const newOwners = { ...data.owners, [roleKey]: [userId] };
    onUpdate({ owners: newOwners });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    if (!canManageStructure) return;
    onUpdate({ timeline: { ...data.timeline, [field]: value } });
  };

  const getOwnerValue = (roleKey: 'pm' | 'dev' | 'expert') => {
      return data.owners?.[roleKey]?.[0] || '';
  };

  return (
    <div className="h-full flex flex-col gap-8 overflow-y-auto custom-scrollbar pr-2">
      
      {/* Status Section */}
      <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-lg ${data.status === 'ready' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                {data.status === 'ready' ? <CheckCircle size={20} /> : <Circle size={20} />}
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.statusTitle}</h3>
                <p className="text-sm text-gray-500">{t.statusDesc}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
                onClick={() => handleStatusChange('draft')}
                disabled={!canManageStructure}
                className={`flex items-center p-4 rounded-xl border-2 transition-all text-left group
                    ${data.status === 'draft' 
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300'
                    }
                    ${!canManageStructure ? 'opacity-70 cursor-not-allowed' : ''}
                `}
            >
                <div className={`mr-4 p-1 rounded-full border ${data.status === 'draft' ? 'border-indigo-500 bg-indigo-500 text-white' : 'border-gray-300'}`}>
                    <Circle size={16} fill={data.status === 'draft' ? 'currentColor' : 'none'} className={data.status === 'draft' ? 'text-white' : 'text-transparent'} />
                </div>
                <div>
                    <div className={`font-bold ${data.status === 'draft' ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-400'}`}>
                        {t.draft}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Definition & Planning Phase</div>
                </div>
            </button>

            <button
                onClick={() => handleStatusChange('ready')}
                disabled={!canManageStructure}
                className={`flex items-center p-4 rounded-xl border-2 transition-all text-left group
                    ${data.status === 'ready' 
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-green-300'
                    }
                    ${!canManageStructure ? 'opacity-70 cursor-not-allowed' : ''}
                `}
            >
                <div className={`mr-4 p-1 rounded-full border ${data.status === 'ready' ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'}`}>
                    <CheckCircle size={16} fill={data.status === 'ready' ? 'currentColor' : 'none'} className={data.status === 'ready' ? 'text-white' : 'text-transparent'} />
                </div>
                <div>
                    <div className={`font-bold ${data.status === 'ready' ? 'text-green-700 dark:text-green-300' : 'text-slate-600 dark:text-slate-400'}`}>
                        {t.ready}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">Ready for AI Coding / Implementation</div>
                </div>
            </button>
        </div>
      </section>

      {/* Owners Section */}
      <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
         <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 rounded-lg">
                <Users size={20} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.ownersTitle}</h3>
                <p className="text-sm text-gray-500">{t.ownersDesc}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* PM Selector */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    <User size={12} /> {t.rolePM}
                </label>
                <select 
                    value={getOwnerValue('pm')}
                    onChange={(e) => handleOwnerChange('pm', e.target.value)}
                    disabled={!canManageStructure}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                >
                    <option value="">Select PM...</option>
                    {getUsersByRole('PM').map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            </div>

            {/* Dev Selector */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    <User size={12} /> {t.roleDev}
                </label>
                <select 
                    value={getOwnerValue('dev')}
                    onChange={(e) => handleOwnerChange('dev', e.target.value)}
                    disabled={!canManageStructure}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                >
                    <option value="">Select Dev...</option>
                    {getUsersByRole('Dev').map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            </div>

            {/* Expert Selector */}
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                    <User size={12} /> {t.roleExpert}
                </label>
                <select 
                    value={getOwnerValue('expert')}
                    onChange={(e) => handleOwnerChange('expert', e.target.value)}
                    disabled={!canManageStructure}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-60"
                >
                    <option value="">Select Expert...</option>
                    {getUsersByRole('Expert').map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
         <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg">
                <Calendar size={20} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.timelineTitle}</h3>
                <p className="text-sm text-gray-500">
                    {data.timeline?.startDate && data.timeline?.endDate 
                        ? `${data.timeline.startDate} -> ${data.timeline.endDate}`
                        : 'Set the planned schedule.'}
                </p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">{t.startDate}</label>
                <input 
                    type="date"
                    value={data.timeline?.startDate || ''}
                    onChange={(e) => handleDateChange('startDate', e.target.value)}
                    disabled={!canManageStructure}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                />
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">{t.endDate}</label>
                <input 
                    type="date"
                    value={data.timeline?.endDate || ''}
                    onChange={(e) => handleDateChange('endDate', e.target.value)}
                    disabled={!canManageStructure}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-60"
                />
            </div>
        </div>
      </section>

    </div>
  );
};
