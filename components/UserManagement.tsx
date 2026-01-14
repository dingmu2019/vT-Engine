
import React, { useState } from 'react';
import { 
  Users, Plus, Search, Shield, ShieldOff, KeyRound, 
  MoreHorizontal, CheckCircle, Ban, Mail, UserPlus, Phone, Edit 
} from 'lucide-react';
import { useAuth, useSettings, useToast } from '../contexts';
import { Role, UserProfile } from '../types';
import { ConfirmModal } from './ConfirmModal';

export const UserManagement: React.FC = () => {
  const { allUsers, addUser, updateUser, toggleUserStatus, resetUserPassword, canManageUsers } = useAuth();
  const { language } = useSettings();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Confirmation Modal State
  const [confirmResetData, setConfirmResetData] = useState<{name: string, id: string} | null>(null);

  // Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState<Role>('Expert');
  const [newPhone, setNewPhone] = useState('');
  const [newGender, setNewGender] = useState<UserProfile['gender']>('secret');
  const [newBio, setNewBio] = useState('');

  if (!canManageUsers) {
    return (
        <div className="flex items-center justify-center h-full text-gray-400">
            Access Denied. Admin privileges required.
        </div>
    )
  }

  const t = {
    en: {
      title: 'User Management',
      subtitle: 'Manage system access and roles',
      addUser: 'Add User',
      search: 'Search users...',
      role: 'Role',
      status: 'Status',
      actions: 'Actions',
      active: 'Active',
      disabled: 'Disabled',
      formTitle: 'Create New User',
      editTitle: 'Edit User',
      name: 'Full Name',
      email: 'Email',
      phone: 'Phone',
      gender: 'Gender',
      bio: 'Bio',
      cancel: 'Cancel',
      create: 'Create User',
      save: 'Save Changes',
      resetPwd: 'Reset Password',
      toggleStatus: 'Toggle Status',
      edit: 'Edit User',
      confirmReset: 'Are you sure you want to reset the password for',
      pwdResetMsg: 'Temporary password sent to user email.',
      userCreated: 'User created successfully.',
      userUpdated: 'User updated successfully.',
      male: 'Male',
      female: 'Female',
      secret: 'Secret'
    },
    zh: {
      title: '用户管理',
      subtitle: '管理系统访问权限与角色',
      addUser: '添加用户',
      search: '搜索用户...',
      role: '角色',
      status: '状态',
      actions: '操作',
      active: '正常',
      disabled: '已禁用',
      formTitle: '创建新用户',
      editTitle: '编辑用户',
      name: '全名',
      email: '电子邮箱',
      phone: '手机号码',
      gender: '性别',
      bio: '个人简介',
      cancel: '取消',
      create: '创建用户',
      save: '保存更改',
      resetPwd: '重置密码',
      toggleStatus: '切换状态',
      edit: '编辑用户',
      confirmReset: '确定要重置该用户的密码吗？',
      pwdResetMsg: '临时密码已发送至用户邮箱。',
      userCreated: '用户创建成功。',
      userUpdated: '用户更新成功。',
      male: '男',
      female: '女',
      secret: '保密'
    }
  };

  const text = t[language];

  const filteredUsers = allUsers.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
      setNewName('');
      setNewEmail('');
      setNewRole('Expert');
      setNewPhone('');
      setNewGender('secret');
      setNewBio('');
      setShowAddModal(true);
  };

  const openEditModal = (user: UserProfile) => {
      setEditingUser(user);
      setNewName(user.name);
      setNewEmail(user.email);
      setNewRole(user.role);
      setNewPhone(user.phone || '');
      setNewGender(user.gender || 'secret');
      setNewBio(user.bio || '');
      setShowEditModal(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
        await addUser({ 
            name: newName, 
            email: newEmail, 
            role: newRole,
            phone: newPhone,
            gender: newGender,
            bio: newBio
        });
        addToast(text.userCreated, 'success');
        setShowAddModal(false);
    } catch (err) {
        addToast((err as Error).message, 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    
    setLoading(true);
    try {
        await updateUser(editingUser.id, { 
            name: newName, 
            email: newEmail, 
            role: newRole,
            phone: newPhone,
            gender: newGender,
            bio: newBio
        });
        addToast(text.userUpdated, 'success');
        setShowEditModal(false);
        setEditingUser(null);
    } catch (err) {
        addToast((err as Error).message, 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleResetPassword = (userName: string, userId: string) => {
    setConfirmResetData({ name: userName, id: userId });
  };

  const executeResetPassword = async () => {
    if (!confirmResetData) return;
    try {
        await resetUserPassword(confirmResetData.id);
        addToast(text.pwdResetMsg, 'success');
    } catch (err: any) {
        addToast(err.message || 'Failed to reset password', 'error');
    }
    setConfirmResetData(null);
  };

  const getRoleColor = (role: Role) => {
    switch (role) {
      case 'Admin': return 'text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400 border-red-100 dark:border-red-900';
      case 'PM': return 'text-purple-600 bg-purple-50 dark:bg-purple-900/20 dark:text-purple-400 border-purple-100 dark:border-purple-900';
      case 'Dev': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-900';
      default: return 'text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 border-green-100 dark:border-green-900';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="text-indigo-600" />
            {text.title}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{text.subtitle}</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow-lg shadow-indigo-500/20 transition-all font-medium text-sm"
        >
          <UserPlus size={18} />
          {text.addUser}
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
                type="text" 
                placeholder={text.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors text-sm"
            />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">{text.name}</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">{text.role}</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300">{text.status}</th>
                    <th className="px-6 py-4 font-semibold text-gray-600 dark:text-gray-300 text-right">{text.actions}</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group">
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white overflow-hidden shrink-0
                                    ${u.role === 'Admin' ? 'bg-red-500' : u.role === 'PM' ? 'bg-purple-500' : u.role === 'Expert' ? 'bg-green-500' : 'bg-blue-500'}`}>
                                    {u.avatarUrl ? (
                                        <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                                    ) : (
                                        u.avatar
                                    )}
                                </div>
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-slate-100">{u.name}</div>
                                    <div className="text-xs text-gray-500 flex flex-col gap-0.5">
                                        <span className="flex items-center gap-1"><Mail size={10} /> {u.email}</span>
                                        {u.phone && <span className="flex items-center gap-1"><Phone size={10} /> {u.phone}</span>}
                                    </div>
                                </div>
                            </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleColor(u.role)}`}>
                                <Shield size={10} /> {u.role}
                            </span>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                                {u.status === 'active' 
                                    ? <span className="flex items-center gap-1 text-green-600 text-xs font-medium"><CheckCircle size={12} /> {text.active}</span>
                                    : <span className="flex items-center gap-1 text-gray-400 text-xs font-medium"><Ban size={12} /> {text.disabled}</span>
                                }
                            </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                                <button 
                                    onClick={() => openEditModal(u)}
                                    className="p-1.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                                    title={text.edit}
                                >
                                    <Edit size={16} />
                                </button>
                                <button 
                                    onClick={() => handleResetPassword(u.name, u.id)}
                                    className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded transition-colors"
                                    title={text.resetPwd}
                                >
                                    <KeyRound size={16} />
                                </button>
                                <button 
                                    onClick={() => toggleUserStatus(u.id)}
                                    className={`p-1.5 rounded transition-colors ${u.status === 'active' 
                                        ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' 
                                        : 'text-gray-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'}`}
                                    title={text.toggleStatus}
                                >
                                    {u.status === 'active' ? <ShieldOff size={16} /> : <CheckCircle size={16} />}
                                </button>
                             </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{text.formTitle}</h3>
                </div>
                <form onSubmit={handleCreateUser} className="p-6 grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{text.name} *</label>
                        <input 
                            required
                            type="text" 
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{text.email} *</label>
                        <input 
                            required
                            type="email" 
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                     <div className="space-y-2 col-span-2 sm:col-span-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{text.role} *</label>
                        <select
                            value={newRole}
                            onChange={e => setNewRole(e.target.value as Role)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="Admin">Admin</option>
                            <option value="PM">PM</option>
                            <option value="Expert">Expert</option>
                            <option value="Dev">Dev</option>
                        </select>
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{text.phone}</label>
                        <input 
                            type="text" 
                            value={newPhone}
                            onChange={e => setNewPhone(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{text.gender}</label>
                        <select
                            value={newGender}
                            onChange={e => setNewGender(e.target.value as UserProfile['gender'])}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="male">{text.male}</option>
                            <option value="female">{text.female}</option>
                            <option value="secret">{text.secret}</option>
                        </select>
                    </div>
                    <div className="space-y-2 col-span-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{text.bio}</label>
                        <textarea
                            value={newBio}
                            onChange={e => setNewBio(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 col-span-2">
                        <button 
                            type="button" 
                            onClick={() => setShowAddModal(false)}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800 rounded-lg"
                        >
                            {text.cancel}
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md"
                        >
                            {loading ? 'Processing...' : text.create}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-gray-200 dark:border-gray-800">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{text.editTitle}</h3>
                </div>
                <form onSubmit={handleUpdateUser} className="p-6 grid grid-cols-2 gap-4">
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{text.name} *</label>
                        <input 
                            required
                            type="text" 
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{text.email} *</label>
                        <input 
                            required
                            type="email" 
                            value={newEmail}
                            onChange={e => setNewEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                     <div className="space-y-2 col-span-2 sm:col-span-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{text.role} *</label>
                        <select
                            value={newRole}
                            onChange={e => setNewRole(e.target.value as Role)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="Admin">Admin</option>
                            <option value="PM">PM</option>
                            <option value="Expert">Expert</option>
                            <option value="Dev">Dev</option>
                        </select>
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{text.phone}</label>
                        <input 
                            type="text" 
                            value={newPhone}
                            onChange={e => setNewPhone(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                    </div>
                    <div className="space-y-2 col-span-2 sm:col-span-1">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{text.gender}</label>
                        <select
                            value={newGender}
                            onChange={e => setNewGender(e.target.value as UserProfile['gender'])}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                            <option value="male">{text.male}</option>
                            <option value="female">{text.female}</option>
                            <option value="secret">{text.secret}</option>
                        </select>
                    </div>
                    <div className="space-y-2 col-span-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{text.bio}</label>
                        <textarea
                            value={newBio}
                            onChange={e => setNewBio(e.target.value)}
                            rows={3}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                        />
                    </div>

                    <div className="pt-4 flex justify-end gap-3 col-span-2">
                        <button 
                            type="button" 
                            onClick={() => setShowEditModal(false)}
                            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-slate-800 rounded-lg"
                        >
                            {text.cancel}
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading}
                            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md"
                        >
                            {loading ? 'Processing...' : text.save}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
      
      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmResetData}
        onClose={() => setConfirmResetData(null)}
        onConfirm={executeResetPassword}
        title={text.resetPwd}
        message={confirmResetData ? `${text.confirmReset} ${confirmResetData.name}?` : ''}
        confirmText={language === 'zh' ? '确定' : 'Confirm'}
        cancelText={language === 'zh' ? '取消' : 'Cancel'}
        type="warning"
      />
    </div>
  );
};
