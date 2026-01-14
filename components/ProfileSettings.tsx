import React, { useState } from 'react';
import { User, Mail, Globe, Clock, Monitor, Save, Shield, Phone, MessageSquare, Image as ImageIcon } from 'lucide-react';
import { useAuth, useSettings, useToast } from '../contexts';
import { useTranslation } from '../hooks/useTranslation';
import { Role, UserProfile } from '../types';
import { TIMEZONES } from '../constants';

export const ProfileSettings: React.FC = () => {
  const { user, updateProfile, switchRole } = useAuth();
  const { theme, setTheme, language, setLanguage, timezoneOffset, setTimezoneOffset } = useSettings();
  const { t } = useTranslation();
  const { addToast } = useToast();

  const [name, setName] = useState(user.name);
  const [role, setRole] = useState<Role>(user.role);
  const [phone, setPhone] = useState(user.phone || '');
  const [gender, setGender] = useState<UserProfile['gender']>(user.gender || 'secret');
  const [bio, setBio] = useState(user.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');

  const handleSave = async () => {
    try {
        await updateProfile({ name, role, phone, gender, bio, avatarUrl });
        switchRole(role); 
        addToast(t('profile.savedMsg'), 'success');
    } catch (err) {
        addToast('Failed to save settings: ' + (err as Error).message, 'error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {t('profile.title')}
        </h2>
        <p className="text-gray-500 dark:text-gray-400">
          {t('profile.subtitle')}
        </p>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/50 flex flex-col md:flex-row items-center gap-6">
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold text-white shadow-lg shrink-0 overflow-hidden
            ${role === 'Admin' ? 'bg-red-500' : role === 'PM' ? 'bg-purple-500' : role === 'Expert' ? 'bg-green-500' : 'bg-blue-500'}`}>
            {avatarUrl ? (
                <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
            ) : (
                user.avatar
            )}
          </div>
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h3>
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800">
                <Shield size={12} />
                {role}
                </span>
                <span className="text-sm text-gray-500">{user.email}</span>
            </div>
            {bio && <p className="text-sm text-gray-500 mt-2 max-w-lg">{bio}</p>}
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Display Name */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.displayName')}</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Email (Read only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.email')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="email"
                value={user.email} // Use live email
                disabled
                className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.phone')}</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors text-gray-900 dark:text-white"
                placeholder="+1 234 567 8900"
              />
            </div>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.gender')}</label>
            <div className="relative">
               {/* Just a div for consistent spacing if needed, but select typically handles it */}
               <select
                 value={gender}
                 onChange={(e) => setGender(e.target.value as UserProfile['gender'])}
                 className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors text-gray-900 dark:text-white appearance-none cursor-pointer"
               >
                  <option value="male">{t('profile.male')}</option>
                  <option value="female">{t('profile.female')}</option>
                  <option value="secret">{t('profile.secret')}</option>
               </select>
            </div>
          </div>

          {/* Avatar URL */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.avatarUrl')}</label>
            <div className="relative">
              <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors text-gray-900 dark:text-white"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.bio')}</label>
            <div className="relative">
              <MessageSquare className="absolute left-3 top-4 text-gray-400" size={16} />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors text-gray-900 dark:text-white resize-none"
                placeholder="Tell us about yourself..."
              />
            </div>
          </div>

           {/* Role Switcher */}
           <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('profile.role')}</label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                disabled={user.role !== 'Admin'}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors text-gray-900 dark:text-white appearance-none cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <option value="Admin">{t('profile.roleAdmin')}</option>
                <option value="PM">{t('profile.rolePM')}</option>
                <option value="Expert">{t('profile.roleExpert')}</option>
                <option value="Dev">{t('profile.roleDev')}</option>
              </select>
            </div>
          </div>
        </div>
        
        <div className="px-6 pb-6 pt-2 flex justify-end border-t border-gray-100 dark:border-gray-800">
            <button
                onClick={handleSave}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-medium shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
                <Save size={18} />
                {t('profile.save')}
            </button>
        </div>
      </div>

      {/* Preferences */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            {t('profile.preferences')}
        </h3>
        <div className="space-y-6">
          
          {/* Language */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                <Globe size={20} />
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-white">{t('profile.langTitle')}</div>
                <div className="text-xs text-gray-500">{t('profile.langDesc')}</div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${language === 'en' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('zh')}
                className={`px-3 py-1.5 text-sm rounded-md transition-colors ${language === 'zh' ? 'bg-indigo-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                中文
              </button>
            </div>
          </div>

          {/* Theme */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                <Monitor size={20} />
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-white">{t('profile.themeTitle')}</div>
                <div className="text-xs text-gray-500">{t('profile.themeDesc')}</div>
              </div>
            </div>
            <div className="flex gap-2 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
              <button
                onClick={() => setTheme('light')}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
              >
                {t('profile.light')}
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
              >
                {t('profile.dark')}
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
              >
                {t('profile.system')}
              </button>
            </div>
          </div>

          {/* Timezone */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg">
                <Clock size={20} />
              </div>
              <div>
                <div className="font-medium text-slate-900 dark:text-white">{t('profile.tzTitle')}</div>
                <div className="text-xs text-gray-500">{t('profile.tzDesc')}</div>
              </div>
            </div>
            <select
              value={timezoneOffset}
              onChange={(e) => setTimezoneOffset(Number(e.target.value))}
              className="bg-gray-100 dark:bg-slate-800 border-none text-sm rounded-lg px-4 py-2 text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
               {TIMEZONES.map((tz) => (
                <option key={tz.label} value={tz.offset}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>

        </div>
      </div>

    </div>
  );
};
