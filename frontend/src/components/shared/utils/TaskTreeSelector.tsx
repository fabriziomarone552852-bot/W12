import React, { useMemo } from 'react';
import type { Task } from '../../../types';

interface TaskTreeSelectorProps {
  tasks: Task[];
  selectedParentId: string;
  onSelect: (parentId: string) => void;
  maxDepth?: number;
  onMaxDepthReached?: () => void;
}

const TaskTreeSelector: React.FC<TaskTreeSelectorProps> = ({ 
  tasks, selectedParentId, onSelect, maxDepth = 3, onMaxDepthReached 
}) => {
  const tasksByParent = useMemo(() => {
    const map = new Map<number | null, Task[]>();
    tasks.forEach(t => {
      if (t.fatto) return; // Escludiamo quelle completate
      const pId = t.parent_id ?? null;
      if (!map.has(pId)) map.set(pId, []);
      map.get(pId)!.push(t);
    });
    return map;
  }, [tasks]);

  const renderTree = (parentId: number | null, depth: number = 0): React.ReactNode[] => {
    const children = tasksByParent.get(parentId) || [];
    let result: React.ReactNode[] = [];
    
    children.forEach(task => {
      const isSelected = selectedParentId === task.id.toString(); 
      
      result.push(
        <div 
          key={task.id}
          onClick={() => {
            if (depth >= maxDepth - 1 && !isSelected) {
              if (onMaxDepthReached) onMaxDepthReached();
              return;
            }
            onSelect(isSelected ? '' : task.id.toString());
          }}
          className={`py-2 pr-4 text-sm cursor-pointer flex items-start border-t border-gray-50 transition-colors ${
            isSelected ? 'bg-blue-100 text-blue-700 font-extrabold border-l-4 border-l-blue-500' : 'hover:bg-blue-50'
          }`}
          style={{ paddingLeft: `${12 + (depth * 16)}px` }}
        >
          {depth > 0 && <span className="text-gray-300 mr-2 font-mono mt-0.5 shrink-0">└</span>}
          <span className={`break-words ${depth === 0 ? "font-extrabold text-gray-900 uppercase text-xs tracking-wider mt-0.5" : "text-gray-700"}`}>
            {task.titolo}
          </span>
        </div>
      );
      result = result.concat(renderTree(task.id, depth + 1));
    });
    return result;
  };

  const treeNodes = renderTree(null);

  if (treeNodes.length === 0) {
    return <div className="p-4 text-center text-sm text-gray-500 italic">Nessuna task principale trovata.</div>;
  }

  return <>{treeNodes}</>;
};

export default TaskTreeSelector;