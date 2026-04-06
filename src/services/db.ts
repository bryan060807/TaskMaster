import { getToken } from "../lib/auth";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function apiUrl(path) {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${API_BASE}${normalized}`;
}

async function request(path, options = {}) {
  const token = getToken();

  const res = await fetch(apiUrl(path), {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    ...options,
  });

  return res.json();
}

export const db = {
  getTasks: () => request("/tasks"),
  createTask: (data) => request("/tasks", { method: "POST", body: JSON.stringify(data) }),
  updateTask: (id, data) => request(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteTask: (id) => request(`/tasks/${id}`, { method: "DELETE" }),
  getRecurringTasks: () => request("/recurring-tasks"),
  createRecurringTask: (data) => request("/recurring-tasks", { method: "POST", body: JSON.stringify(data) }),
  updateRecurringTask: (id, data) => request(`/recurring-tasks/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteRecurringTask: (id) => request(`/recurring-tasks/${id}`, { method: "DELETE" }),
};
