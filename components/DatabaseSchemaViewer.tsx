import React, { useState } from 'react';
import { Search, Database, Table as TableIcon, Key, CornerDownRight, Loader2, AlertCircle, FileCode, X } from 'lucide-react';
import { useSchemaViewer } from '../hooks/useSchemaViewer';
import { TableSqlScript } from './database-schema/TableSqlScript';
import { useToast } from '../contexts';

export const DatabaseSchemaViewer: React.FC = () => {
  const { addToast } = useToast();
  const [viewContent, setViewContent] = useState<string | null>(null); // State for modal content

  const {
    t,
    language,
    searchTerm,
    setSearchTerm,
    selectedTable,
    setSelectedTable,
    rightTab,
    setRightTab,
    isLoading,
    error,
    fetchSchema,
    rows,
    rowsPage,
    setRowsPage,
    rowsPageSize,
    setRowsPageSize,
    rowsTotal,
    rowsLoading,
    rowsError,
    filteredTables,
    activeTable
  } = useSchemaViewer();

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black/20 overflow-hidden relative">
      {/* Content Modal */}
      {viewContent && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col border border-gray-200 dark:border-gray-800 animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                    <h3 className="font-semibold text-slate-900 dark:text-white">{t('common.details')}</h3>
                    <button onClick={() => setViewContent(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto whitespace-pre-wrap font-mono text-sm text-slate-600 dark:text-slate-300">
                    {viewContent}
                </div>
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                     <button 
                        onClick={() => {
                            navigator.clipboard.writeText(viewContent);
                            addToast(t('aiAssistant.copied'), 'success');
                        }}
                        className="mr-2 px-4 py-2 text-sm bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/40"
                     >
                        {t('common.copy')}
                     </button>
                     <button 
                        onClick={() => setViewContent(null)}
                        className="px-4 py-2 text-sm bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-700"
                     >
                        {t('common.close')}
                     </button>
                </div>
            </div>
        </div>
      )}

      {/* Header */}
      <div className="px-6 py-4 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-gray-800 shrink-0 flex justify-between items-center">
        <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Database className="text-indigo-600" />
            {t('databaseSchema.title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('databaseSchema.subtitle')}</p>
        </div>
        <div>
            <button 
                onClick={fetchSchema}
                disabled={isLoading}
                className="px-3 py-1.5 text-xs font-medium bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-2"
            >
                {isLoading ? <Loader2 size={12} className="animate-spin" /> : <Database size={12} />}
                {t('databaseSchema.retry')}
            </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Loading Overlay */}
        {isLoading && (
            <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-indigo-600">
                <Loader2 size={40} className="animate-spin mb-4" />
                <p className="font-medium">{t('databaseSchema.loading')}</p>
            </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
            <div className="absolute inset-0 z-40 bg-white dark:bg-slate-900 flex flex-col items-center justify-center p-8">
                <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl max-w-md text-center border border-red-100 dark:border-red-800">
                    <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">{t('databaseSchema.error')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-6">{error}</p>
                    <button 
                        onClick={fetchSchema}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                        {t('databaseSchema.retry')}
                    </button>
                </div>
            </div>
        )}

        {/* Sidebar: Table List */}
        <div className="w-80 bg-white dark:bg-slate-900 border-r border-gray-200 dark:border-gray-800 flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t('databaseSchema.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {filteredTables.length > 0 ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredTables.map(table => {
                   const hasColumnMatch = searchTerm && table.columns.some(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
                   return (
                    <button
                      key={table.name}
                      onClick={() => setSelectedTable(table.name)}
                      className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors flex flex-col gap-1
                        ${selectedTable === table.name ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-600' : 'border-l-4 border-transparent'}
                      `}
                    >
                      <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200 text-sm">
                        <TableIcon size={14} className="text-gray-400" />
                        {table.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate pl-6">{table.comment}</div>
                      {hasColumnMatch && (
                         <div className="pl-6 pt-1">
                            <span className="text-[10px] bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded border border-yellow-200 dark:border-yellow-800 flex items-center gap-1 w-fit">
                               <Key size={10} /> {t('databaseSchema.matchCol')}
                            </span>
                         </div>
                      )}
                    </button>
                   );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 text-sm">
                {!isLoading && !error && t('databaseSchema.noResults')}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-slate-50 dark:bg-black/20">
          {activeTable ? (
            <div className="space-y-6 max-w-5xl mx-auto">
              {/* Table Info Card */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                 <div className="flex items-start gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                       <TableIcon size={24} />
                    </div>
                    <div>
                       <h3 className="text-xl font-bold text-slate-900 dark:text-white font-mono">{activeTable.name}</h3>
                       <p className="text-gray-500 dark:text-gray-400 mt-1">{activeTable.comment}</p>
                    </div>
                 </div>
              </div>

              {/* Right Tabs */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setRightTab('schema')}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${rightTab === 'schema' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800'}`}
                >{t('databaseSchema.schemaTab')}</button>
                <button
                  onClick={() => { setRightTab('data'); setRowsPage(1); }}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${rightTab === 'data' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800'}`}
                >{t('databaseSchema.dataTab')}</button>
                <button
                  onClick={() => setRightTab('script')}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${rightTab === 'script' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-900 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-800'}`}
                >{t('databaseSchema.scriptTab')}</button>
                {rightTab === 'data' && (
                  <div className="ml-auto flex items-center gap-2">
                    <span className="text-xs text-gray-500">{t('databaseSchema.pageSize')}</span>
                    <select
                      value={rowsPageSize}
                      onChange={(e) => { setRowsPageSize(parseInt(e.target.value)); setRowsPage(1); }}
                      className="px-2 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-800 rounded text-xs"
                    >
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </div>
                )}
              </div>

              {rightTab === 'schema' && (
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                 <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/50 font-semibold text-slate-800 dark:text-slate-200">
                    {t('databaseSchema.columns')}
                 </div>
                 <div className="overflow-x-auto">
                   <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                          <th className="px-6 py-3 font-medium">{t('databaseSchema.colName')}</th>
                          <th className="px-6 py-3 font-medium">{t('databaseSchema.colType')}</th>
                          <th className="px-6 py-3 font-medium">{t('databaseSchema.colLen')}</th>
                          <th className="px-6 py-3 font-medium text-center">{t('databaseSchema.colNull')}</th>
                          <th className="px-6 py-3 font-medium text-center">{t('databaseSchema.colPk')}</th>
                          <th className="px-6 py-3 font-medium">{t('databaseSchema.colComment')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {activeTable.columns.map((col, idx) => (
                          <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 ${searchTerm && col.name.toLowerCase().includes(searchTerm.toLowerCase()) ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''}`}>
                            <td className="px-6 py-3 font-mono font-medium text-slate-700 dark:text-slate-300">{col.name}</td>
                            <td className="px-6 py-3 text-indigo-600 dark:text-indigo-400">{col.type}</td>
                            <td className="px-6 py-3 text-gray-500">{col.length || '-'}</td>
                            <td className="px-6 py-3 text-center">
                               {col.nullable ? <span className="text-gray-400">{t('databaseSchema.yes')}</span> : <span className="text-slate-800 dark:text-slate-200 font-bold">{t('databaseSchema.no')}</span>}
                            </td>
                            <td className="px-6 py-3 text-center">
                               {col.pk && <Key size={14} className="inline text-amber-500" />}
                            </td>
                            <td className="px-6 py-3 text-gray-600 dark:text-gray-400">{col.comment}</td>
                          </tr>
                        ))}
                      </tbody>
                  </table>
                 </div>
              </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {rightTab === 'schema' && (
                 <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/50 font-semibold text-slate-800 dark:text-slate-200">
                       {t('databaseSchema.indexes')}
                    </div>
                    {activeTable.indexes.length > 0 ? (
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 border-b border-gray-200 dark:border-gray-700">
                          <tr>
                            <th className="px-6 py-3 font-medium">{t('databaseSchema.idxName')}</th>
                            <th className="px-6 py-3 font-medium">{t('databaseSchema.idxCols')}</th>
                            <th className="px-6 py-3 font-medium text-center">{t('databaseSchema.idxUnique')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {activeTable.indexes.map((idx, i) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                              <td className="px-6 py-3 font-mono text-slate-700 dark:text-slate-300">{idx.name}</td>
                              <td className="px-6 py-3 text-gray-600 dark:text-gray-400">
                                {(() => {
                                  const cols = Array.isArray(idx.columns) 
                                    ? idx.columns 
                                    : (typeof (idx as any).columns === 'string' 
                                        ? (idx as any).columns.replace(/[{}]/g, '').split(',').filter(Boolean) 
                                        : []);
                                  return cols.map((c: string) => (
                                    <span key={c} className="bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs mr-1">{c}</span>
                                  ));
                                })()}
                              </td>
                              <td className="px-6 py-3 text-center">
                                {idx.unique ? <span className="text-green-600 text-xs font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">Unique</span> : <span className="text-gray-400">-</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                     </table>
                   ) : (
                     <div className="p-6 text-center text-gray-400 text-sm">{t('databaseSchema.noIndexes')}</div>
                   )}
                 </div>
                 )}

                 {rightTab === 'schema' && (
                 <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/50 font-semibold text-slate-800 dark:text-slate-200">
                       {t('databaseSchema.foreignKeys')}
                    </div>
                    {activeTable.foreignKeys.length > 0 ? (
                      <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 border-b border-gray-200 dark:border-gray-700">
                          <tr>
                            <th className="px-6 py-3 font-medium">{t('databaseSchema.fkName')}</th>
                            <th className="px-6 py-3 font-medium">{t('databaseSchema.fkCol')}</th>
                            <th className="px-6 py-3 font-medium">{t('databaseSchema.fkRef')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                          {activeTable.foreignKeys.map((fk, i) => (
                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                              <td className="px-6 py-3 font-mono text-slate-700 dark:text-slate-300">{fk.name}</td>
                              <td className="px-6 py-3 font-mono text-indigo-600 dark:text-indigo-400">{fk.column}</td>
                              <td className="px-6 py-3 text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                 <CornerDownRight size={12} className="text-gray-400"/>
                                 <span className="font-mono bg-gray-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-xs">{fk.refTable}.{fk.refColumn}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                     </table>
                   ) : (
                     <div className="p-6 text-center text-gray-400 text-sm">{t('databaseSchema.noForeignKeys')}</div>
                   )}
                 </div>
                 )}

                 {rightTab === 'data' && (
                   <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm md:col-span-2">
                      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-800/50 flex items-center justify-between">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{t('databaseSchema.records')}</div>
                        <div className="text-xs text-gray-500">Page {rowsPage} • Total {rowsTotal}</div>
                      </div>
                      {rowsLoading ? (
                        <div className="p-6 text-center text-gray-400">
                          <Loader2 className="inline animate-spin mr-2" /> {t('common.loading')}
                        </div>
                      ) : rowsError ? (
                        <div className="p-6 text-center text-red-600 text-sm">{rowsError}</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 border-b border-gray-200 dark:border-gray-700">
                              <tr>
                                {(rows[0] ? Object.keys(rows[0]) : []).map((k) => (
                                  <th key={k} className="px-6 py-3 font-medium">{k}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                              {rows.map((r, i) => (
                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-slate-800/50">
                                  {(rows[0] ? Object.keys(rows[0]) : []).map((k) => {
                                    const val = r[k] === null || r[k] === undefined ? '' : String(r[k]);
                                    const isLong = val.length > 100;
                                    return (
                                        <td key={k} className="px-6 py-3 text-slate-700 dark:text-slate-300 max-w-[300px]">
                                        {isLong ? (
                                            <div className="flex items-center gap-2">
                                                <span className="truncate block">{val.slice(0, 100)}...</span>
                                                <button 
                                                    onClick={() => setViewContent(val)}
                                                    className="text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 whitespace-nowrap"
                                                >
                                                    [{t('common.details') || 'View'}]
                                                </button>
                                            </div>
                                        ) : (
                                            val
                                        )}
                                        </td>
                                    );
                                  })}
                                </tr>
                              ))}
                              {rows.length === 0 && (
                                <tr><td className="px-6 py-6 text-center text-gray-400" colSpan={999}>{t('databaseSchema.noData')}</td></tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-end gap-2">
                        <button
                          onClick={() => { if (rowsPage > 1) { setRowsPage(rowsPage - 1); } }}
                          disabled={rowsPage <= 1}
                          className="px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded disabled:opacity-50"
                        >{t('databaseSchema.prev')}</button>
                        <button
                          onClick={() => { const maxPage = Math.max(1, Math.ceil(rowsTotal / rowsPageSize)); if (rowsPage < maxPage) setRowsPage(rowsPage + 1); }}
                          disabled={rowsPage >= Math.max(1, Math.ceil(rowsTotal / rowsPageSize))}
                          className="px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 rounded disabled:opacity-50"
                        >{t('databaseSchema.next')}</button>
                      </div>
                   </div>
                 )}
                 
                 {rightTab === 'script' && (
                    <div className="md:col-span-2 h-[calc(100vh-300px)] min-h-[500px]">
                        <TableSqlScript 
                            table={activeTable as any} 
                            t={t}
                            onCopy={(text) => {
                                navigator.clipboard.writeText(text);
                                addToast(t('aiAssistant.copied'), 'success');
                            }}
                        />
                    </div>
                 )}
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
               <Database size={48} className="mb-4 text-indigo-100 dark:text-indigo-900/30" />
               <p>{t('databaseSchema.selectPrompt')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
