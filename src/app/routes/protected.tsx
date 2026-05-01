import { redirect, useLoaderData, useNavigate } from 'react-router'
import React, { useState, useMemo, useEffect } from 'react'
import {
  Plus,
  Circle,
  Target,
  Sun,
  Moon,
  Sparkles,
  Loader2,
  LogOut,
  Brain,
  List,
  Calendar as CalendarIcon,
  ArrowUpRight,
  Trash2,
} from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'

import { db } from '../../services/db'
import { Task, Category, RecurringTask, CustomList, CATEGORIES } from '../../types'
import { breakDownTask } from '../../services/ai'
import { clearToken, getToken } from '@/lib/auth'
import { useAuth } from '@/lib/AuthProvider'

import CalendarView from '../../components/CalendarView'
import ListsView from '../../components/ListsView'
import BrainDumpView from '../../components/BrainDumpView'
import { Button } from '@/components/ui/button'

function normalizeTask(task: any): Task {
  return {
    ...task,
    userId: String(task.userId ?? task.user_id ?? ''),
    categoryId: task.categoryId ?? task.category_id ?? 'general',
    isCompleted: task.isCompleted ?? task.is_completed ?? false,
    isFocus: task.isFocus ?? task.is_focus ?? false,
    scheduledDate: task.scheduledDate ?? task.scheduled_date ?? null,
    recurrenceId: task.recurrenceId ?? task.recurrence_id ?? null,
    createdAt: task.createdAt ?? task.created_at,
    updatedAt: task.updatedAt ?? task.updated_at,
  }
}

export const clientLoader = async () => {
  const token = getToken()

  if (!token) {
    return redirect('/login')
  }

  try {
    const rawTasks = await db.getTasks()
    const initialTasks = Array.isArray(rawTasks) ? rawTasks.map(normalizeTask) : []

    return {
      initialTasks,
      profile: { is_dark_mode: true },
    }
  } catch {
    clearToken()
    return redirect('/login')
  }
}

