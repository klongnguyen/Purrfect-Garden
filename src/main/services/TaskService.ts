import { randomUUID } from 'crypto';
import type Database from 'better-sqlite3';
import type {
  CreateTaskInput,
  TaskDTO,
  TaskListFilterInput,
  TaskPriority,
  TaskProgressSummaryDTO,
  ToggleTaskCompleteInput,
  UpdateTaskInput
} from '@shared/types/domain';
import { formatLocalDateKey } from './TimerSupervisor';

interface TaskRow {
  id: string;
  title: string;
  notes: string;
  category: string;
  priority: TaskPriority;
  estimated_minutes: number | null;
  deadline_at: string | null;
  is_completed: number;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  tracked_focus_seconds: number;
  tracked_sessions_count: number;
}

const VALID_PRIORITIES: readonly TaskPriority[] = ['low', 'medium', 'high'];

const TASK_WITH_STATS_SELECT = `
  SELECT
    t.id,
    t.title,
    COALESCE(t.notes, '') AS notes,
    t.category,
    t.priority,
    t.estimated_minutes,
    t.deadline_at,
    t.is_completed,
    t.completed_at,
    t.created_at,
    t.updated_at,
    COALESCE(stats.tracked_focus_seconds, 0) AS tracked_focus_seconds,
    COALESCE(stats.tracked_sessions_count, 0) AS tracked_sessions_count
  FROM tasks t
  LEFT JOIN (
    SELECT
      task_id,
      COALESCE(SUM(recorded_seconds), 0) AS tracked_focus_seconds,
      COUNT(*) AS tracked_sessions_count
    FROM focus_sessions
    WHERE phase = 'focus' AND status IN ('completed', 'stopped') AND task_id IS NOT NULL
    GROUP BY task_id
  ) stats ON stats.task_id = t.id
`;

export class TaskService {
  constructor(private readonly db: Database.Database) {}

  getTaskById(taskId: string): TaskDTO {
    const row = this.db
      .prepare(`${TASK_WITH_STATS_SELECT} WHERE t.id = ?`)
      .get(taskId) as TaskRow | undefined;

    if (!row) {
      throw new Error(`Task not found: ${taskId}`);
    }

    return mapTaskRow(row);
  }

