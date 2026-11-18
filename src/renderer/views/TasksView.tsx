import { useEffect, useState, type FormEvent } from 'react';
import type { TaskDTO, TaskPriority, TaskViewFilter } from '@shared/types/domain';
import { getLocalDateKey, useAppStore } from '../stores/useAppStore';
import { useTaskStore } from '../stores/useTaskStore';
import { formatDurationHuman } from '../utils/formatTime';
import { PixelIcon } from '../components/ui/PixelIcon';

const FILTER_TABS: ReadonlyArray<{ id: TaskViewFilter; label: string }> = [
  { id: 'today', label: 'Today' },
  { id: 'incomplete', label: 'Incomplete' },
  { id: 'completed', label: 'Completed' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'all', label: 'All Tasks' }
];

const PRIORITY_BADGE_CLASSES: Record<TaskPriority, string> = {
  high: 'bg-cozy-peach/15 text-cozy-peach border-cozy-peach/40',
  medium: 'bg-cozy-amber/25 text-cozy-wood border-cozy-amber/60',
  low: 'bg-cozy-meadow text-cozy-sage-dark border-cozy-sage/40'
};

export function TasksView() {
  const tasks = useTaskStore((s) => s.tasks);
  const summary = useTaskStore((s) => s.summary);
  const activeFilter = useTaskStore((s) => s.activeFilter);
  const taskError = useTaskStore((s) => s.taskError);
  const loadTasks = useTaskStore((s) => s.loadTasks);
  const setFilter = useTaskStore((s) => s.setFilter);
  const createTask = useTaskStore((s) => s.createTask);
  const updateTask = useTaskStore((s) => s.updateTask);
  const toggleComplete = useTaskStore((s) => s.toggleComplete);
  const deleteTask = useTaskStore((s) => s.deleteTask);
  const setSelectedTaskIdForFocus = useTaskStore((s) => s.setSelectedTaskIdForFocus);
  const setActiveSection = useAppStore((s) => s.setActiveSection);

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Study');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [deadlineAt, setDeadlineAt] = useState('');
  const [notes, setNotes] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  const todayKey = getLocalDateKey();

  const resetForm = () => {
    setEditingTaskId(null);
    setTitle('');
    setCategory('Study');
    setPriority('medium');
    setEstimatedMinutes('');
    setDeadlineAt('');
    setNotes('');
  };

  const handleStartEdit = (task: TaskDTO) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setCategory(task.category);
    setPriority(task.priority);
    setEstimatedMinutes(task.estimatedMinutes !== null ? String(task.estimatedMinutes) : '');
    setDeadlineAt(task.deadlineAt ?? '');
    setNotes(task.notes);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const parsedEstimate =
      estimatedMinutes.trim().length > 0 ? Number(estimatedMinutes) : null;

    if (editingTaskId) {
      const updated = await updateTask(editingTaskId, {
        title,
        category,
        priority,
        estimatedMinutes: parsedEstimate,
        deadlineAt: deadlineAt.trim() || null,
        notes
      });
      if (updated) resetForm();
      return;
    }

    const created = await createTask({
      title,
      category,
      priority,
      estimatedMinutes: parsedEstimate,
      deadlineAt: deadlineAt.trim() || null,
      notes
    });
    if (created) resetForm();
  };

  const handleFocusOnTask = (taskId: string) => {
    setSelectedTaskIdForFocus(taskId);
    setActiveSection('focus');
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <span className="pixel-pill">
          <PixelIcon name="tasks" size={14} />
          Daily Task Management
        </span>
        <h2 className="mt-2 text-2xl font-bold text-cozy-wood">
          Today&apos;s Tasks &amp; Focus Priorities
        </h2>
      </header>

      {taskError && (
        <div className="rounded-xl border border-cozy-peach/40 bg-cozy-peach/10 px-4 py-2.5 text-xs font-medium text-cozy-peach">
          {taskError}
        </div>
      )}

      {/* Summary KPI Row */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="cozy-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-cozy-muted">
            Incomplete Tasks
          </p>
          <p className="mt-1.5 text-2xl font-bold text-cozy-ink">
            {summary?.incompleteTasks ?? 0}
          </p>
        </div>
        <div className="cozy-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-cozy-muted">
            Completed Tasks
          </p>
          <p className="mt-1.5 text-2xl font-bold text-cozy-sage-dark">
            {summary?.completedTasks ?? 0}
          </p>
          <p className="text-[11px] text-cozy-muted">
            {summary?.todayCompletedTasks ?? 0} completed today
          </p>
        </div>
        <div className="cozy-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-cozy-muted">
            Overdue Tasks
          </p>
          <p className="mt-1.5 text-2xl font-bold text-cozy-peach">
            {summary?.overdueTasks ?? 0}
          </p>
        </div>
        <div className="cozy-card p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-cozy-muted">
            Focus Time on Tasks
          </p>
          <p className="mt-1.5 text-2xl font-bold text-cozy-wood">
            {formatDurationHuman(summary?.totalTrackedFocusSeconds ?? 0)}
          </p>
        </div>
      </section>

      {/* Create / Edit Task Form */}
      <form onSubmit={handleSubmit} className="cozy-card space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-cozy-wood">
            {editingTaskId ? 'Edit Task' : 'Add a New Task'}
          </h3>
          {editingTaskId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 text-xs font-bold text-cozy-muted hover:text-cozy-wood"
            >
              <PixelIcon name="close" size={14} />
              Cancel Edit
            </button>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1 text-xs font-semibold text-cozy-wood sm:col-span-2">
            <span>Task Title *</span>
            <input
              type="text"
              required
              placeholder="e.g., Review Chapter 4 notes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="cozy-input"
            />
          </label>

          <label className="space-y-1 text-xs font-semibold text-cozy-wood">
            <span>Category</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="cozy-input"
            >
              <option value="Study">Study</option>
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
            </select>
          </label>

          <label className="space-y-1 text-xs font-semibold text-cozy-wood">
            <span>Priority</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="cozy-input"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <label className="space-y-1 text-xs font-semibold text-cozy-wood">
            <span>Estimated Minutes (Optional)</span>
            <input
              type="number"
              min={1}
              max={600}
              placeholder="e.g., 25"
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(e.target.value)}
              className="cozy-input"
            />
          </label>

          <label className="space-y-1 text-xs font-semibold text-cozy-wood">
            <span>Deadline (Optional)</span>
            <input
              type="date"
              value={deadlineAt}
              onChange={(e) => setDeadlineAt(e.target.value)}
              className="cozy-input"
            />
          </label>

          <label className="space-y-1 text-xs font-semibold text-cozy-wood sm:col-span-2">
            <span>Notes (Optional)</span>
            <input
              type="text"
              placeholder="Short reminder or topic details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="cozy-input"
            />
          </label>
        </div>

        <div className="flex justify-end">
          <button type="submit" className="cozy-btn-primary">
            <PixelIcon name="plus" size={14} />
            <span>{editingTaskId ? 'Save Task Changes' : 'Add Task'}</span>
          </button>
        </div>
      </form>

      {/* Filter Tabs + Task List */}
      <section className="cozy-card space-y-4 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cozy-border/70 pb-3">
          <div className="inline-flex flex-wrap gap-1.5">
            {FILTER_TABS.map((tab) => {
              const active = activeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => void setFilter(tab.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? 'bg-cozy-sage text-white shadow-pixel-sm'
                      : 'bg-cozy-cream text-cozy-wood hover:bg-cozy-panel'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <span className="text-xs text-cozy-muted">
            Showing {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}
          </span>
        </div>

        <div className="space-y-2.5">
          {tasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-cozy-border bg-cozy-cream/60 p-8 text-center text-xs text-cozy-muted">
              No tasks in this view. Add one above or switch tabs!
            </div>
          ) : (
            tasks.map((task) => {
              const isOverdue =
                !task.isCompleted && task.deadlineAt !== null && task.deadlineAt < todayKey;
              return (
                <div
                  key={task.id}
                  className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${
                    task.isCompleted
                      ? 'border-cozy-border/60 bg-cozy-panel/60 opacity-80'
                      : 'border-cozy-border bg-cozy-cream/70'
                  }`}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.isCompleted}
                      onChange={() => void toggleComplete(task.id, !task.isCompleted)}
                      aria-label={`Mark ${task.title} as ${task.isCompleted ? 'incomplete' : 'complete'}`}
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-cozy-sage"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`text-sm font-semibold ${
                            task.isCompleted
                              ? 'text-cozy-muted line-through'
                              : 'text-cozy-ink'
                          }`}
                        >
                          {task.title}
                        </p>
                        <span
                          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${PRIORITY_BADGE_CLASSES[task.priority]}`}
                        >
                          {task.priority}
                        </span>
                        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-cozy-wood">
                          {task.category}
                        </span>
                      </div>

                      {task.notes && (
                        <p className="mt-0.5 text-xs text-cozy-muted">{task.notes}</p>
                      )}

                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] text-cozy-muted">
                        {task.deadlineAt && (
                          <span
                            className={`inline-flex items-center gap-1 ${
                              isOverdue ? 'font-bold text-cozy-peach' : ''
                            }`}
                          >
                            <PixelIcon name="calendar" size={12} />
                            Due: {task.deadlineAt}
                            {isOverdue ? ' (Overdue)' : ''}
                          </span>
                        )}
                        {task.estimatedMinutes !== null && (
                          <span className="inline-flex items-center gap-1">
                            <PixelIcon name="timer" size={12} />
                            Est: {task.estimatedMinutes}m
                          </span>
                        )}
                        <span className="font-medium text-cozy-sage-dark">
                          Focused: {formatDurationHuman(task.trackedFocusSeconds)} ·{' '}
                          {task.trackedSessionsCount}{' '}
                          {task.trackedSessionsCount === 1 ? 'session' : 'sessions'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {!task.isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleFocusOnTask(task.id)}
                        className="cozy-btn-primary px-2.5 py-1 text-xs"
                      >
                        <PixelIcon name="play" size={12} />
                        Focus
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleStartEdit(task)}
                      className="border-2 border-[#3D2112] bg-[#FAF0DC] p-1.5 text-cozy-wood shadow-pixel-sm hover:bg-cozy-panel"
                      aria-label={`Edit ${task.title}`}
                    >
                      <PixelIcon name="pencil" size={14} />
                    </button>

                    {confirmDeleteId === task.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirmDeleteId(null);
                          void deleteTask(task.id);
                        }}
                        className="border-2 border-[#3D2112] bg-[#D95B34] px-2.5 py-1 text-xs font-bold text-white shadow-pixel-sm"
                      >
                        Confirm?
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(task.id)}
                        className="border-2 border-[#3D2112] bg-[#FAF0DC] p-1.5 text-[#D95B34] shadow-pixel-sm hover:bg-[#F5D0C5]"
                        aria-label={`Delete ${task.title}`}
                      >
                        <PixelIcon name="trash" size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}