export default function ProtectedPage() {
  const { initialTasks, profile } = useLoaderData<typeof clientLoader>()
  const navigate = useNavigate()
  const { user, loading } = useAuth()

  const [tasks, setTasks] = useState<Task[]>(Array.isArray(initialTasks) ? initialTasks : [])
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([])
  const [lists, setLists] = useState<CustomList[]>([])
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<Category>('general')
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [activeView, setActiveView] = useState<'today' | 'brain-dump' | 'calendar' | 'lists'>('today')
  const [isBreakingDown, setIsBreakingDown] = useState<string | null>(null)
  const [isDarkMode, setIsDarkMode] = useState(profile.is_dark_mode)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode)
  }, [isDarkMode])

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login')
    }
  }, [loading, navigate, user])

  const handleLogout = () => {
    clearToken()
    navigate('/login')
  }

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTaskTitle.trim()) return

    const savedTask = normalizeTask(
      await db.createTask({
        title: newTaskTitle.trim(),
        description: '',
        priority: 'medium',
        categoryId: selectedCategory,
      })
    )

    setTasks((prev) => [savedTask, ...prev])
    setNewTaskTitle('')
  }

  const toggleTaskCompletion = async (id: string) => {
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    const newStatus = task.status === 'completed' ? 'pending' : 'completed'

    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)))
    const updatedTask = await db.updateTask(id, { status: newStatus })

    if (updatedTask) {
      const normalized = normalizeTask(updatedTask)
      setTasks((prev) => prev.map((t) => (t.id === id ? normalized : t)))
    }
  }

  const deleteTask = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
    await db.deleteTask(id)
  }

  const handlePromoteToToday = async (id: string) => {
    const today = new Date().toISOString().split('T')[0]
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, scheduledDate: today } : t)))

    const updatedTask = await db.updateTask(id, { scheduledDate: today } as Partial<Task>)
    if (updatedTask) {
      const normalized = normalizeTask(updatedTask)
      setTasks((prev) => prev.map((t) => (t.id === id ? normalized : t)))
    }
  }

  const handleAIBreakdown = async (task: Task) => {
    setIsBreakingDown(task.id)
    try {
      const steps = await breakDownTask(task.title)
      if (steps?.length) {
        const subTasks = await Promise.all(
          steps.map((step) =>
            db.createTask({
              title: step,
              description: '',
              priority: task.priority || 'medium',
            })
          )
        )
        await db.deleteTask(task.id)
        setTasks((prev) => [...subTasks.map(normalizeTask), ...prev.filter((t) => t.id !== task.id)])
      }
    } finally {
      setIsBreakingDown(null)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]
  const focusTask = useMemo(() => tasks.find((t) => t.isFocus && t.status !== 'completed'), [tasks])

  const todayTasks = useMemo(
    () =>
      tasks.filter(
        (t) => t.status !== 'completed' && !t.isFocus && t.scheduledDate && t.scheduledDate <= todayStr
      ),
    [tasks, todayStr]
  )

  const brainDumpTasks = useMemo(
    () => tasks.filter((t) => t.status !== 'completed' && !t.scheduledDate),
    [tasks]
  )

  const groupedBrainDump = useMemo(() => {
    const groups: Record<string, Task[]> = {}
    brainDumpTasks.forEach((task) => {
      const key = task.categoryId || 'general'
      if (!groups[key]) groups[key] = []
      groups[key].push(task)
    })
    return groups
  }, [brainDumpTasks])

  const tabs = [
    { id: 'today', label: 'Today', icon: Target },
    { id: 'brain-dump', label: 'Brain Dump', icon: Brain },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'lists', label: 'Lists', icon: List },
  ] as const

  if (loading || !user) {
    return <div className="min-h-screen bg-black p-6 text-white">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-950 dark:bg-black dark:text-white">
      <header className="sticky top-0 z-20 border-b border-stone-200 bg-white/90 backdrop-blur dark:border-stone-800 dark:bg-black/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-2xl font-semibold">TaskMaster</h1>
            <p className="text-sm text-stone-500 dark:text-stone-400">Signed in as {user.email}</p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsDarkMode((value) => !value)}
              aria-label={isDarkMode ? 'Use light mode' : 'Use dark mode'}
            >
              {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </Button>
            <Button type="button" variant="outline" onClick={handleLogout} className="gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="mb-8 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-950">
          <form onSubmit={handleAddTask} className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
            <input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Capture a task..."
              className="min-h-11 rounded-lg border border-stone-200 bg-stone-50 px-4 text-stone-950 outline-none transition-colors focus:border-stone-500 dark:border-stone-800 dark:bg-black dark:text-white"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as Category)}
              className="min-h-11 rounded-lg border border-stone-200 bg-stone-50 px-3 text-stone-950 outline-none transition-colors focus:border-stone-500 dark:border-stone-800 dark:bg-black dark:text-white"
            >
              {Object.entries(CATEGORIES).map(([id, category]) => (
                <option key={id} value={id}>
                  {category.label}
                </option>
              ))}
            </select>
            <Button type="submit" disabled={!newTaskTitle.trim()} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Task
            </Button>
          </form>
        </section>

        <nav className="mb-8 grid grid-cols-2 gap-2 rounded-2xl border border-stone-200 bg-white p-2 dark:border-stone-800 dark:bg-stone-950 md:grid-cols-4">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeView === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveView(tab.id)}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-stone-950 text-white dark:bg-white dark:text-stone-950'
                    : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {activeView === 'today' && (
          <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
            <section>
              {focusTask && (
                <div className="mb-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-500/10">
                  <p className="mb-2 text-xs font-semibold uppercase text-amber-700 dark:text-amber-300">
                    Focus task
                  </p>
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-lg font-semibold">{focusTask.title}</p>
                    <Button type="button" variant="outline" size="sm" onClick={() => toggleTaskCompletion(focusTask.id)}>
                      Complete
                    </Button>
                  </div>
                </div>
              )}

              <div className="mb-4 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-2 text-xl font-semibold">
                  <Target className="h-5 w-5" />
                  Today
                </h2>
                <Button type="button" variant="outline" size="sm" onClick={() => setIsFocusMode((value) => !value)}>
                  {isFocusMode ? 'Show all' : 'Focus mode'}
                </Button>
              </div>

              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {(isFocusMode && focusTask ? [focusTask] : todayTasks).map((task) => {
                    const category = CATEGORIES[task.categoryId || 'general'] || CATEGORIES.general

                    return (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-950"
                      >
                        <div className="flex items-start gap-3">
                          <button
                            type="button"
                            onClick={() => toggleTaskCompletion(task.id)}
                            className="mt-1 text-stone-400 hover:text-emerald-500"
                            aria-label="Toggle task completion"
                          >
                            <Circle className="h-5 w-5" />
                          </button>

                          <div className="min-w-0 flex-1">
                            <p className="font-medium">{task.title}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className={`rounded-full px-2 py-1 text-xs ${category.color}`}>
                                {category.label}
                              </span>
                              {task.scheduledDate && (
                                <span className="rounded-full bg-stone-100 px-2 py-1 text-xs text-stone-600 dark:bg-stone-900 dark:text-stone-300">
                                  {task.scheduledDate}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-1">
                            {!task.scheduledDate && (
                              <Button type="button" variant="ghost" size="icon" onClick={() => handlePromoteToToday(task.id)}>
                                <ArrowUpRight className="h-4 w-4" />
                              </Button>
                            )}
                            <Button type="button" variant="ghost" size="icon" onClick={() => handleAIBreakdown(task)}>
                              {isBreakingDown === task.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Sparkles className="h-4 w-4" />
                              )}
                            </Button>
                            <Button type="button" variant="ghost" size="icon" onClick={() => deleteTask(task.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </AnimatePresence>

                {todayTasks.length === 0 && !focusTask && (
                  <div className="rounded-2xl border border-dashed border-stone-300 p-8 text-center text-stone-500 dark:border-stone-800 dark:text-stone-400">
                    Nothing scheduled for today.
                  </div>
                )}
              </div>
            </section>

            <aside className="rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-950">
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                <Brain className="h-5 w-5" />
                Brain Dump
              </h2>
              <div className="space-y-4">
                {Object.entries(groupedBrainDump).map(([category, categoryTasks]) => {
                  const categoryDefinition = CATEGORIES[category as Category] || CATEGORIES.general

                  return (
                    <div key={category}>
                      <p className="mb-2 text-xs font-semibold uppercase text-stone-500">
                        {categoryDefinition.label}
                      </p>
                      <div className="space-y-2">
                        {categoryTasks.slice(0, 4).map((task) => (
                          <button
                            key={task.id}
                            type="button"
                            onClick={() => handlePromoteToToday(task.id)}
                            className="block w-full rounded-lg border border-stone-200 px-3 py-2 text-left text-sm hover:bg-stone-50 dark:border-stone-800 dark:hover:bg-stone-900"
                          >
                            {task.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {brainDumpTasks.length === 0 && (
                  <p className="text-sm text-stone-500 dark:text-stone-400">Everything is captured or scheduled.</p>
                )}
              </div>
            </aside>
          </div>
        )}

        {activeView === 'brain-dump' && (
          <BrainDumpView
            tasks={tasks}
            setTasks={setTasks}
            onAIBreakdown={handleAIBreakdown}
            isBreakingDown={isBreakingDown}
          />
        )}

        {activeView === 'calendar' && (
          <CalendarView
            tasks={tasks}
            setTasks={setTasks}
            recurringTasks={recurringTasks}
            setRecurringTasks={setRecurringTasks}
          />
        )}

        {activeView === 'lists' && <ListsView lists={lists} setLists={setLists} />}
      </main>
    </div>
  )
}