  listTasks(filter?: TaskListFilterInput): TaskDTO[] {
    const view = filter?.view ?? 'all';
    const refDate = filter?.referenceLocalDate ?? formatLocalDateKey(new Date());
    const conditions: string[] = [];
    const params: Array<string> = [];

    switch (view) {
      case 'incomplete':
        conditions.push('t.is_completed = 0');
        break;
      case 'completed':
        conditions.push('t.is_completed = 1');
        break;
      case 'overdue':
        conditions.push(
          "t.is_completed = 0 AND t.deadline_at IS NOT NULL AND substr(t.deadline_at, 1, 10) < ?"
        );
        params.push(refDate);
        break;
      case 'today':
        conditions.push(
          '(t.is_completed = 0 OR (t.is_completed = 1 AND substr(t.completed_at, 1, 10) = ?))'
        );
        params.push(refDate);
        break;
      case 'all':
      default:
        break;
    }

    if (filter?.category && filter.category.trim().length > 0) {
      conditions.push('t.category = ?');
      params.push(filter.category.trim());
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const rows = this.db
      .prepare(
        `
        ${TASK_WITH_STATS_SELECT}
        ${whereClause}
        ORDER BY
          t.is_completed ASC,
          CASE t.priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END ASC,
          (t.deadline_at IS NULL) ASC,
          t.deadline_at ASC,
          t.created_at DESC
      `
      )
      .all(...params) as TaskRow[];

    return rows.map(mapTaskRow);
  }

  getTaskSummary(referenceLocalDate: string): TaskProgressSummaryDTO {
    const counts = this.db
      .prepare(
        `
        SELECT
          COUNT(*) AS total_tasks,
          COALESCE(SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END), 0) AS completed_tasks,
          COALESCE(SUM(CASE WHEN is_completed = 0 THEN 1 ELSE 0 END), 0) AS incomplete_tasks,
          COALESCE(SUM(CASE WHEN is_completed = 0 AND deadline_at IS NOT NULL AND substr(deadline_at, 1, 10) < ? THEN 1 ELSE 0 END), 0) AS overdue_tasks,
          COALESCE(SUM(CASE WHEN is_completed = 1 AND substr(completed_at, 1, 10) = ? THEN 1 ELSE 0 END), 0) AS today_completed_tasks
        FROM tasks
      `
      )
      .get(referenceLocalDate, referenceLocalDate) as {
      total_tasks: number;
      completed_tasks: number;
      incomplete_tasks: number;
      overdue_tasks: number;
      today_completed_tasks: number;
    };

    const focusRow = this.db
      .prepare(
        `
        SELECT COALESCE(SUM(recorded_seconds), 0) AS total_tracked_focus_seconds
        FROM focus_sessions
        WHERE phase = 'focus' AND status IN ('completed', 'stopped') AND task_id IS NOT NULL
      `
      )
      .get() as { total_tracked_focus_seconds: number };

    return {
      totalTasks: counts.total_tasks,
      completedTasks: counts.completed_tasks,
      incompleteTasks: counts.incomplete_tasks,
      overdueTasks: counts.overdue_tasks,
      todayCompletedTasks: counts.today_completed_tasks,
      totalTrackedFocusSeconds: focusRow.total_tracked_focus_seconds
    };
  }

  createTask(input: CreateTaskInput): TaskDTO {
    const validated = validateTaskFields({
      title: input.title,
      notes: input.notes ?? '',
      category: input.category ?? 'Study',
      priority: input.priority ?? 'medium',
      estimatedMinutes: input.estimatedMinutes ?? null,
      deadlineAt: input.deadlineAt ?? null
    });

    const id = randomUUID();
    const nowIso = new Date().toISOString();

    this.db
      .prepare(
        `
        INSERT INTO tasks (
          id, title, notes, category, priority,
          estimated_minutes, deadline_at, is_completed, completed_at,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, NULL, ?, ?)
      `
      )
      .run(
        id,
        validated.title,
        validated.notes,
        validated.category,
        validated.priority,
        validated.estimatedMinutes,
        validated.deadlineAt,
        nowIso,
        nowIso
      );

    return this.getTaskById(id);
  }

  updateTask(taskId: string, input: UpdateTaskInput): TaskDTO {
    const existing = this.getTaskById(taskId);

    const validated = validateTaskFields({
      title: input.title ?? existing.title,
      notes: input.notes ?? existing.notes,
      category: input.category ?? existing.category,
      priority: input.priority ?? existing.priority,
      estimatedMinutes:
        input.estimatedMinutes !== undefined ? input.estimatedMinutes : existing.estimatedMinutes,
      deadlineAt: input.deadlineAt !== undefined ? input.deadlineAt : existing.deadlineAt
    });

    const nowIso = new Date().toISOString();
    this.db
      .prepare(
        `
        UPDATE tasks
        SET
          title = ?,
          notes = ?,
          category = ?,
          priority = ?,
          estimated_minutes = ?,
          deadline_at = ?,
          updated_at = ?
        WHERE id = ?
      `
      )
      .run(
        validated.title,
        validated.notes,
        validated.category,
        validated.priority,
        validated.estimatedMinutes,
        validated.deadlineAt,
        nowIso,
        taskId
      );

    return this.getTaskById(taskId);
  }

  toggleTaskCompletion(input: ToggleTaskCompleteInput): TaskDTO {
    const nowIso = new Date().toISOString();

    const toggleTx = this.db.transaction(() => {
      const existing = this.getTaskById(input.taskId);
      const nextCompleted = Boolean(input.isCompleted);

      this.db
        .prepare(
          `
          UPDATE tasks
          SET
            is_completed = ?,
            completed_at = ?,
            updated_at = ?
          WHERE id = ?
        `
        )
        .run(nextCompleted ? 1 : 0, nextCompleted ? nowIso : null, nowIso, input.taskId);

      if (existing.isCompleted !== nextCompleted) {
        if (nextCompleted) {
          this.db
            .prepare(
              `
              INSERT INTO daily_activities (
                local_date, valid_focus_seconds, completed_sessions_count,
                completed_tasks_count, streak_qualified, updated_at
              ) VALUES (?, 0, 0, 1, 0, ?)
              ON CONFLICT(local_date) DO UPDATE SET
                completed_tasks_count = completed_tasks_count + 1,
                updated_at = excluded.updated_at
            `
            )
            .run(input.localDate, nowIso);
        } else {
          this.db
            .prepare(
              `
              UPDATE daily_activities
              SET
                completed_tasks_count = MAX(0, completed_tasks_count - 1),
                updated_at = ?
              WHERE local_date = ?
            `
            )
            .run(nowIso, input.localDate);
        }
      }
    });

    toggleTx();
    return this.getTaskById(input.taskId);
  }

  deleteTask(taskId: string): void {
    this.db.prepare('DELETE FROM tasks WHERE id = ?').run(taskId);
  }
}

function validateTaskFields(fields: {
  title: string;
  notes: string;
  category: string;
  priority: TaskPriority;
  estimatedMinutes: number | null;
  deadlineAt: string | null;
}): {
  title: string;
  notes: string;
  category: string;
  priority: TaskPriority;
  estimatedMinutes: number | null;
  deadlineAt: string | null;
} {
  const title = fields.title.trim();
  if (title.length === 0) {
    throw new Error('Task title cannot be empty.');
  }

  const category = fields.category.trim() || 'Study';

  if (!VALID_PRIORITIES.includes(fields.priority)) {
    throw new Error(`Invalid task priority: ${fields.priority}`);
  }

  let estimatedMinutes: number | null = fields.estimatedMinutes;
  if (estimatedMinutes !== null) {
    if (!Number.isInteger(estimatedMinutes) || estimatedMinutes <= 0) {
      throw new Error('Estimated minutes must be a positive integer.');
    }
  }

  const normalizedDeadline =
    fields.deadlineAt && fields.deadlineAt.trim().length > 0
      ? fields.deadlineAt.trim()
      : null;

  return {
    title,
    notes: fields.notes.trim(),
    category,
    priority: fields.priority,
    estimatedMinutes,
    deadlineAt: normalizedDeadline
  };
}

function mapTaskRow(row: TaskRow): TaskDTO {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    category: row.category,
    priority: row.priority,
    estimatedMinutes: row.estimated_minutes,
    deadlineAt: row.deadline_at,
    isCompleted: row.is_completed === 1,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    trackedFocusSeconds: row.tracked_focus_seconds,
    trackedSessionsCount: row.tracked_sessions_count
  };
}
