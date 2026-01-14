
import React, { useState, useRef, useEffect, useContext } from 'react';
import { createPortal } from 'react-dom';
import { 
  ChevronRight, ChevronDown, Box, LayoutGrid, 
  Plus, Trash2, Edit2, Circle, Check,
  FilePlus, FolderPlus, MoreHorizontal,
  Package, Tags, Library, ShoppingBag, Layers, Percent,
  TrendingUp, UserPlus, Target, Users, Presentation, FileText, FileSignature, ShoppingCart, Settings2,
  Truck, Briefcase, Ticket, HardHat,
  Building, Building2, Store, Key,
  FolderKanban, TicketCheck, CheckSquare, ArrowLeftRight, Stamp, Bell, BellRing, BookOpen, Mail, MessageCircle,
  BadgeDollarSign, FileCheck, Wallet, Scale,
  Bug, FileCode, AlertTriangle,
  Network, Handshake, UserCircle, UserCog,
  BarChart3, LineChart, Shield, Lock, Languages, Copy, ListTodo, GanttChart, Sliders, Database, ScrollText, Blocks, Settings,
  Download, Upload, Camera, Bot
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { NavNode } from '../../types';
import { useSettings, useAuth, useNavigation, useToast } from '../../contexts';
import { SidebarInteractionContext, ModalConfig } from './SidebarContext';

const ICON_MAP: Record<string, React.ElementType> = {
  'home': LayoutGrid,
  'package': Package,
  'tags': Tags,
  'library': Library,
  'shopping-bag': ShoppingBag,
  'layers': Layers,
  'percent': Percent,
  'trending-up': TrendingUp,
  'user-plus': UserPlus,
  'target': Target,
  'users': Users,
  'presentation': Presentation,
  'file-text': FileText,
  'file-signature': FileSignature,
  'shopping-cart': ShoppingCart,
  'settings-2': Settings2,
  'truck': Truck,
  'briefcase': Briefcase,
  'ticket': Ticket,
  'hard-hat': HardHat,
  'building': Building,
  'building-2': Building2,
  'store': Store,
  'key': Key,
  'cpu': Settings, 
  'folder-kanban': FolderKanban,
  'ticket-check': TicketCheck,
  'check-square': CheckSquare,
  'arrow-left-right': ArrowLeftRight,
  'stamp': Stamp,
  'bell': Bell,
  'bell-ring': BellRing,
  'message-square': MessageCircle, 
  'book-open': BookOpen,
  'mail': Mail,
  'message-circle': MessageCircle,
  'badge-dollar-sign': BadgeDollarSign,
  'file-check': FileCheck,
  'wallet': Wallet,
  'scale': Scale,
  'bug': Bug,
  'file-code': FileCode,
  'alert-triangle': AlertTriangle,
  'network': Network,
  'handshake': Handshake,
  'user-circle': UserCircle,
  'user-cog': UserCog,
  'bar-chart-3': BarChart3,
  'line-chart': LineChart,
  'settings': Settings,
  'shield': Shield,
  'lock': Lock,
  'languages': Languages,
  'copy': Copy,
  'list-todo': ListTodo,
  'gantt-chart': GanttChart,
  'sliders': Sliders,
  'database': Database,
  'scroll-text': ScrollText,
  'blocks': Blocks,
  'bot': Bot
};

// --- TreeNode Component ---
interface TreeNodeProps {
  node: NavNode;
  level: number;
  onSelect: (id: string, name: string) => void;
  selectedId: string | null;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, level, onSelect, selectedId }) => {
  const { language } = useSettings();
  const { canManageStructure } = useAuth();
  const { moveNode } = useNavigation();
  const { openActionModal } = useContext(SidebarInteractionContext)!;

  const [isOpen, setIsOpen] = useState(true);
  const [showMenu, setShowMenu] = useState(false);
  const menuTriggerRef = useRef<HTMLDivElement>(null);
  const menuPortalRef = useRef<HTMLDivElement>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  
  // Drag State
  const [dragPosition, setDragPosition] = useState<'top' | 'inside' | 'bottom' | null>(null);

  const isSelected = node.id === selectedId;
  const displayLabel = language === 'zh' ? node.labelZh : node.label;
  const NodeIcon = node.icon ? ICON_MAP[node.icon] : null;

  const t = {
    en: {
        addModule: 'Add Module',
        addFolder: 'Add Folder',
        rename: 'Rename',
        delete: 'Delete'
    },
    zh: {
        addModule: '新建模块',
        addFolder: '新建文件夹',
        rename: '重命名',
        delete: '删除'
    }
  }[language];

  // Handle click outside to close context menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuTriggerRef.current?.contains(target)) return;
      if (menuPortalRef.current?.contains(target)) return;
      if (showMenu) {
        setShowMenu(false);
      }
    };
    const handleAnyScroll = () => {
      if (showMenu) setShowMenu(false);
    };
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleAnyScroll, true);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleAnyScroll, true);
    };
  }, [showMenu]);

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.type === 'folder') {
      setIsOpen(!isOpen);
    } else {
      onSelect(node.id, displayLabel);
    }
  };

  const handleMenuAction = (action: ModalConfig['type'], e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    
    // Auto-expand folder when adding children
    if (action === 'add-folder' || action === 'add-module') {
       setIsOpen(true); 
    }

    openActionModal({
      type: action,
      targetNodeId: node.id,
      initialLabel: node.label,
      initialLabelZh: node.labelZh,
      initialDescription: node.description,
      targetName: displayLabel
    });
  };

  // --- Drag & Drop Handlers ---
  const handleDragStart = (e: React.DragEvent) => {
      if (!canManageStructure) {
          e.preventDefault();
          return;
      }
      e.stopPropagation();
      e.dataTransfer.setData('application/react-dnd-id', node.id);
      e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
      if (!canManageStructure) return;
      e.preventDefault();
      e.stopPropagation();
      
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;

      // Define zones: Top 25%, Bottom 25%, Middle 50%
      if (y < height * 0.25) {
          setDragPosition('top');
      } else if (y > height * 0.75) {
          setDragPosition('bottom');
      } else {
          // Only folders can have items dropped inside
          if (node.type === 'folder') {
              setDragPosition('inside');
          } else {
              // If it's a file, stick to closest edge
              setDragPosition(y < height * 0.5 ? 'top' : 'bottom');
          }
      }
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragPosition(null);
  };

  const handleDrop = (e: React.DragEvent) => {
      if (!canManageStructure) return;
      e.preventDefault();
      e.stopPropagation();
      const dragId = e.dataTransfer.getData('application/react-dnd-id');
      
      if (dragId && dragPosition) {
          moveNode(dragId, node.id, dragPosition);
      }
      setDragPosition(null);
  };

  // Drag Styles
  const getDragStyle = () => {
      if (!dragPosition) return '';
      if (dragPosition === 'top') return 'border-t-2 border-indigo-500';
      if (dragPosition === 'bottom') return 'border-b-2 border-indigo-500';
      if (dragPosition === 'inside') return 'bg-indigo-100 dark:bg-indigo-900/40 border-indigo-500 border-2 border-dashed';
      return '';
  };

  return (
    <div 
        className={`select-none relative ${showMenu ? 'z-20' : 'z-0'}`}
    >
      <div
        draggable={canManageStructure}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleToggle}
        className={`group flex items-center justify-between px-3 py-2 cursor-pointer transition-all text-sm border-l-2
          ${getDragStyle()}
          ${isSelected && !dragPosition
              ? 'bg-blue-50 text-blue-700 border-blue-600 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-400'
              : !dragPosition 
                ? 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
                : 'border-transparent text-slate-600 dark:text-slate-400'
          }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
          
          {/* Toggle/Spacer */}
          <span className="shrink-0 w-4 flex justify-center text-gray-400 hover:text-gray-600">
            {node.type === 'folder' ? (
               isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />
            ) : (
               <span className="w-4" /> 
            )}
          </span>

          {/* Icon */}
          <span className={`shrink-0 ${node.type === 'folder' ? 'text-indigo-500/80 dark:text-indigo-400/80' : 'opacity-70'}`}>
            {NodeIcon ? (
                <NodeIcon size={16} />
            ) : (
                node.type === 'folder' ? null : <Box size={16} />
            )}
          </span>

          <span className="truncate leading-normal">{displayLabel}</span>
          {node.type === 'folder' && isOpen && (!node.children || node.children.length === 0) && (
            <span className="text-xs text-gray-300 italic ml-1 font-light">(empty)</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Status Indicator - Read Only */}
          <div
            className={`p-1 rounded-full cursor-default transition-all`}
            title={node.status === 'ready' ? 'Ready for AI' : 'Draft Status'}
          >
            {node.status === 'ready' ? (
              // Solid Badge Style
              <div className="w-[18px] h-[18px] bg-green-500 rounded-full flex items-center justify-center shadow-sm">
                  <Check size={12} className="text-white" strokeWidth={3} />
              </div>
            ) : (
              // Outline Style for Draft
              <Circle 
                size={18} 
                className={`text-gray-300 dark:text-gray-600`} 
                strokeWidth={2}
              />
            )}
          </div>

          {/* More Menu Trigger - Only for Admin/PM */}
          {canManageStructure && (
            <div className="relative" ref={menuTriggerRef}>
               <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = !showMenu;
                    setShowMenu(next);
                    if (next) {
                      const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                      const menuWidth = 144;
                      const left = Math.min(window.innerWidth - 8 - menuWidth, Math.max(8, rect.right - menuWidth));
                      setMenuPos({ top: rect.bottom + 6, left });
                    }
                  }}
                  className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors ${showMenu ? 'text-indigo-600 bg-gray-200 dark:bg-slate-700' : 'text-transparent group-hover:text-gray-400'}`}
               >
                  <MoreHorizontal size={14} />
               </button>

               {/* Dropdown Menu */}
               {showMenu && (
                 createPortal(
                   <div
                     ref={menuPortalRef}
                     className="fixed w-36 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-[9999] animate-in fade-in zoom-in-95 duration-100 flex flex-col origin-top-right"
                     style={{ top: menuPos?.top ?? 0, left: menuPos?.left ?? 0 }}
                   >
                      {node.type === 'folder' && (
                        <>
                          <button onClick={(e) => handleMenuAction('add-module', e)} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 text-left w-full">
                             <FilePlus size={14} className="text-blue-500" />
                             <span>{t.addModule}</span>
                          </button>
                          <button onClick={(e) => handleMenuAction('add-folder', e)} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 text-left w-full">
                             <FolderPlus size={14} className="text-blue-500" />
                             <span>{t.addFolder}</span>
                          </button>
                          <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                        </>
                      )}
                      <button onClick={(e) => handleMenuAction('edit', e)} className="flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-slate-700 text-left w-full">
                         <Edit2 size={14} className="text-amber-500" />
                         <span>{t.rename}</span>
                      </button>
                      <button onClick={(e) => handleMenuAction('delete', e)} className="flex items-center gap-2 px-3 py-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 text-left w-full">
                         <Trash2 size={14} />
                         <span>{t.delete}</span>
                      </button>
                   </div>,
                   document.body
                 )
               )}
            </div>
          )}
        </div>
      </div>

      {isOpen && node.children && (
        <div className="relative">
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface SidebarTreeProps {
  selectedModuleId: string | null;
  onSelectModule: (id: string, name: string) => void;
  onAddRoot: () => void;
}

export const SidebarTree: React.FC<SidebarTreeProps> = ({ selectedModuleId, onSelectModule, onAddRoot }) => {
  const { tree, importTree } = useNavigation();
  const { canManageStructure } = useAuth();
  const { language } = useSettings();
  const { addToast } = useToast();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const treeContainerRef = useRef<HTMLDivElement>(null);

  const handleExport = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Ensure complete schema for export (Database Schema Structure)
    const processForExport = (nodes: NavNode[]): any[] => {
        return nodes.map(node => {
            const exportNode: any = {
                key: node.key, // Use key instead of id
                label: node.label,
                label_zh: node.labelZh,
                description: node.description || '',
                type: node.type,
                status: node.status,
                icon: node.icon || (node.type === 'folder' ? 'folder' : 'box'),
                sort_order: node.sortOrder || 0
            };
            
            if (node.children && node.children.length > 0) {
                exportNode.children = processForExport(node.children);
            }
            
            return exportNode;
        });
    };

    const dataStr = JSON.stringify(processForExport(tree), null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `t-engine-schema-${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    addToast(language === 'zh' ? '全景树导出成功' : 'Tree structure exported', 'success');
  };

  const handleScreenshot = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!treeContainerRef.current) return;

    // Detect Dark Mode based on HTML class
    const isDarkMode = document.documentElement.classList.contains('dark');

    // Create a temporary wrapper for the clone
    // Position it off-screen but ensure it has the same width as the original container
    const wrapper = document.createElement('div');
    wrapper.style.position = 'absolute';
    wrapper.style.top = '-9999px';
    wrapper.style.left = '-9999px';
    wrapper.style.width = `${treeContainerRef.current.offsetWidth}px`;
    wrapper.style.zIndex = '-1';
    
    // Apply 'dark' class to wrapper so children inherit dark mode styles properly
    if (isDarkMode) {
        wrapper.classList.add('dark');
    }

    document.body.appendChild(wrapper);

    // Clone the element to manipulate styles for full capture
    const clone = treeContainerRef.current.cloneNode(true) as HTMLElement;

    // Modify clone styles to ensure full height and visible content
    // We remove height restrictions and overflow hiding to let it expand fully
    clone.style.height = 'auto';
    clone.style.maxHeight = 'none';
    clone.style.overflow = 'visible';
    clone.style.position = 'static'; // Ensure it flows within the wrapper
    
    // FIX: html2canvas clipping issue. 
    // 1. Remove 'overflow-hidden' and 'truncate' from all elements in the clone
    // 2. Increase padding slightly to accommodate baseline differences in rendering
    const elementsToUnclip = clone.querySelectorAll('.truncate, .overflow-hidden');
    elementsToUnclip.forEach((el) => {
        const e = el as HTMLElement;
        e.style.overflow = 'visible'; 
        e.style.textOverflow = 'clip';
        e.style.whiteSpace = 'nowrap'; // Keep it single line but visible
        e.classList.remove('truncate', 'overflow-hidden'); // Force remove Tailwind classes
    });

    const treeRows = clone.querySelectorAll('.group.flex');
    treeRows.forEach((el) => {
        const e = el as HTMLElement;
        e.style.paddingTop = '10px';
        e.style.paddingBottom = '10px';
    });
    
    // Explicitly set background and text color based on theme to fix transparency/contrast issues
    clone.style.backgroundColor = isDarkMode ? '#0f172a' : '#f8fafc'; // Matches bg-slate-900 / bg-slate-50
    clone.style.color = isDarkMode ? '#f1f5f9' : '#0f172a'; // Matches text-slate-100 / text-slate-900

    // Remove classes that might restrict height or hide overflow
    clone.classList.remove('overflow-y-auto', 'overflow-x-hidden', 'flex-1', 'h-full');

    wrapper.appendChild(clone);

    try {
        // Allow a brief moment for styles to apply (optional but safe)
        await new Promise(resolve => setTimeout(resolve, 0));

        const canvas = await html2canvas(clone, {
            backgroundColor: null, // Use the element's background color we set
            scale: 2, // High resolution for Retina displays
            useCORS: true,
            logging: false,
            // Explicitly use the scroll dimensions of the clone to capture everything
            width: clone.scrollWidth,
            height: clone.scrollHeight,
            windowWidth: clone.scrollWidth,
            windowHeight: clone.scrollHeight
        });

        canvas.toBlob(async (blob) => {
            if (blob) {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    addToast(language === 'zh' ? '全景树截图已复制' : 'Tree screenshot copied', 'success');
                } catch (err) {
                    console.error('Clipboard write failed', err);
                    addToast(language === 'zh' ? '截图复制失败' : 'Failed to copy screenshot', 'error');
                }
            }
        }, 'image/png');
    } catch (err) {
        console.error('Screenshot failed', err);
        addToast(language === 'zh' ? '截图生成失败' : 'Failed to generate screenshot', 'error');
    } finally {
        document.body.removeChild(wrapper);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto py-4 custom-scrollbar overflow-x-hidden" ref={treeContainerRef}>
      <div className="px-4 mb-2 flex items-center justify-between">
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider truncate">
          {language === 'zh' ? 'T台功能全景树' : 'T-Platform Functional Tree'}
        </div>
        {canManageStructure && (
          <div className="flex items-center gap-1">
             <button 
                onClick={handleExport}
                className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 p-1 rounded transition-all shrink-0"
                title={language === 'zh' ? '导出结构 (JSON)' : 'Export Tree (JSON)'}
             >
                <Download size={14} />
             </button>
             <button 
                onClick={handleScreenshot}
                className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 p-1 rounded transition-all shrink-0"
                title={language === 'zh' ? '截图 (剪贴板)' : 'Screenshot (Clipboard)'}
             >
                <Camera size={14} />
             </button>
             <button 
                onClick={onAddRoot}
                className="text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 p-1 rounded transition-all shrink-0"
                title={language === 'zh' ? '添加根节点' : 'Add Root Node'}
             >
                <Plus size={16} />
             </button>
          </div>
        )}
      </div>
      
      {tree.map((node) => (
        <TreeNode
          key={node.id}
          node={node}
          level={0}
          onSelect={onSelectModule}
          selectedId={selectedModuleId}
        />
      ))}

      {tree.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="text-gray-300">
                  <LayoutGrid size={32} />
              </div>
              <div className="text-xs text-gray-400">
                  {language === 'zh' ? '暂无模块' : 'No modules defined'}
              </div>
              {canManageStructure && (
                  <button 
                      onClick={onAddRoot}
                      className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded hover:bg-indigo-100 transition-colors whitespace-nowrap"
                  >
                      {language === 'zh' ? '创建第一个模块' : 'Create first module'}
                  </button>
              )}
          </div>
      )}
    </div>
  );
};
