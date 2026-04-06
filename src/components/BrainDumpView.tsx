import React, { useMemo } from 'react';
import { 
  ArrowUpRight, 
  Brain, 
  Sparkles, 
  Loader2, 
  Circle, 
  Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Task, Category } from '../types';
import { db } from '../services/db';
import { Button } from '@/components/ui/button';

interface BrainDumpViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  onAIBreakdown: (task: Task) => Promise<void>;
  isBreakingDown: string | null;
}

export default function BrainDumpView({ 
  tasks, 
  setTasks, 
  onAIBreakdown, 
  isBreakingDown 
}: BrainDumpViewProps) {
  
  // 1. Filter for tasks with no date (The "Backlog" logic)
  const backlogTasks = useMemo(() => 
    tasks.filter(t => !t.isCompleted && !t.scheduledDate), 
    [tasks]
  );

  // 2. Group tasks by Category
  const groupedTasks = useMemo(() => {
    const groups: Record<Category, Task[]> = {} as any;
    backlogTasks.forEach(task => {
      if (!groups[task.categoryId]) groups[task.categoryId] = [];
      groups[task.categoryId].push(task);
    });
    return groups;
  }, [backlogTasks]);

  // 3. Promotion Logic: "Add to Today"
  const moveToToday = async (taskId: string) => {
    const today = new Date().toISOString().split('T')[0];
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, scheduledDate: today } : t
    ));
    await db.updateTask(taskId, { scheduledDate: today });
  };

  const deleteTask = async (taskId: string) => {
    setTasks(prev => prev.filter(t => t.id !== taskId));
    await db.deleteTask(taskId);
  };

  if (backlogTasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-neutral-600">
        <Brain className="w-12 h-12 mb-4 opacity-20" />
        <p className="text-lg font-medium">Your brain dump is empty.</p>
        <p className="text-sm">Everything is captured or scheduled.</p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {Object.entries(groupedTasks).map(([category, categoryTasks]) => (
        <section key={category} className="space-y-4">
          <div className="flex items-center gap-2 px-2">
            <div className={`w-2 h-2 rounded-full ${
              category === 'work' ? 'bg-blue-500' : 
              category === 'personal' ? 'bg-green-500' : 'bg-neutral-500'
            }`} />
            <h3 className="text-xs font-bold uppercase tracking-widest text-neutral-500">
              {category}
            </h3>
            <span className="text-[10px] bg-neutral-900 px-2 py-0.5 rounded-full text-neutral-400">
              {categoryTasks.length}
            </span>
          </div>

          <div className="grid gap-3">
            <AnimatePresence mode="popLayout">
              {categoryTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-4 p-4 bg-neutral-900/60 rounded-2xl border border-neutral-800/50 group hover:border-neutral-700 transition-all"
                >
                  <button 
                    onClick={() => deleteTask(task.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-neutral-600 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <span className="flex-1 text-neutral-200 font-medium">
                    {task.title}
                  </span>

                  <div className="flex gap-2">
                    {/* Promotion Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveToToday(task.id)}
                      className="text-neutral-400 hover:text-white hover:bg-neutral-800 gap-1"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                      <span className="text-[10px] hidden sm:inline">Today</span>
                    </Button>

                    {/* AI Breakdown Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onAIBreakdown(task)}
                      className="h-8 w-8 text-blue-500 hover:bg-blue-500/10"
                    >
                      {isBreakingDown === task.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </section>
      ))}
    </div>
  );
}