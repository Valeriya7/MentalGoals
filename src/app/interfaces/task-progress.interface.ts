export interface TaskProgress {
  taskId: string;
  completed: boolean;
  completedAt?: Date;
}

export interface TaskProgressDocument {
  tasks: TaskProgress[];
} 