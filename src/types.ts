export type Category = 'snhu' | 'auto' | 'family' | 'home' | 'general';

export type RecurrencePattern = 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  user_id: string; // Required for Supabase ownership
  title: string;
  categoryId: Category;
  isCompleted: boolean;
  createdAt: number | string; // Supabase returns ISO strings
  isFocus: boolean;
  scheduledDate?: string; // Format: YYYY-MM-DD
  recurrenceId?: string; // Links to a RecurringTask ID
}

export interface RecurringTask {
  id: string;
  user_id: string; // Required for Supabase ownership
  title: string;
  categoryId: Category;
  pattern: RecurrencePattern;
  daysOfWeek?: number[]; // 0-6 for weekly
  createdAt: number | string;
}

export interface ListItem {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface CustomList {
  id: string;
  user_id: string; // Required for Supabase ownership
  title: string;
  items: ListItem[];
  createdAt: number | string;
}

export const CATEGORIES: Record<Category, { label: string; color: string; icon: string }> = {
  snhu: { 
    label: 'SNHU (College)', 
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', 
    icon: 'GraduationCap' 
  },
  auto: { 
    label: 'Auto Projects', 
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', 
    icon: 'Wrench' 
  },
  family: { 
    label: 'Family & Kids', 
    color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-300', 
    icon: 'Heart' 
  },
  home: { 
    label: 'Home & Cleaning', 
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300', 
    icon: 'Home' 
  },
  general: { 
    label: 'General', 
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', 
    icon: 'List' 
  },
};