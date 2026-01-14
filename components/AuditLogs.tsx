
import React, { useCallback, useState } from 'react';
import { 
  ClipboardList, AlertTriangle, Search,
  CheckCircle, XCircle, Monitor, User, AlertOctagon, Eye, X, Trash2
} from 'lucide-react';
import { useAuth, useSettings, useToast } from '../contexts';
import { api } from '../client';
import { SystemErrorLogEntry, AuditLogEntry } from '../types';

export const AuditLogs: React.FC = () => {
  const { language, formatTime } = useSettings();
  const { canManageUsers } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'activity' | 'errors'>('activity');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedError, setSelectedError] = useState<SystemErrorLogEntry | null>(null);
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [errors, setErrors] = useState<SystemErrorLogEntry[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showClearErrorsConfirm, setShowClearErrorsConfirm] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearingErrors, setClearingErrors] = useState(false);

  const fetchInitial = useCallback(async () => {
      try {
          const [auditRes, sysErrors] = await Promise.all([
              api.logs.getAuditCursor(pageSize),
              api.logs.getSystemErrors()
          ]);
          setLogs(auditRes.items || []);
          setCursor(auditRes.nextCursor || null);
          setHasMore(!!auditRes.hasMore);
          setErrors(sysErrors);
          setPage(1);
      } catch (error) {
          console.error('Failed to fetch logs:', error);
      }
  }, [pageSize]);

  React.useEffect(() => {
      fetchInitial();
  }, [fetchInitial]);

  const loadMore = async () => {
      if (loadingMore || !hasMore) return;
      try {
          setLoadingMore(true);
          const res = await api.logs.getAuditCursor(pageSize, cursor || undefined);
          setLogs(prev => [...prev, ...(res.items || [])]);
          setCursor(res.nextCursor || null);
          setHasMore(!!res.hasMore);
          setPage(prev => prev + 1);
      } catch (error) {
          console.error('Failed to load more logs:', error);
      } finally {
          setLoadingMore(false);
      }
  };

  const t = {
    en: {
      title: 'Audit Logs',
      subtitle: 'Monitor user activities and system health',
      tabActivity: 'User Activity',
      tabErrors: 'System Errors',
      searchActivity: 'Search by user, action, or module...',
      searchErrors: 'Search by error message or code...',
      colTime: 'Timestamp',
      colUser: 'User',
      colModule: 'Module',
      colAction: 'Action',
      colStatus: 'Status',
      colIP: 'IP Address',
      colCode: 'Code',
      colMessage: 'Error Message',
      colRoute: 'Route',
      colBrowser: 'Environment',
      view: 'View',
      detailsTitle: 'Error Details',
      stackTrace: 'Stack Trace',
      close: 'Close',
      statusSuccess: 'Success',
      statusFailed: 'Failed',
      statusOpen: 'Open',
      statusResolved: 'Resolved',
      statusIgnored: 'Ignored',
      noLogs: 'No logs found matching your criteria.',
      clear: 'Clear Logs',
      clearTitle: 'Clear audit logs?',
      clearDesc: 'This will delete all user activity logs. This action cannot be undone.',
      clearErrors: 'Clear Errors',
      clearErrorsTitle: 'Clear system errors?',
      clearErrorsDesc: 'This will delete all system error logs. This action cannot be undone.',
      cancel: 'Cancel',
      confirm: 'Confirm',
      cleared: 'Audit logs cleared',
      clearedErrors: 'System errors cleared',
      clearFailed: 'Failed to clear audit logs'
    },
    zh: {
      title: '审计日志',
      subtitle: '监控用户行为与系统健康状态',
      tabActivity: '用户行为日志',
      tabErrors: '系统错误日志',
      searchActivity: '搜索用户、动作或模块...',
      searchErrors: '搜索错误信息或代码...',
      colTime: '时间',
      colUser: '用户',
      colModule: '模块',
      colAction: '动作',
      colStatus: '状态',
      colIP: 'IP 地址',
      colCode: '错误码',
      colMessage: '错误信息',
      colRoute: '路由 API',
      colBrowser: '环境信息',
      view: '查看',
      detailsTitle: '错误详情',
      stackTrace: '堆栈信息',
      close: '关闭',
      statusSuccess: '成功',
      statusFailed: '失败',
      statusOpen: '未处理',
      statusResolved: '已解决',
      statusIgnored: '已忽略',
      noLogs: '未找到匹配的日志记录。',
      clear: '清空日志',
      clearTitle: '确认清空用户行为日志？',
      clearDesc: '该操作会删除全部用户行为日志，且无法恢复。',
      clearErrors: '清空错误',
      clearErrorsTitle: '确认清空系统错误日志？',
      clearErrorsDesc: '该操作会删除全部系统错误日志，且无法恢复。',
      cancel: '取消',
      confirm: '确认',
      cleared: '已清空用户行为日志',
      clearedErrors: '已清空系统错误日志',
      clearFailed: '清空日志失败'
    }
  }[language];

  const filteredActivity = (logs || []).filter(log => 
    log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.module.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredErrors = (errors || []).filter(err => 
    err.errorMessage.toLowerCase().includes(searchTerm.toLowerCase()) ||
    err.errorCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black/20 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <ClipboardList className="text-indigo-600" />
          {t.title}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t.subtitle}</p>
      </div>

      {/* Toolbar & Tabs */}
      <div className="px-6 py-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
         <div className="flex bg-white dark:bg-slate-900 rounded-lg p-1 border border-gray-200 dark:border-gray-800 shadow-sm w-full sm:w-auto">
            <button
              onClick={() => { setActiveTab('activity'); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 sm:flex-none justify-center
                ${activeTab === 'activity' 
                  ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
            >
               <User size={16} /> {t.tabActivity}
            </button>
            <button
              onClick={() => { setActiveTab('errors'); setSearchTerm(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all flex-1 sm:flex-none justify-center
                ${activeTab === 'errors' 
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' 
                  : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-slate-800'
                }`}
            >
               <AlertTriangle size={16} /> {t.tabErrors}
            </button>
         </div>

         <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
               type="text" 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               placeholder={activeTab === 'activity' ? t.searchActivity : t.searchErrors}
               className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
            />
         </div>
         <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Page Size</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(parseInt(e.target.value))}
              className="px-2 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded text-xs"
            >
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            {activeTab === 'activity' && canManageUsers && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="ml-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                <Trash2 size={14} />
                {t.clear}
              </button>
            )}
            {activeTab === 'errors' && canManageUsers && (
              <button
                onClick={() => setShowClearErrorsConfirm(true)}
                className="ml-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                <Trash2 size={14} />
                {t.clearErrors}
              </button>
            )}
         </div>
      </div>

      {/* Content Table */}
      <div className="flex-1 overflow-auto px-6 pb-6 custom-scrollbar">
         <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
            {activeTab === 'activity' ? (
               <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 font-medium border-b border-gray-200 dark:border-gray-700">
                     <tr>
                        <th className="px-6 py-4">{t.colTime}</th>
                        <th className="px-6 py-4">{t.colUser}</th>
                        <th className="px-6 py-4">{t.colAction}</th>
                        <th className="px-6 py-4">{t.colModule}</th>
                        <th className="px-6 py-4">{t.colIP}</th>
                        <th className="px-6 py-4 text-right">{t.colStatus}</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                     {filteredActivity.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                           <td className="px-6 py-4 text-gray-500 font-mono text-xs whitespace-nowrap">
                              {formatTime(log.timestamp)}
                           </td>
                           <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">
                              {log.userName}
                           </td>
                           <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                              {log.action}
                              <div className="text-xs text-gray-400 mt-0.5 max-w-xs truncate">{log.details}</div>
                           </td>
                           <td className="px-6 py-4">
                              <span className="px-2 py-1 bg-gray-100 dark:bg-slate-800 rounded text-xs text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                                 {log.module}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-gray-500 font-mono text-xs">
                              {log.ip}
                           </td>
                           <td className="px-6 py-4 text-right">
                              {log.status === 'success' ? (
                                 <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full text-xs font-medium">
                                    <CheckCircle size={12} /> {t.statusSuccess}
                                 </span>
                              ) : (
                                 <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full text-xs font-medium">
                                    <XCircle size={12} /> {t.statusFailed}
                                 </span>
                              )}
                           </td>
                        </tr>
                     ))}
                     {filteredActivity.length === 0 && (
                        <tr>
                           <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                              {t.noLogs}
                           </td>
                        </tr>
                     )}
                     {filteredActivity.length > 0 && hasMore && (
                        <tr>
                           <td colSpan={6} className="px-6 py-4 text-center">
                              <button
                                 onClick={loadMore}
                                 disabled={loadingMore}
                                 className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                              >
                                 {loadingMore ? 'Loading...' : 'Load More'}
                              </button>
                           </td>
                        </tr>
                     )}
                     {filteredActivity.length > 0 && (
                        <tr>
                           <td colSpan={6} className="px-6 py-4">
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                 <div>Page {page}</div>
                                 <div className="flex items-center gap-2">
                                    <button
                                       onClick={() => {
                                         if (page <= 1) return;
                                         const targetLen = (page - 1) * pageSize;
                                         setLogs(prev => prev.slice(0, targetLen));
                                         setPage(page - 1);
                                       }}
                                       disabled={page <= 1}
                                       className="px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded disabled:opacity-50"
                                    >
                                       Prev
                                    </button>
                                    <button
                                       onClick={loadMore}
                                       disabled={loadingMore || !hasMore}
                                       className="px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded disabled:opacity-50"
                                    >
                                       Next
                                    </button>
                                 </div>
                              </div>
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            ) : (
               <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 font-medium border-b border-gray-200 dark:border-gray-700">
                     <tr>
                        <th className="px-6 py-4">{t.colTime}</th>
                        <th className="px-6 py-4">{t.colCode}</th>
                        <th className="px-6 py-4 w-1/3">{t.colMessage}</th>
                        <th className="px-6 py-4">{t.colRoute}</th>
                        <th className="px-6 py-4">{t.colStatus}</th>
                        <th className="px-6 py-4 text-right"></th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                     {filteredErrors.map(err => (
                        <tr key={err.id} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                           <td className="px-6 py-4 text-gray-500 font-mono text-xs whitespace-nowrap">
                              {formatTime(err.timestamp)}
                           </td>
                           <td className="px-6 py-4">
                              <span className="font-mono text-red-600 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded text-xs font-bold">
                                 {err.errorCode}
                              </span>
                           </td>
                           <td className="px-6 py-4">
                              <div className="text-slate-700 dark:text-slate-200 font-medium truncate max-w-sm" title={err.errorMessage}>
                                 {err.errorMessage}
                              </div>
                              <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                                 {err.userName && <span className="flex items-center gap-1"><User size={10}/> {err.userName}</span>}
                                 {err.browser && <span className="flex items-center gap-1 ml-2"><Monitor size={10}/> {err.browser}</span>}
                              </div>
                           </td>
                           <td className="px-6 py-4 font-mono text-xs text-gray-500">
                              {err.route}
                           </td>
                           <td className="px-6 py-4">
                              {err.status === 'open' && <span className="text-red-500 text-xs font-bold">{t.statusOpen}</span>}
                              {err.status === 'resolved' && <span className="text-green-500 text-xs font-medium">{t.statusResolved}</span>}
                              {err.status === 'ignored' && <span className="text-gray-400 text-xs">{t.statusIgnored}</span>}
                           </td>
                           <td className="px-6 py-4 text-right">
                              <button 
                                 onClick={() => setSelectedError(err)}
                                 className="p-1.5 hover:bg-gray-100 dark:hover:bg-slate-800 rounded text-gray-400 hover:text-indigo-600 transition-colors"
                                 title={t.view}
                              >
                                 <Eye size={16} />
                              </button>
                           </td>
                        </tr>
                     ))}
                     {filteredErrors.length === 0 && (
                        <tr>
                           <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                              {t.noLogs}
                           </td>
                        </tr>
                     )}
                  </tbody>
               </table>
            )}
         </div>
      </div>

      {/* Error Details Modal */}
      {selectedError && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
               <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-red-50 dark:bg-red-900/20 rounded-t-xl">
                  <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                     <AlertOctagon size={20} />
                     {t.detailsTitle}
                  </h3>
                  <button onClick={() => setSelectedError(null)} className="text-gray-400 hover:text-gray-600">
                     <X size={20} />
                  </button>
               </div>
               <div className="p-6 overflow-y-auto custom-scrollbar">
                  <div className="space-y-4">
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">{t.colMessage}</label>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mt-1">{selectedError.errorMessage}</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">{t.colCode}</label>
                           <p className="text-sm font-mono text-slate-700 dark:text-slate-300 mt-1">{selectedError.errorCode}</p>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">{t.colTime}</label>
                           <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{formatTime(selectedError.timestamp)}</p>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">{t.colRoute}</label>
                           <p className="text-sm font-mono text-slate-700 dark:text-slate-300 mt-1">{selectedError.route}</p>
                        </div>
                        <div>
                           <label className="text-xs font-bold text-gray-500 uppercase">{t.colUser}</label>
                           <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{selectedError.userName || '-'}</p>
                        </div>
                     </div>
                     <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">{t.stackTrace}</label>
                        <div className="mt-2 bg-gray-50 dark:bg-black/40 p-4 rounded-lg border border-gray-200 dark:border-gray-800 overflow-x-auto">
                           <pre className="text-xs font-mono text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                              {selectedError.stackTrace || 'No stack trace available.'}
                           </pre>
                        </div>
                     </div>
                  </div>
               </div>
               <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end">
                  <button 
                     onClick={() => setSelectedError(null)}
                     className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                     {t.close}
                  </button>
               </div>
            </div>
         </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-red-50 dark:bg-red-900/20">
              <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle size={18} />
                {t.clearTitle}
              </h3>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={clearing}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-700 dark:text-slate-200">{t.clearDesc}</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                disabled={clearing}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={async () => {
                  try {
                    setClearing(true);
                    await api.logs.clearAudit();
                    addToast(t.cleared, 'success');
                    setShowClearConfirm(false);
                    await fetchInitial();
                  } catch (e) {
                    console.error(e);
                    addToast(t.clearFailed, 'error');
                  } finally {
                    setClearing(false);
                  }
                }}
                disabled={clearing}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearErrorsConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-red-50 dark:bg-red-900/20">
              <h3 className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                <AlertTriangle size={18} />
                {t.clearErrorsTitle}
              </h3>
              <button
                onClick={() => setShowClearErrorsConfirm(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={clearingErrors}
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm text-slate-700 dark:text-slate-200">{t.clearErrorsDesc}</p>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-2">
              <button
                onClick={() => setShowClearErrorsConfirm(false)}
                disabled={clearingErrors}
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
              >
                {t.cancel}
              </button>
              <button
                onClick={async () => {
                  try {
                    setClearingErrors(true);
                    await api.logs.clearSystemErrors();
                    addToast(t.clearedErrors, 'success');
                    setShowClearErrorsConfirm(false);
                    await fetchInitial();
                  } catch (e) {
                    console.error(e);
                    addToast(t.clearFailed, 'error');
                  } finally {
                    setClearingErrors(false);
                  }
                }}
                disabled={clearingErrors}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
