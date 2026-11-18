import { create } from 'zustand';
import type {
  CreateTaskInput,
  TaskDTO,
  TaskProgressSummaryDTO,
  TaskViewFilter,
  UpdateTaskInput
} from '@shared/types/domain';
import { getLocalDateKey } from './useAppStore';
import { useStatsStore } from './useStatsStore';

interface TaskStoreState {
  tasks: TaskDTO[];
  allTasks: TaskDTO[];
  allIncompleteTasks: TaskDTO[];
  summary: TaskProgressSummaryDTO | null;
  activeFilter: TaskViewFilter;
  selectedTaskIdForFocus: string | null;
  isLoadingTasks: boolean;
  taskError: string | null;
  loadTasks: (viewOverride?: TaskViewFilter) => Promise<void>;
  setFilter: (view: TaskViewFilter) => Promise<void>;
  createTask: (input: CreateTaskInput) => Promise<TaskDTO | null>;
  updateTask: (taskId: string, input: UpdateTaskInput) => Promise<TaskDTO | null>;
  toggleComplete: (taskId: string, isCompleted: boolean) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  setSelectedTaskIdForFocus: (taskId: string | null) => void;
  linkSessionTask: (sessionId: string, taskId: string | null) => Promise<void>;
}

const EMPTY_SUMMARY: TaskProgressSummaryDTO = {
  totalTasks: 0,
  completedTasks: 0,
  incompleteTasks: 0,
  overdueTasks: 0,
  todayCompletedTasks: 0,
  totalTrackedFocusSeconds: 0
};

