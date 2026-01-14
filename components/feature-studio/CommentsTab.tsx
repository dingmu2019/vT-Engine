
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { useAuth, useSettings, useToast } from '../../contexts';
import { api } from '../../client';
import { Comment } from '../../types';

interface CommentsTabProps {
  moduleId: string;
  moduleName: string;
}

export const CommentsTab: React.FC<CommentsTabProps> = ({ moduleId, moduleName }) => {
  const { user } = useAuth();
  const { formatTime, language } = useSettings();
  const { addToast } = useToast();

  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [posting, setPosting] = useState(false);
  const loadingMoreRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const pageSize = 20;

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'auto') => {
    bottomRef.current?.scrollIntoView({ behavior });
  }, []);

  const fetchInitial = useCallback(async () => {
    try {
      const res = await api.comments.getCursor(moduleId, pageSize);
      const items = (res?.items || []) as Comment[];
      const asc = [...items].reverse();
      setComments(asc);
      setCursor(res?.nextCursor || null);
      setHasMore(!!res?.hasMore);
      requestAnimationFrame(() => scrollToBottom('auto'));
    } catch (e) {
      console.error(e);
      setComments([]);
      setCursor(null);
      setHasMore(false);
    }
  }, [moduleId, scrollToBottom]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const t = (key: string) => {
    const dict: Record<string, { en: string; zh: string }> = {
      'comments_desc': { en: 'Team discussion and feedback.', zh: '团队讨论区与反馈。' },
      'comment_placeholder': { en: 'Type your message...', zh: '输入讨论内容...' },
      'no_comments': { en: 'No messages yet. Start the discussion!', zh: '暂无讨论内容，开始讨论吧！' },
      'post_failed': { en: 'Failed to post message', zh: '发布讨论内容失败' },
    };
    return dict[key] ? dict[key][language] : key;
  };

  const handlePostComment = useCallback(async () => {
    const content = newComment.trim();
    if (!content || posting) return;
    try {
      setPosting(true);
      const created = await api.comments.add(moduleId, moduleName, content, user.avatar);
      setNewComment('');
      setComments(prev => [...prev, created as Comment]);
      requestAnimationFrame(() => scrollToBottom('smooth'));
    } catch (e) {
      console.error(e);
      addToast(t('post_failed'), 'error');
    } finally {
      setPosting(false);
    }
  }, [addToast, moduleId, newComment, posting, scrollToBottom, t, user.avatar]);

  const canLoadMore = useMemo(() => hasMore && !loadingMore, [hasMore, loadingMore]);

  const loadMore = useCallback(async () => {
    if (!canLoadMore || !cursor) return;
    if (loadingMoreRef.current) return;
    const el = listRef.current;
    if (!el) return;
    const prevScrollHeight = el.scrollHeight;
    const prevScrollTop = el.scrollTop;
    try {
      loadingMoreRef.current = true;
      setLoadingMore(true);
      const res = await api.comments.getCursor(moduleId, pageSize, cursor);
      const items = (res?.items || []) as Comment[];
      const asc = [...items].reverse();
      setComments(prev => [...asc, ...prev]);
      setCursor(res?.nextCursor || null);
      setHasMore(!!res?.hasMore);
      requestAnimationFrame(() => {
        const nextScrollHeight = el.scrollHeight;
        el.scrollTop = nextScrollHeight - prevScrollHeight + prevScrollTop;
      });
    } catch (e) {
      console.error(e);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [canLoadMore, cursor, moduleId]);

  return (
      <div className="h-full flex flex-col">
           <p className="text-sm text-gray-500 mb-4 shrink-0">{t('comments_desc')}</p>
           
           <div
             ref={listRef}
             onScroll={() => {
               const el = listRef.current;
               if (!el) return;
               if (el.scrollTop <= 80) loadMore();
             }}
             className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 mb-4"
           >
               {comments.map((comment) => {
                   const isMe = comment.userId === user.id;
                   return (
                       <div key={comment.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0
                               ${comment.userName.includes('Admin') ? 'bg-red-500' : 
                                 comment.userName.includes('PM') ? 'bg-purple-500' :
                                 comment.userName.includes('Expert') ? 'bg-green-500' : 'bg-blue-500'
                               }`}>
                               {comment.userAvatar}
                           </div>
                           
                           <div className={`flex flex-col max-w-[85%] ${isMe ? 'items-end' : 'items-start'}`}>
                               <div className={`px-4 py-2.5 rounded-2xl text-sm shadow-sm
                                   ${isMe 
                                       ? 'bg-indigo-600 text-white rounded-br-none' 
                                       : 'bg-gray-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                                   }`}>
                                   {comment.content}
                               </div>

                               <div className="text-[10px] text-gray-400 mt-1 px-1">
                                   {comment.userName} • {formatTime(comment.timestamp)}
                               </div>
                           </div>
                       </div>
                   )
               })}
               <div ref={bottomRef} />
               {comments.length === 0 && (
                   <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-2 opacity-50">
                       <MessageSquare size={32} />
                       <span className="text-sm">{t('no_comments')}</span>
                   </div>
               )}
           </div>

           <div className="relative shrink-0 bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700 rounded-xl p-1 shadow-sm">
               <div className="flex items-end gap-2 p-2">
                  <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder={`${t('comment_placeholder')} (${moduleName})`}
                      className="flex-1 max-h-32 bg-transparent border-none outline-none resize-none text-sm text-slate-800 dark:text-slate-200 py-2 custom-scrollbar"
                      rows={1}
                      style={{ minHeight: '36px' }}
                      onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handlePostComment();
                          }
                      }}
                  />
                  <button 
                      onClick={handlePostComment}
                      disabled={!newComment.trim() || posting}
                      className="p-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 disabled:bg-gray-300 dark:disabled:bg-gray-700 hover:bg-indigo-700 transition-colors shadow-sm"
                  >
                      <Send size={16} />
                  </button>
               </div>
           </div>
      </div>
  );
};
