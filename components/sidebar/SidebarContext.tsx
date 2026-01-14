
import { createContext } from 'react';

export interface ModalConfig {
  type: 'add-folder' | 'add-module' | 'edit' | 'delete' | 'add-root';
  targetNodeId: string | 'root';
  initialLabel?: string;
  initialLabelZh?: string;
  initialDescription?: string; // Add description
  targetName?: string; // For delete confirmation
}

interface SidebarInteractionContextType {
  openActionModal: (config: ModalConfig) => void;
}

export const SidebarInteractionContext = createContext<SidebarInteractionContextType | undefined>(undefined);
