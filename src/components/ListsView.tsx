import React, { useEffect, useState } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  List as ListIcon,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { CustomList, ListItem } from '../types';
import { api } from '../services/api';

interface ListsViewProps {
  lists: CustomList[];
  setLists: React.Dispatch<React.SetStateAction<CustomList[]>>;
}

function normalizeListItem(item: any): ListItem | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const id = item.id == null ? '' : String(item.id);
  const textValue =
    typeof item.text === 'string'
      ? item.text
      : typeof item.title === 'string'
        ? item.title
        : '';
  const text = textValue.trim();

  if (!id || !text) {
    return null;
  }

  return {
    id,
    text,
    isCompleted: item.isCompleted === true || item.is_completed === true,
  };
}

function normalizeList(list: any): CustomList | null {
  if (!list || typeof list !== 'object') {
    return null;
  }

  const id = list.id == null ? '' : String(list.id);

  if (!id) {
    return null;
  }

  const items: ListItem[] = [];
  const seenItemIds = new Set<string>();

  if (Array.isArray(list.items)) {
    for (const item of list.items) {
      const normalizedItem = normalizeListItem(item);

      if (!normalizedItem || seenItemIds.has(normalizedItem.id)) {
        continue;
      }

      seenItemIds.add(normalizedItem.id);
      items.push(normalizedItem);
    }
  }

  return {
    id,
    user_id: String(list.userId ?? list.user_id ?? ''),
    title: String(list.title ?? list.name ?? ''),
    items,
    createdAt: list.createdAt ?? list.created_at,
  };
}

function isCustomList(list: CustomList | null): list is CustomList {
  return list !== null;
}

