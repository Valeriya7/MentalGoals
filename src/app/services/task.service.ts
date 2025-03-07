import { Injectable } from '@angular/core';
import { Task } from '../models/task.model';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private readonly STORAGE_KEY = 'tasks';

  async getTasks(): Promise<Task[]> {
    const { value } = await Preferences.get({ key: this.STORAGE_KEY });
    return value ? JSON.parse(value) : [];
  }

  async addTask(task: Task): Promise<void> {
    const tasks = await this.getTasks();
    tasks.push(task);
    await Preferences.set({ key: this.STORAGE_KEY, value: JSON.stringify(tasks) });
  }

  async updateTask(task: Task): Promise<void> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex(t => t.id === task.id);
    if (index !== -1) {
      tasks[index] = task;
      await Preferences.set({ key: this.STORAGE_KEY, value: JSON.stringify(tasks) });
    }
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = await this.getTasks();
    const filtered = tasks.filter(t => t.id !== id);
    await Preferences.set({ key: this.STORAGE_KEY, value: JSON.stringify(filtered) });
  }
} 