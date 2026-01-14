export const normalizeChatMessage = (m: any) => ({
  id: String(m.id),
  role: m.role,
  content: m.content || '',
  timestamp: m.timestamp || m.created_at,
  actorId: m.actorId || m.actor_id || '',
  actorName: m.actorName || m.actor_name || '',
  actorAvatar: m.actorAvatar || m.actor_avatar || '',
  agentId: m.agentId || m.agent_id || '',
  promptLabel: m.promptLabel ?? m.prompt_label ?? null,
  attachments: m.attachments || [],
  favorite: !!m.favorite,
  reaction: m.reaction === 'like' || m.reaction === 'dislike' ? m.reaction : null
});