export const useTaskStore = create<TaskStoreState>((set, get) => ({
  tasks: [],
  allTasks: [],
  allIncompleteTasks: [],
  summary: null,
  activeFilter: 'today',
  selectedTaskIdForFocus: null,
  isLoadingTasks: false,
  taskError: null,

  loadTasks: async (viewOverride) => {
    const view = viewOverride ?? get().activeFilter;
    const todayKey = getLocalDateKey();
    const api = window.purrfectAPI;

    if (!api) {
      const currentAll = get().allTasks;
      const incomplete = currentAll.filter((t) => !t.isCompleted);
      set({
        activeFilter: view,
        tasks: filterFallbackTasks(currentAll, view, todayKey),
        allIncompleteTasks: incomplete,
        summary: {
          totalTasks: currentAll.length,
          completedTasks: currentAll.filter((t) => t.isCompleted).length,
          incompleteTasks: incomplete.length,
          overdueTasks: currentAll.filter(
            (t) => !t.isCompleted && t.deadlineAt !== null && t.deadlineAt < todayKey
          ).length,
          todayCompletedTasks: currentAll.filter(
            (t) => t.isCompleted && t.completedAt?.slice(0, 10) === todayKey
          ).length,
          totalTrackedFocusSeconds: currentAll.reduce((acc, t) => acc + t.trackedFocusSeconds, 0)
        },
        isLoadingTasks: false,
        taskError: null
      });
      return;
    }

    set({ isLoadingTasks: true, taskError: null, activeFilter: view });
    try {
      const [filteredTasks, allTasks, summary] = await Promise.all([
        api.tasks.list({ view, referenceLocalDate: todayKey }),
        api.tasks.list({ view: 'all', referenceLocalDate: todayKey }),
        api.tasks.getSummary(todayKey)
      ]);

      const allIncompleteTasks = allTasks.filter((t) => !t.isCompleted);
      const selectedId = get().selectedTaskIdForFocus;
      const selectedStillIncomplete =
        selectedId !== null && allIncompleteTasks.some((t) => t.id === selectedId);

      set({
        isLoadingTasks: false,
        tasks: filteredTasks,
        allTasks,
        allIncompleteTasks,
        summary,
        selectedTaskIdForFocus: selectedStillIncomplete ? selectedId : null
      });
    } catch (error) {
      set({
        isLoadingTasks: false,
        taskError: error instanceof Error ? error.message : 'Failed to load tasks.'
      });
    }
  },

  setFilter: async (view) => {
    await get().loadTasks(view);
  },

  createTask: async (input) => {
    set({ taskError: null });
    const api = window.purrfectAPI;

    if (!api) {
      const nowIso = new Date().toISOString();
      const created: TaskDTO = {
        id: `preview-${Date.now()}`,
        title: input.title.trim(),
        notes: input.notes?.trim() ?? '',
        category: input.category ?? 'Study',
        priority: input.priority ?? 'medium',
        estimatedMinutes: input.estimatedMinutes ?? null,
        deadlineAt: input.deadlineAt || null,
        isCompleted: false,
        completedAt: null,
        createdAt: nowIso,
        updatedAt: nowIso,
        trackedFocusSeconds: 0,
        trackedSessionsCount: 0
      };
      set((s) => ({ allTasks: [created, ...s.allTasks] }));
      await get().loadTasks();
      return created;
    }

    try {
      const created = await api.tasks.create(input);
      await get().loadTasks();
      return created;
    } catch (error) {
      set({
        taskError: error instanceof Error ? error.message : 'Failed to create task.'
      });
      return null;
    }
  },

  updateTask: async (taskId, input) => {
    set({ taskError: null });
    const api = window.purrfectAPI;

    if (!api) {
      set((s) => ({
        allTasks: s.allTasks.map((t) =>
          t.id === taskId ? { ...t, ...input, updatedAt: new Date().toISOString() } : t
        )
      }));
      await get().loadTasks();
      return get().allTasks.find((t) => t.id === taskId) ?? null;
    }

    try {
      const updated = await api.tasks.update(taskId, input);
      await get().loadTasks();
      return updated;
    } catch (error) {
      set({
        taskError: error instanceof Error ? error.message : 'Failed to update task.'
      });
      return null;
    }
  },

  toggleComplete: async (taskId, isCompleted) => {
    set({ taskError: null });
    const api = window.purrfectAPI;
    const todayKey = getLocalDateKey();

    if (!api) {
      const nowIso = new Date().toISOString();
      set((s) => ({
        allTasks: s.allTasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                isCompleted,
                completedAt: isCompleted ? nowIso : null,
                updatedAt: nowIso
              }
            : t
        )
      }));
      await get().loadTasks();
      return;
    }

    try {
      await api.tasks.toggleComplete({
        taskId,
        isCompleted,
        localDate: todayKey
      });
      await get().loadTasks();
    } catch (error) {
      set({
        taskError: error instanceof Error ? error.message : 'Failed to update task status.'
      });
    }
  },

  deleteTask: async (taskId) => {
    set({ taskError: null });
    const api = window.purrfectAPI;

    if (get().selectedTaskIdForFocus === taskId) {
      set({ selectedTaskIdForFocus: null });
    }

    if (!api) {
      set((s) => ({
        allTasks: s.allTasks.filter((t) => t.id !== taskId)
      }));
      await get().loadTasks();
      return;
    }

    try {
      await api.tasks.delete(taskId);
      await get().loadTasks();
    } catch (error) {
      set({
        taskError: error instanceof Error ? error.message : 'Failed to delete task.'
      });
    }
  },

  setSelectedTaskIdForFocus: (taskId) => {
    set({ selectedTaskIdForFocus: taskId });
  },

  linkSessionTask: async (sessionId, taskId) => {
    set({ taskError: null });
    const api = window.purrfectAPI;
    if (!api) return;

    try {
      await api.focusHistory.linkTask({ sessionId, taskId });
      await Promise.all([get().loadTasks(), useStatsStore.getState().loadStatistics()]);
    } catch (error) {
      set({
        taskError:
          error instanceof Error ? error.message : 'Failed to link session to task.'
      });
    }
  }
}));

export { EMPTY_SUMMARY };

function filterFallbackTasks(
  tasks: TaskDTO[],
  view: TaskViewFilter,
  todayKey: string
): TaskDTO[] {
  switch (view) {
    case 'incomplete':
      return tasks.filter((t) => !t.isCompleted);
    case 'completed':
      return tasks.filter((t) => t.isCompleted);
    case 'overdue':
      return tasks.filter(
        (t) => !t.isCompleted && t.deadlineAt !== null && t.deadlineAt < todayKey
      );
    case 'today':
      return tasks.filter(
        (t) => !t.isCompleted || (t.isCompleted && t.completedAt?.slice(0, 10) === todayKey)
      );
    case 'all':
    default:
      return tasks;
  }
}

