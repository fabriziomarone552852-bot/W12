import React from 'react';
import { Badge } from '@/components/shared/utils/Badges';
import { EmptyState } from '@/components/shared/utils/EmptyState';
import type { TaskSummary } from '@/types';

// Diciamo esplicitamente che questo componente riceve un array (una lista) di DbTask
interface UpcomingTasksWidgetProps {
  tasks: TaskSummary[];
}

export const UpcomingTasksWidget: React.FC<UpcomingTasksWidgetProps> = ({ tasks }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 shrink-0">
      <h3 className="text-lg font-bold text-gray-800 mb-4 uppercase tracking-wider border-b pb-2">
        In Scadenza (Prossimi 30 Giorni)
      </h3>
      
      <div className="overflow-hidden max-h-[120px] custom-scrollbar relative">
        <table className="w-full text-left border-collapse">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="text-xs text-gray-400 uppercase tracking-wider border-b">
              <th className="pb-2">Task</th>
              <th className="pb-2">Categoria</th>
              <th className="pb-2">Scadenza</th>
              <th className="pb-2">Priorità</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-6">
                  <EmptyState message="Nessuna task in scadenza a breve!" />
                </td>
              </tr>
            ) : (
              tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50 border-b border-gray-50 transition-colors cursor-pointer" >
                  <td className="py-3 text-sm font-medium text-gray-800">{task.title}</td>
                  <td className="py-3">
                    <Badge variant="category" colorHex={task.categoryColor}>{task.category}</Badge>
                  </td>
                  <td className="py-3 text-sm font-bold text-gray-600">{task.deadline}</td>
                  <td className="py-3">
                    <Badge variant="priority" priorityLevel={task.priority}>{task.priority}</Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};