export default function ListsView({ lists, setLists }: ListsViewProps) {
  const [newListTitle, setNewListTitle] = useState('');
  const [expandedListId, setExpandedListId] = useState<string | null>(null);
  const [newItemTexts, setNewItemTexts] = useState<Record<string, string>>({});

  useEffect(() => {
    const loadLists = async () => {
      try {
        const data = await api.get('/lists');

        const mapped: CustomList[] = Array.isArray(data)
          ? data.map(normalizeList).filter(isCustomList)
          : [];

        setLists(mapped);
      } catch (err) {
        console.error('Failed to load lists:', err);
      }
    };

    loadLists();
  }, [setLists]);

  const handleCreateList = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    try {
      const created = await api.post('/lists', {
        name: newListTitle.trim(),
      });

      const newList = normalizeList(created);

      if (!newList) {
        throw new Error('Invalid list response');
      }

      setLists((prev) => [newList, ...prev]);
      setNewListTitle('');
      setExpandedListId(newList.id);
    } catch (err) {
      console.error('Failed to create list:', err);
    }
  };

  const handleDeleteList = async (id: string) => {
    try {
      await api.delete(`/lists/${id}`);
      setLists((prev) => prev.filter((list) => list.id !== id));

      if (expandedListId === id) {
        setExpandedListId(null);
      }
    } catch (err) {
      console.error('Failed to delete list:', err);
    }
  };

  const handleAddItem = async (e: React.FormEvent, listId: string) => {
    e.preventDefault();
    const text = newItemTexts[listId]?.trim();
    if (!text) return;

    try {
      const updated = await api.post(`/lists/${listId}/items`, { text });
      const updatedList = normalizeList(updated);

      if (!updatedList) {
        throw new Error('Invalid list response');
      }

      setLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? {
                ...list,
                ...updatedList,
              }
            : list
        )
      );

      setNewItemTexts((prev) => ({ ...prev, [listId]: '' }));
    } catch (err) {
      console.error('Failed to add list item:', err);
    }
  };

  const toggleItem = async (listId: string, itemId: string) => {
    const item = lists
      .find((list) => list.id === listId)
      ?.items.find((listItem) => listItem.id === itemId);

    if (!item) return;

    try {
      const updated = await api.put(`/lists/${listId}/items/${itemId}`, {
        isCompleted: !item.isCompleted,
      });
      const updatedList = normalizeList(updated);

      if (!updatedList) {
        throw new Error('Invalid list response');
      }

      setLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? {
                ...list,
                ...updatedList,
              }
            : list
        )
      );
    } catch (err) {
      console.error('Failed to update list item:', err);
    }
  };

  const deleteItem = async (listId: string, itemId: string) => {
    try {
      const updated = await api.delete(`/lists/${listId}/items/${itemId}`);
      const updatedList = normalizeList(updated);

      if (!updatedList) {
        throw new Error('Invalid list response');
      }

      setLists((prev) =>
        prev.map((list) =>
          list.id === listId
            ? {
                ...list,
                ...updatedList,
              }
            : list
        )
      );
    } catch (err) {
      console.error('Failed to delete list item:', err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto pb-24">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100 mb-4 flex items-center gap-2">
          <ListIcon className="w-6 h-6 text-indigo-500" />
          My Lists
        </h2>

        <form onSubmit={handleCreateList} className="flex gap-2">
          <input
            type="text"
            value={newListTitle}
            onChange={(e) => setNewListTitle(e.target.value)}
            placeholder="Create a new list (e.g., Packing list)..."
            className="flex-1 bg-white dark:bg-stone-800 border-2 border-stone-200 dark:border-stone-700 rounded-xl px-4 py-3 text-stone-900 dark:text-stone-100 outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!newListTitle.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create
          </button>
        </form>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {lists.map((list) => (
            <motion.div
              key={list.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-stone-800 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-700 overflow-hidden"
            >
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors"
                onClick={() =>
                  setExpandedListId(expandedListId === list.id ? null : list.id)
                }
              >
                <div className="flex items-center gap-3">
                  {expandedListId === list.id ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}

                  <h3 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
                    {list.title}
                  </h3>

                  <span className="text-xs font-medium bg-stone-100 dark:bg-stone-700 px-2 py-1 rounded-full">
                    {list.items.filter((item) => item.isCompleted).length} /{' '}
                    {list.items.length}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteList(list.id);
                  }}
                  className="p-2 text-stone-400 hover:text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <AnimatePresence>
                {expandedListId === list.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-stone-100 dark:border-stone-700 bg-stone-50/30 dark:bg-stone-900/10"
                  >
                    <div className="p-4">
                      <form
                        onSubmit={(e) => handleAddItem(e, list.id)}
                        className="flex gap-2 mb-4"
                      >
                        <input
                          type="text"
                          value={newItemTexts[list.id] || ''}
                          onChange={(e) =>
                            setNewItemTexts((prev) => ({
                              ...prev,
                              [list.id]: e.target.value,
                            }))
                          }
                          placeholder="Add item..."
                          className="flex-1 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-3 py-2 text-sm text-stone-900 dark:text-stone-100"
                        />
                        <button
                          type="submit"
                          className="bg-stone-200 dark:bg-stone-700 px-3 py-2 rounded-lg text-sm font-medium"
                        >
                          Add
                        </button>
                      </form>

                      <div className="space-y-2">
                        {list.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-3 group"
                          >
                            <button
                              onClick={() => toggleItem(list.id, item.id)}
                              className={
                                item.isCompleted
                                  ? 'text-indigo-500'
                                  : 'text-stone-300'
                              }
                            >
                              {item.isCompleted ? (
                                <CheckCircle2 className="w-5 h-5" />
                              ) : (
                                <Circle className="w-5 h-5" />
                              )}
                            </button>

                            <span
                              className={`flex-1 text-sm ${
                                item.isCompleted
                                  ? 'text-stone-400 line-through'
                                  : ''
                              }`}
                            >
                              {item.text}
                            </span>

                            <button
                              onClick={() => deleteItem(list.id, item.id)}
                              className="opacity-0 group-hover:opacity-100 text-stone-400 hover:text-red-500"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
