import React, { useCallback, useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Plus, Search, Tag, X, Sparkles, MessageSquare, Send, Loader2 } from 'lucide-react';
import { useAuth, useIntegration, useSettings, useToast } from '../../contexts';
import { api } from '../../client';
import { AIService } from '../../services/ai';
import { BusinessRequirement, BusinessRequirementComment } from '../../types';
import DOMPurify from 'dompurify';
import { RichTextEditor } from '../common/RichTextEditor';

export const BusinessReqTab: React.FC<{ moduleId: string; moduleName: string }> = ({ moduleId, moduleName }) => {
  const { user } = useAuth();
  const { llmConfig } = useIntegration();
  const { language, formatTime } = useSettings();
  const { addToast } = useToast();

  const t = (key: string) => {
    const dict: Record<string, { en: string; zh: string }> = {
      title: { en: 'Business Requirements', zh: '业务需求' },
      add: { en: 'Add', zh: '新增' },
      searchPlaceholder: { en: 'Search title/content...', zh: '搜索标题/内容...' },
      tagsPlaceholder: { en: 'Filter tags (comma-separated)', zh: '标签筛选（逗号分隔）' },
      empty: { en: 'No requirements yet.', zh: '暂无需求记录' },
      loadMore: { en: 'Load more', zh: '加载更多' },
      loading: { en: 'Loading...', zh: '加载中...' },
      detail: { en: 'Requirement Detail', zh: '需求详情' },
      selectHint: { en: 'Select a requirement from the list.', zh: '请从左侧列表选择一条需求' },
      createTitle: { en: 'Create Requirement', zh: '新增需求' },
      reqTitle: { en: 'Title', zh: '标题' },
      proposer: { en: 'Proposer', zh: '需求提出人' },
      priority: { en: 'Priority', zh: '优先级' },
      reqContent: { en: 'Content', zh: '内容' },
      reqTags: { en: 'Tags', zh: '标签' },
      aiExtract: { en: 'AI Extract Tags', zh: 'AI 提取标签' },
      save: { en: 'Save', zh: '保存' },
      cancel: { en: 'Cancel', zh: '取消' },
      saving: { en: 'Saving...', zh: '保存中...' },
      extracting: { en: 'Extracting...', zh: '提取中...' },
      comments: { en: 'Comments', zh: '评论' },
      reply: { en: 'Reply', zh: '回复' },
      send: { en: 'Send', zh: '发送' },
      commentPlaceholder: { en: 'Write a comment...', zh: '输入评论...' },
      commentFailed: { en: 'Failed to post comment', zh: '发布评论失败' },
      createFailed: { en: 'Failed to create requirement', zh: '新增需求失败' },
      fetchFailed: { en: 'Failed to load requirements', zh: '加载需求失败' },
      extractFailed: { en: 'Failed to extract tags', zh: '提取标签失败' },
    };
    return dict[key] ? dict[key][language] : key;
  };

  const pageSize = 20;
  const commentPageSize = 30;

  const [items, setItems] = useState<BusinessRequirement[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tagFilterInput, setTagFilterInput] = useState('');
  const tagFilters = useMemo(() => tagFilterInput.split(',').map(s => s.trim()).filter(Boolean), [tagFilterInput]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<BusinessRequirement | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [comments, setComments] = useState<BusinessRequirementComment[]>([]);
  const [commentCursor, setCommentCursor] = useState<string | null>(null);
  const [commentHasMore, setCommentHasMore] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [postingComment, setPostingComment] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<BusinessRequirementComment | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createTitle, setCreateTitle] = useState('');
  const [createProposerName, setCreateProposerName] = useState(user?.name || '');
  const [createPriority, setCreatePriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [createContent, setCreateContent] = useState('');
  const [createTagsInput, setCreateTagsInput] = useState('');
  const createTags = useMemo(() => createTagsInput.split(',').map(s => s.trim()).filter(Boolean), [createTagsInput]);
  const [creating, setCreating] = useState(false);
  const [extracting, setExtracting] = useState(false);

  const closeDetail = useCallback(() => {
    setSelectedId(null);
    setDetail(null);
    setComments([]);
    setCommentCursor(null);
    setCommentHasMore(false);
    setReplyTo(null);
    setCommentText('');
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDetail();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [selectedId, closeDetail]);

  useEffect(() => {
    if (!selectedId) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [selectedId]);

  const resetList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.businessReq.getCursor(moduleId, pageSize, undefined, { q, tags: tagFilters, status: statusFilter || undefined });
      const list = (res?.items || []) as BusinessRequirement[];
      setItems(list);
      setCursor(res?.nextCursor || null);
      setHasMore(!!res?.hasMore);
    } catch (e) {
      console.error(e);
      setItems([]);
      setCursor(null);
      setHasMore(false);
      addToast(t('fetchFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, moduleId, q, statusFilter, tagFilters]);

  useEffect(() => {
    resetList();
    setSelectedId(null);
    setDetail(null);
    setComments([]);
    setCommentCursor(null);
    setCommentHasMore(false);
    setReplyTo(null);
    setCommentText('');
  }, [moduleId, resetList]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !cursor || loading) return;
    setLoading(true);
    try {
      const res = await api.businessReq.getCursor(moduleId, pageSize, cursor, { q, tags: tagFilters, status: statusFilter || undefined });
      const next = (res?.items || []) as BusinessRequirement[];
      setItems(prev => [...prev, ...next]);
      setCursor(res?.nextCursor || null);
      setHasMore(!!res?.hasMore);
    } catch (e) {
      console.error(e);
      addToast(t('fetchFailed'), 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast, cursor, hasMore, loading, moduleId, q, statusFilter, tagFilters]);

  const fetchDetail = useCallback(async (id: string) => {
    setSelectedId(id);
    setLoadingDetail(true);
    try {
      const data = await api.businessReq.get(id);
      setDetail(data as BusinessRequirement);
      setComments([]);
      setCommentCursor(null);
      setCommentHasMore(false);
      setReplyTo(null);
      setCommentText('');
      setTimeout(() => void fetchCommentsInitial(id), 0);
    } catch (e) {
      console.error(e);
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }, []);

  const fetchCommentsInitial = useCallback(async (id: string) => {
    setLoadingComments(true);
    try {
      const res = await api.businessReq.getCommentsCursor(id, commentPageSize);
      const list = (res?.items || []) as BusinessRequirementComment[];
      const asc = [...list].reverse();
      setComments(asc);
      setCommentCursor(res?.nextCursor || null);
      setCommentHasMore(!!res?.hasMore);
    } catch (e) {
      console.error(e);
      setComments([]);
      setCommentCursor(null);
      setCommentHasMore(false);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  const loadMoreComments = useCallback(async () => {
    if (!selectedId || !commentHasMore || !commentCursor || loadingComments) return;
    setLoadingComments(true);
    try {
      const res = await api.businessReq.getCommentsCursor(selectedId, commentPageSize, commentCursor);
      const list = (res?.items || []) as BusinessRequirementComment[];
      const asc = [...list].reverse();
      setComments(prev => [...asc, ...prev]);
      setCommentCursor(res?.nextCursor || null);
      setCommentHasMore(!!res?.hasMore);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComments(false);
    }
  }, [commentCursor, commentHasMore, loadingComments, selectedId]);

  const postComment = useCallback(async () => {
    if (!selectedId) return;
    const content = commentText.trim();
    if (!content || postingComment) return;
    try {
      setPostingComment(true);
      const created = await api.businessReq.addComment(selectedId, content, replyTo?.id ?? null, user.avatar);
      setCommentText('');
      setReplyTo(null);
      setComments(prev => [...prev, created as BusinessRequirementComment]);
    } catch (e) {
      console.error(e);
      addToast(t('commentFailed'), 'error');
    } finally {
      setPostingComment(false);
    }
  }, [addToast, commentText, postingComment, replyTo?.id, selectedId, user.avatar]);

  const parseTagsFromAI = (raw: string): string[] => {
    const text = String(raw || '').trim();
    const match = text.match(/\[[\s\S]*\]/);
    const json = match ? match[0] : text;
    try {
      const arr = JSON.parse(json);
      if (Array.isArray(arr)) return arr.map(v => String(v).trim()).filter(Boolean).slice(0, 8);
    } catch {
    }
    return text
      .replace(/[\n\r]/g, ',')
      .split(',')
      .map(s => s.replace(/^[-•\s]+/, '').trim())
      .filter(Boolean)
      .slice(0, 8);
  };

  const fallbackTags = (title: string, content: string): string[] => {
    const source = `${title}\n${content}`;
    const tokens = [
      ...(source.match(/[\u4e00-\u9fa5]{2,}/g) || []),
      ...(source.match(/[A-Za-z][A-Za-z0-9_-]{2,}/g) || [])
    ];
    const stop = new Set(['需求', '业务', '功能', '模块', '接口', '页面', '数据', '系统', '用户', '支持', '实现']);
    const uniq: string[] = [];
    for (const tok of tokens) {
      const v = tok.trim();
      if (!v || stop.has(v)) continue;
      if (!uniq.includes(v)) uniq.push(v);
      if (uniq.length >= 8) break;
    }
    return uniq.length > 0 ? uniq : ['业务', '需求'];
  };

  const extractTags = useCallback(async () => {
    const title = createTitle.trim();
    const content = createContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!title && !content) return;
    setExtracting(true);
    try {
      if (llmConfig?.apiKey) {
        const ai = new AIService(llmConfig as any);
        const systemPrompt = language === 'zh'
          ? '你是资深业务分析师。请从需求标题与内容中提取 3~8 个短标签（中文优先），用于检索与分类。只返回 JSON 数组，例如 ["标签1","标签2"]，不要输出其他文字。'
          : 'You are a senior business analyst. Extract 3-8 short tags from the requirement title and content. Return ONLY a JSON array like ["tag1","tag2"].';
        const userPrompt = `Title:\n${title}\n\nContent:\n${content}`;
        const out = await ai.generateContent(systemPrompt, userPrompt, []);
        const tags = parseTagsFromAI(out);
        if (tags.length > 0) setCreateTagsInput(tags.join(', '));
        else setCreateTagsInput(fallbackTags(title, content).join(', '));
      } else {
        setCreateTagsInput(fallbackTags(title, content).join(', '));
      }
    } catch (e) {
      console.error(e);
      setCreateTagsInput(fallbackTags(title, content).join(', '));
      addToast(t('extractFailed'), 'error');
    } finally {
      setExtracting(false);
    }
  }, [addToast, createContent, createTitle, language, llmConfig]);

  const createReq = useCallback(async () => {
    const title = createTitle.trim();
    if (!title || creating) return;
    setCreating(true);
    try {
      await api.businessReq.create(moduleId, title, createContent, createTags, createPriority, createProposerName.trim() || user.name, user.avatar);
      setShowCreate(false);
      setCreateTitle('');
      setCreateProposerName(user?.name || '');
      setCreatePriority('medium');
      setCreateContent('');
      setCreateTagsInput('');
      await resetList();
    } catch (e) {
      console.error(e);
      addToast(t('createFailed'), 'error');
    } finally {
      setCreating(false);
    }
  }, [addToast, createContent, createPriority, createProposerName, createTags, createTitle, creating, moduleId, resetList, user?.name, user.avatar]);

  const commentTree = useMemo(() => {
    const byParent = new Map<string, BusinessRequirementComment[]>();
    const roots: BusinessRequirementComment[] = [];
    for (const c of comments) {
      const pid = c.parentId ? String(c.parentId) : '';
      if (!pid) {
        roots.push(c);
      } else {
        const arr = byParent.get(pid) || [];
        arr.push(c);
        byParent.set(pid, arr);
      }
    }
    return { roots, byParent };
  }, [comments]);

  const renderComment = useCallback((c: BusinessRequirementComment, depth: number) => {
    const children = commentTree.byParent.get(String(c.id)) || [];
    const pad = Math.min(depth, 6) * 14;
    return (
      <div key={c.id} className="rounded-2xl border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-slate-950 p-4 shadow-sm" style={{ marginLeft: pad }}>
        <div className="flex items-center justify-between">
          <div className="text-xs text-gray-500">
            <span className="font-semibold text-slate-700 dark:text-slate-200">{c.userName}</span> · {formatTime(c.createdAt)}
          </div>
          <button
            onClick={() => setReplyTo(c)}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            {t('reply')}
          </button>
        </div>
        <div className="mt-2 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{c.content}</div>
        {children.length > 0 && (
          <div className="mt-3 space-y-3">
            {children.map(child => renderComment(child, depth + 1))}
          </div>
        )}
      </div>
    );
  }, [commentTree.byParent, formatTime, t]);

  const formatReqCode = useCallback((id: string) => {
    const n = Number(id);
    const suffix = Number.isFinite(n) ? String(n).padStart(4, '0') : String(id);
    const yy = new Date().getFullYear();
    return `BR-${yy}-${suffix}`;
  }, []);

  const statusMeta = useCallback((status: string) => {
    const map: Record<string, { zh: string; en: string; cls: string }> = {
      open: { zh: '待处理', en: 'Open', cls: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
      in_progress: { zh: '处理中', en: 'In progress', cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
      done: { zh: '已完成', en: 'Done', cls: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' },
      closed: { zh: '已关闭', en: 'Closed', cls: 'bg-gray-500/10 text-gray-600 border-gray-500/20' }
    };
    const v = map[status] || map.open;
    return { label: language === 'zh' ? v.zh : v.en, cls: v.cls };
  }, [language]);

  const priorityMeta = useCallback((p: string) => {
    const map: Record<string, { zh: string; en: string; cls: string }> = {
      low: { zh: '低', en: 'Low', cls: 'bg-slate-500/10 text-slate-600 border-slate-500/20' },
      medium: { zh: '中', en: 'Medium', cls: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20' },
      high: { zh: '高', en: 'High', cls: 'bg-orange-500/10 text-orange-600 border-orange-500/20' },
      urgent: { zh: '紧急', en: 'Urgent', cls: 'bg-red-500/10 text-red-600 border-red-500/20' }
    };
    const v = map[p] || map.medium;
    return { label: language === 'zh' ? v.zh : v.en, cls: v.cls };
  }, [language]);

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex-1 min-h-0 rounded-3xl border border-gray-200/70 dark:border-gray-800/70 bg-white dark:bg-slate-900 overflow-hidden flex flex-col shadow-sm">
          <div className="px-8 py-6 border-b border-gray-200/50 dark:border-gray-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-between shrink-0 gap-6 transition-all">
            <div className="flex items-center gap-4">
              <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{language === 'zh' ? '所有需求' : 'All Requirements'}</div>
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-indigo-500/10"
              >
                <Plus size={18} />
                <span>{language === 'zh' ? '新增' : 'New'}</span>
              </button>
            </div>
            <div className="relative w-[480px] max-w-[40vw] group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') resetList();
                }}
                placeholder={t('searchPlaceholder')}
                className="w-full pl-11 pr-5 py-3 text-sm rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-transparent focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500/20 outline-none transition-all shadow-sm group-focus-within:shadow-md"
              />
            </div>
          </div>

          <div className="px-8 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-3 shrink-0 bg-white dark:bg-slate-900">
            <div className="text-sm font-medium text-gray-500 mr-2">{language === 'zh' ? '筛选' : 'Filter'}</div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all hover:bg-gray-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <option value="">{language === 'zh' ? '状态：全部' : 'Status: all'}</option>
              <option value="open">{language === 'zh' ? '状态：待处理' : 'Status: open'}</option>
              <option value="in_progress">{language === 'zh' ? '状态：处理中' : 'Status: in progress'}</option>
              <option value="done">{language === 'zh' ? '状态：已完成' : 'Status: done'}</option>
              <option value="closed">{language === 'zh' ? '状态：已关闭' : 'Status: closed'}</option>
            </select>
            <div className="relative w-[320px] max-w-[30vw] group">
              <Tag size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" />
              <input
                value={tagFilterInput}
                onChange={(e) => setTagFilterInput(e.target.value)}
                placeholder={t('tagsPlaceholder')}
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-gray-700 outline-none focus:bg-white dark:focus:bg-slate-950 focus:border-indigo-500/20 focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm"
              />
            </div>
            <button
              onClick={resetList}
              className="px-5 py-2.5 text-sm font-medium rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors shadow-sm ml-auto"
            >
              {language === 'zh' ? '刷新' : 'Refresh'}
            </button>
          </div>

          <div className="grid grid-cols-12 px-6 py-3 text-xs font-medium text-gray-500 border-b border-gray-100/70 dark:border-gray-800/60 shrink-0">
            <div className="col-span-7 pl-1">{language === 'zh' ? '编号与主题' : 'ID & Title'}</div>
            <div className="col-span-1 text-center">{language === 'zh' ? '优先级' : 'Priority'}</div>
            <div className="col-span-1 text-center">{language === 'zh' ? '状态' : 'Status'}</div>
            <div className="col-span-2 pl-4">{language === 'zh' ? '提出人' : 'Proposer'}</div>
            <div className="col-span-1 text-right pr-1">{language === 'zh' ? '时间' : 'Time'}</div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            {items.length === 0 && !loading && (
              <div className="p-10 text-center text-sm text-gray-400">{t('empty')}</div>
            )}
            {items.map((it) => {
              const meta = statusMeta(it.status);
              const pri = priorityMeta((it as any).priority || 'medium');
              return (
                <button
                  key={it.id}
                  onClick={() => fetchDetail(it.id)}
                  className="w-full text-left px-6 py-5 border-b border-gray-100/70 dark:border-gray-800/60 hover:bg-gray-50/80 dark:hover:bg-slate-800/30 transition-all group"
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-7">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <div className="text-xs text-gray-400 font-mono tracking-wide group-hover:text-indigo-500 transition-colors">{formatReqCode(it.id)}</div>
                        {(it.tags || []).slice(0, 4).map(tag => (
                          <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="text-base font-semibold text-slate-900 dark:text-white line-clamp-1 pr-4">
                        {it.title}
                      </div>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <span className={`inline-flex items-center justify-center text-[11px] h-6 px-2.5 rounded-full border ${pri.cls}`}>
                        {pri.label}
                      </span>
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <span className={`inline-flex items-center justify-center text-[11px] h-6 px-2.5 rounded-full border ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </div>
                    <div className="col-span-2 pl-4 text-sm text-slate-600 dark:text-slate-300 truncate flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold">
                        {(it.proposerName || it.createdByName || '?').charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate">{it.proposerName || it.createdByName}</span>
                    </div>
                    <div className="col-span-1 text-right text-xs text-gray-400 font-medium">
                      {formatTime(it.createdAt).split(' ')[0]}
                    </div>
                  </div>
                </button>
              );
            })}
            {hasMore && (
              <div className="p-5">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="w-full text-sm px-4 py-3 rounded-2xl border border-gray-200/70 dark:border-gray-800/70 hover:bg-gray-50 dark:hover:bg-slate-800/40 disabled:opacity-60 transition-colors"
                >
                  {loading ? t('loading') : t('loadMore')}
                </button>
              </div>
            )}
          </div>
        </div>

      {selectedId && (
        <div className="fixed inset-0 z-[220]">
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" onClick={closeDetail} />
          <div className="absolute right-0 top-0 h-full w-full sm:w-[85vw] sm:max-w-[960px] bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-l border-gray-200/50 dark:border-gray-800/50 shadow-2xl flex flex-col">
            <div className="px-8 py-6 border-b border-gray-100/50 dark:border-gray-800/50 flex items-start justify-between shrink-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
              <div className="flex-1 min-w-0 pr-8">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-xs font-mono text-gray-400 tracking-wide">{detail ? formatReqCode(detail.id) : ''}</div>
                  {detail && (
                    <>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${priorityMeta((detail as any).priority || 'medium').cls}`}>
                        {priorityMeta((detail as any).priority || 'medium').label}
                      </span>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full border ${statusMeta(detail.status).cls}`}>
                        {statusMeta(detail.status).label}
                      </span>
                    </>
                  )}
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white leading-tight break-words">
                  {detail ? detail.title : (language === 'zh' ? '加载中…' : 'Loading...')}
                </div>
              </div>
              <button onClick={closeDetail} className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-400 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-950">
              <div className="p-8 grid grid-cols-12 gap-8 min-h-0">
                <div className="col-span-12 lg:col-span-8 min-h-0 flex flex-col gap-8">
                  <div>
                    <div className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                      {language === 'zh' ? '需求描述' : 'Description'}
                    </div>
                    {detail && (
                      <>
                        <div className="flex flex-wrap gap-2 mb-6">
                          {(detail.tags || []).map(tag => (
                            <span key={tag} className="text-xs px-2.5 py-1 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                          {String(detail.content || '').trim().startsWith('<') ? (
                            <div
                              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(String(detail.content || '')) }}
                            />
                          ) : (
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{detail.content || ''}</ReactMarkdown>
                          )}
                        </div>
                      </>
                    )}
                    {!detail && (
                      <div className="py-10 text-sm text-gray-400 flex items-center">
                        <Loader2 size={16} className="animate-spin mr-2" />
                        {t('loading')}
                      </div>
                    )}
                  </div>

                  <div className="pt-8 border-t border-gray-100 dark:border-gray-800">
                    <div className="flex items-center justify-between mb-6">
                      <div className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <MessageSquare size={18} className="text-indigo-500" />
                        {t('comments')}
                        <span className="text-sm font-normal text-gray-400 ml-1">({commentTree.roots.length})</span>
                      </div>
                      {commentHasMore && (
                        <button
                          onClick={loadMoreComments}
                          disabled={loadingComments}
                          className="text-sm text-indigo-600 hover:underline disabled:opacity-60"
                        >
                          {t('loadMore')}
                        </button>
                      )}
                    </div>

                    <div className="space-y-6 mb-8">
                      {commentTree.roots.map(c => renderComment(c, 0))}
                      {commentTree.roots.length === 0 && !loadingComments && (
                        <div className="py-8 text-center text-sm text-gray-400 bg-gray-50/50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800">
                          {language === 'zh' ? '暂无评论，发表第一条评论吧' : 'No comments yet. Be the first to comment.'}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      {replyTo && (
                        <div className="flex items-center justify-between mb-2 text-xs text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg inline-flex">
                          <span>{language === 'zh' ? '回复' : 'Reply'} @{replyTo.userName}</span>
                          <button onClick={() => setReplyTo(null)} className="ml-2 hover:text-indigo-800">
                            <X size={12} />
                          </button>
                        </div>
                      )}
                      <div className="flex gap-3 items-start">
                        <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow-sm mt-1">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 relative">
                          <textarea
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            placeholder={t('commentPlaceholder')}
                            className="w-full resize-none text-sm p-4 pr-12 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all min-h-[100px] shadow-sm"
                          />
                          <button
                            onClick={postComment}
                            disabled={!commentText.trim() || postingComment}
                            className="absolute right-3 bottom-3 p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20"
                          >
                            <Send size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-4 min-h-0 flex flex-col gap-6">
                  <div className="rounded-2xl bg-gray-50/50 dark:bg-slate-900/50 p-6 border border-gray-100 dark:border-gray-800/50">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">{language === 'zh' ? '基础信息' : 'Information'}</div>
                    {detail && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-gray-400 mb-1">{language === 'zh' ? '提出人' : 'Proposer'}</div>
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-200 flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                                {(detail.proposerName || '?').charAt(0).toUpperCase()}
                              </div>
                              <span className="truncate">{detail.proposerName || '-'}</span>
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-400 mb-1">{language === 'zh' ? '创建人' : 'Created By'}</div>
                            <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{detail.createdByName || '-'}</div>
                          </div>
                        </div>
                        
                        <div className="h-px bg-gray-200/50 dark:bg-gray-700/50 my-2" />
                        
                        <div>
                           <div className="text-xs text-gray-400 mb-1">{language === 'zh' ? '所属模块' : 'Module'}</div>
                           <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{moduleName}</div>
                        </div>

                        <div>
                           <div className="text-xs text-gray-400 mb-1">{language === 'zh' ? '创建时间' : 'Created At'}</div>
                           <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{formatTime(detail.createdAt)}</div>
                        </div>

                        <div>
                           <div className="text-xs text-gray-400 mb-1">{language === 'zh' ? '最后更新' : 'Last Updated'}</div>
                           <div className="text-sm font-medium text-slate-700 dark:text-slate-200">{formatTime(detail.updatedAt)}</div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
          <div className="fixed inset-0 z-[230] bg-white/80 dark:bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
              <div className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{t('createTitle')}</div>
              <button onClick={() => setShowCreate(false)} className="p-2 -mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors text-gray-400">
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
              <div className="grid grid-cols-12 gap-8">
                <div className="col-span-12 lg:col-span-8 space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">{t('reqTitle')}</label>
                    <input
                      value={createTitle}
                      onChange={(e) => setCreateTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-slate-900 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all text-base shadow-sm"
                      placeholder={`${moduleName} - ...`}
                      autoFocus
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 ml-1">{language === 'zh' ? '需求描述' : 'Description'}</label>
                    <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:border-indigo-500/50 transition-all">
                      <RichTextEditor
                        value={createContent}
                        onChange={setCreateContent}
                        placeholder={language === 'zh' ? '请输入需求描述...' : 'Write description...'}
                        minHeight={320}
                      />
                    </div>
                  </div>
                </div>

                <div className="col-span-12 lg:col-span-4 space-y-6">
                  <div className="p-6 rounded-2xl bg-gray-50/50 dark:bg-slate-800/20 border border-gray-100 dark:border-gray-800 space-y-5">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('priority')}</label>
                      <select
                        value={createPriority}
                        onChange={(e) => setCreatePriority(e.target.value as any)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm appearance-none"
                      >
                        <option value="low">{language === 'zh' ? '低' : 'Low'}</option>
                        <option value="medium">{language === 'zh' ? '中' : 'Medium'}</option>
                        <option value="high">{language === 'zh' ? '高' : 'High'}</option>
                        <option value="urgent">{language === 'zh' ? '紧急' : 'Urgent'}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{t('proposer')}</label>
                      <input
                        value={createProposerName}
                        onChange={(e) => setCreateProposerName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm"
                        placeholder={language === 'zh' ? '例如：张三' : 'Name'}
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">{t('reqTags')}</label>
                        <button
                          onClick={extractTags}
                          disabled={extracting}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center gap-1.5 disabled:opacity-60 transition-colors font-medium"
                        >
                          {extracting ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                          {t('aiExtract')}
                        </button>
                      </div>
                      <input
                        value={createTagsInput}
                        onChange={(e) => setCreateTagsInput(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-slate-950 outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all shadow-sm text-sm"
                        placeholder={language === 'zh' ? '标签1, 标签2' : 'tag1, tag2'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/30 dark:bg-slate-900/30">
              <button
                onClick={() => setShowCreate(false)}
                className="px-6 py-2.5 text-sm font-medium rounded-xl text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
              >
                {t('cancel')}
              </button>
              <button
                onClick={createReq}
                disabled={!createTitle.trim() || creating}
                className="px-6 py-2.5 text-sm font-bold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-500/10"
              >
                {creating ? <Loader2 size={16} className="animate-spin" /> : null}
                {creating ? t('saving') : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
