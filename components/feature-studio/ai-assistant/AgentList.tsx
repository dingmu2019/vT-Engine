import React from 'react';
import { Check } from 'lucide-react';
import { useAgents } from '../../../contexts';

export const AgentList = ({ activeAgentId, onSelect }: { activeAgentId: string; onSelect: (id: string) => void }) => {
  const { agents } = useAgents();
  return (
    <>
      {agents.map((agent: any) => (
        <button
          key={agent.id}
          onClick={() => onSelect(agent.id)}
          className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors
                        ${agent.id === activeAgentId ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}
                    `}
        >
          <div className="w-6 h-6 flex items-center justify-center text-sm">
            {agent.avatar}
          </div>
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium truncate ${agent.id === activeAgentId ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-200'}`}>
              {agent.name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {agent.role}
            </div>
          </div>
          {agent.id === activeAgentId && <Check size={14} className="text-indigo-600 dark:text-indigo-400" />}
        </button>
      ))}
    </>
  );
};

