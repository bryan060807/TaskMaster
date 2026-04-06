import React, { useState, useMemo, useEffect } from 'react';
import { format, addDays, startOfWeek, isSameDay } from 'date-fns';
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Task, RecurringTask, Category, CATEGORIES } from '../types';
import { CheckCircle2, Circle, Trash2, Repeat, Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { db } from '../services/db';

interface CalendarViewProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  recurringTasks: RecurringTask[];
  setRecurringTasks: React.Dispatch<React.SetStateAction<RecurringTask[]>>;
}

const SortableTaskItem = ({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const category = CATEGORIES[task.categoryId || 'general'] || CATEGORIES.general;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`p-2 mb-2 rounded-xl border text-sm flex items-start gap-2 bg-white dark:bg-stone-900 shadow-sm cursor-grab active:cursor-grabbing ${
        task.isCompleted ? 'opacity-50' : ''
      } ${category.color.split(' ')[0]} dark:border-stone-800`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        className="mt-0.5 text-stone-400 hover:text-emerald-500 transition-colors flex-shrink-0"
      >
        {task.isCompleted ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Circle className="w-4 h-4" />}
      </button>

      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${task.isCompleted ? 'line-through text-stone-500' : 'text-stone-800 dark:text-stone-200'}`}>
          {task.title}
        </p>
        {task.recurrenceId && (
          <p className="text-[10px] text-stone-500 flex items-center gap-1 mt-0.5">
            <Repeat className="w-3 h-3" /> Recurring
          </p>
        )}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        className="text-stone-400 hover:text-red-500 transition-colors p-1"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
};

const DroppableColumn = ({ id, children, day }: { id: string; children: React.ReactNode; day: Date }) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`bg-stone-100 dark:bg-stone-800/50 rounded-2xl p-3 min-h-[200px] flex flex-col transition-colors ${
        isOver ? 'ring-2 ring-indigo-500 dark:ring-indigo-400 bg-indigo-50 dark:bg-indigo-900/20' : ''
      }`}
    >
      <div className="mb-3 text-center">
        <p className="text-xs font-semibold uppercase text-stone-500 dark:text-stone-400">{format(day, 'EEE')}</p>
        <p className={`text-lg font-bold ${isSameDay(day, new Date()) ? 'text-indigo-600 dark:text-indigo-400' : 'text-stone-900 dark:text-stone-100'}`}>
          {format(day, 'd')}
        </p>
      </div>
      {children}
    </div>
  );
};

export default function CalendarView({ tasks, setTasks, recurringTasks, setRecurringTasks }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isAddingRecurring, setIsAddingRecurring] = useState(false);
  const [editingRecId, setEditingRecId] = useState<string | null>(null);
  const [newRecTitle, setNewRecTitle] = useState('');
  const [newRecCat, setNewRecCat] = useState<Category>('general');
  const [newRecPattern, setNewRecPattern] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [isProcessing, setIsProcessing] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  useEffect(() => {
    const loadRecurringTasks = async () => {
      try {
        const savedRecurringTasks = await db.getRecurringTasks();
        setRecurringTasks(savedRecurringTasks || []);
      } catch (e) {
        console.error('Failed to load recurring tasks:', e);
      }
    };

    loadRecurringTasks();
  }, [setRecurringTasks]);

  useEffect(() => {
    const generateRecurring = async () => {
      const generatedTasks: Task[] = [];

      for (const day of days) {
        const dateStr = format(day, 'yyyy-MM-dd');

        for (const rt of recurringTasks) {
          const exists = tasks.some((t) => t.recurrenceId === rt.id && t.scheduledDate === dateStr);
          if (exists) continue;

          let shouldGenerate = false;
          if (rt.pattern === 'daily') shouldGenerate = true;
          if (rt.pattern === 'weekly' && rt.daysOfWeek?.includes(day.getDay())) shouldGenerate = true;
          if (rt.pattern === 'monthly' && day.getDate() === new Date(rt.createdAt).getDate()) shouldGenerate = true;

          if (!shouldGenerate) continue;

          try {
            const newTask = await db.createTask({
              title: rt.title,
              description: '',
              priority: 'medium',
              categoryId: rt.categoryId,
              scheduledDate: dateStr,
              recurrenceId: rt.id,
              isCompleted: false,
              isFocus: false,
            } as Partial<Task>);

            generatedTasks.push(newTask);
          } catch (e) {
            console.error('Failed to generate recurring task instance:', e);
          }
        }
      }

      if (generatedTasks.length > 0) {
        setTasks((prev) => [...prev, ...generatedTasks]);
      }
    };

    generateRecurring();
  }, [days, recurringTasks, tasks, setTasks]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    if (overId.match(/^\d{4}-\d{2}-\d{2}$/)) {
      setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, scheduledDate: overId } : t)));

      try {
        await db.updateTask(taskId, { scheduledDate: overId } as Partial<Task>);
      } catch (e) {
        console.error('Failed to update task date:', e);
      }
    }
  };

  const toggleTask = async (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newCompleted = !task.isCompleted;

    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, isCompleted: newCompleted } : t)));
    await db.updateTask(id, {
      isCompleted: newCompleted,
      status: newCompleted ? 'completed' : 'pending',
    } as Partial<Task>);
  };

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await db.deleteTask(id);
  };

  const handleAddRecurring = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecTitle.trim()) return;

    setIsProcessing(true);

    try {
      if (editingRecId) {
        const updated = await db.updateRecurringTask(editingRecId, {
          title: newRecTitle.trim(),
          categoryId: newRecCat,
          pattern: newRecPattern,
          daysOfWeek: newRecPattern === 'weekly' ? [new Date().getDay()] : [],
        });

        setRecurringTasks((prev) => prev.map((rt) => (rt.id === editingRecId ? updated : rt)));
      } else {
        const newRt = await db.createRecurringTask({
          title: newRecTitle.trim(),
          categoryId: newRecCat,
          pattern: newRecPattern,
          daysOfWeek: newRecPattern === 'weekly' ? [new Date().getDay()] : [],
        });

        setRecurringTasks((prev) => [...prev, newRt]);
      }

      setNewRecTitle('');
      setIsAddingRecurring(false);
      setEditingRecId(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteRecurring = async (id: string) => {
    await db.deleteRecurringTask(id);
    setRecurringTasks((prev) => prev.filter((rt) => rt.id !== id));
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <CalendarIcon className="w-6 h-6" /> Weekly Schedule
        </h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="px-3 py-1.5 bg-stone-200 dark:bg-stone-800 rounded-lg text-sm">
            Prev
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm">
            Today
          </button>
          <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="px-3 py-1.5 bg-stone-200 dark:bg-stone-800 rounded-lg text-sm">
            Next
          </button>
        </div>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {days.map((day) => {
            const dayId = format(day, 'yyyy-MM-dd');
            const dayTasks = tasks.filter((t) => t.scheduledDate === dayId);

            return (
              <DroppableColumn key={dayId} id={dayId} day={day}>
                <SortableContext items={dayTasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                  {dayTasks.map((task) => (
                    <SortableTaskItem key={task.id} task={task} onToggle={toggleTask} onDelete={deleteTask} />
                  ))}
                </SortableContext>
              </DroppableColumn>
            );
          })}
        </div>
      </DndContext>

      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Repeat className="w-5 h-5" /> Recurring Tasks
          </h3>
          <button
            onClick={() => {
              setIsAddingRecurring((v) => !v);
              setEditingRecId(null);
              setNewRecTitle('');
              setNewRecCat('general');
              setNewRecPattern('daily');
            }}
            className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm"
          >
            {isAddingRecurring ? 'Cancel' : 'Add Recurring'}
          </button>
        </div>

        {isAddingRecurring && (
          <form onSubmit={handleAddRecurring} className="bg-stone-100 dark:bg-stone-800 rounded-2xl p-4 mb-4 space-y-3">
            <input
              type="text"
              value={newRecTitle}
              onChange={(e) => setNewRecTitle(e.target.value)}
              placeholder="Recurring task title"
              className="w-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2"
            />

            <div className="grid grid-cols-2 gap-3">
              <select
                value={newRecCat}
                onChange={(e) => setNewRecCat(e.target.value as Category)}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2"
              >
                {Object.entries(CATEGORIES).map(([id, category]) => (
                  <option key={id} value={id}>
                    {category.label}
                  </option>
                ))}
              </select>

              <select
                value={newRecPattern}
                onChange={(e) => setNewRecPattern(e.target.value as 'daily' | 'weekly' | 'monthly')}
                className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isProcessing || !newRecTitle.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm flex items-center gap-2"
            >
              {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {editingRecId ? 'Update Recurring' : 'Create Recurring'}
            </button>
          </form>
        )}

        <div className="space-y-2">
          {recurringTasks.map((rt) => (
            <div key={rt.id} className="flex items-center justify-between bg-stone-100 dark:bg-stone-800 rounded-xl p-3">
              <div>
                <p className="font-medium">{rt.title}</p>
                <p className="text-xs text-stone-500">{rt.pattern}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingRecId(rt.id);
                    setIsAddingRecurring(true);
                    setNewRecTitle(rt.title);
                    setNewRecCat(CATEGORIES[rt.categoryId] ? rt.categoryId : 'general');
                    setNewRecPattern(rt.pattern);
                  }}
                  className="px-3 py-1.5 bg-stone-200 dark:bg-stone-700 rounded-lg text-sm"
                >
                  Edit
                </button>
                <button onClick={() => deleteRecurring(rt.id)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
