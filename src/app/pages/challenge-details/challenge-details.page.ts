import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { ChallengeService } from '../../services/challenge.service';
import { Challenge, ChallengeTask, ChallengePhase } from '../../interfaces/challenge.interface';
import { TranslateModule } from '@ngx-translate/core';
import { addIcons } from 'ionicons';
import {
  closeCircleOutline,
  iceCreamOutline,
  cafeOutline,
  fitnessOutline,
  footstepsOutline,
  bookOutline,
  checkmarkCircleOutline,
  starOutline,
  pricetagOutline,
  alertCircleOutline
} from 'ionicons/icons';
import { ToastController } from '@ionic/angular';
import { TaskProgress } from '../../interfaces/task-progress.interface';

@Component({
  selector: 'app-challenge-details',
  templateUrl: './challenge-details.page.html',
  styleUrls: ['./challenge-details.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ChallengeDetailsPageComponent implements OnInit {
  challenge: Challenge | null = null;
  currentPhase: ChallengePhase | null = null;
  taskProgress: TaskProgress[] = [];
  todayProgress: { [key: string]: boolean } = {};
  statistics = {
    completedDays: 0,
    totalDays: 40,
    completedTasks: 0,
    totalTasks: 0,
    progress: 0,
    totalCompletedTasks: 0
  };
  progressHistory: any[] | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private challengeService: ChallengeService,
    private toastController: ToastController
  ) {
    addIcons({
      closeCircleOutline,
      iceCreamOutline,
      cafeOutline,
      fitnessOutline,
      footstepsOutline,
      bookOutline,
      checkmarkCircleOutline,
      starOutline,
      pricetagOutline,
      alertCircleOutline
    });
  }

  ngOnInit() {
    this.loadChallenge();
  }

  private async loadChallenge() {
    this.isLoading = true;
    this.error = null;
    try {
      const challengeId = this.route.snapshot.paramMap.get('id');
      if (challengeId) {
        const loadedChallenge = await this.challengeService.getChallenge(challengeId);
        if (loadedChallenge) {
          this.challenge = loadedChallenge;
          this.currentPhase = loadedChallenge.phases[0];
          this.taskProgress = await this.challengeService.getTaskProgress(challengeId);
          this.todayProgress = await this.challengeService.getTodayProgress(challengeId);
          this.updateTasksStatus();
          await this.calculateStatistics(challengeId);
          await this.loadProgress();
        }
      }
    } catch (error) {
      console.error('Error loading challenge:', error);
      this.error = 'Помилка завантаження челенджу';
    } finally {
      this.isLoading = false;
    }
  }

  async calculateStatistics(id: string) {
    try {
      const challenge = await this.challengeService.getChallenge(id);
      if (!challenge) return;

      const today = new Date();
      const startDate = challenge.startDate ? new Date(challenge.startDate) : today;
      const completedDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      // Отримуємо прогрес за сьогодні
      const todayKey = today.toISOString().split('T')[0];
      const todayProgress = challenge.progress?.[todayKey];

      // Отримуємо загальний прогрес
      let totalCompletedTasks = 0;
      let totalDaysWithProgress = 0;

      if (challenge.progress) {
        Object.values(challenge.progress).forEach(dayProgress => {
          if (dayProgress.completedTasks > 0) {
            totalDaysWithProgress++;
          }
          totalCompletedTasks += dayProgress.completedTasks;
        });
      }

      // Рахуємо виконані завдання за сьогодні
      const completedTasks = todayProgress?.completedTasks || 0;
      const totalTasks = challenge.tasks.length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      this.statistics = {
        completedDays: totalDaysWithProgress,
        totalDays: challenge.duration,
        completedTasks,
        totalTasks,
        progress,
        totalCompletedTasks
      };
    } catch (error) {
      console.error('Error calculating statistics:', error);
    }
  }

  async loadProgress() {
    if (!this.challenge) return;

    try {
      // Оновлюємо прогрес за сьогодні
      this.todayProgress = await this.challengeService.getTodayProgress(this.challenge.id);

      // Оновлюємо статус завдань
      this.updateTasksStatus();

      // Оновлюємо статистику
      await this.calculateStatistics(this.challenge.id);

      // Отримуємо історію прогресу
      const progress = await this.challengeService.getChallengeProgress(this.challenge.id);
      this.progressHistory = progress;
      console.log('- - - progress - - ', progress);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  }

  getTaskCompletionTime(taskId: string): string | null {
    console.log('taskId: ',taskId);
    console.log('this.progressHistory: ',this.progressHistory);
   // const progress = await this.challengeService.getChallengeProgress(this.challenge.id);
    //this.progressHistory = progress;

    console.log('this.progressHistory: ',this.progressHistory);
    if (!this.progressHistory) return null;

    for (const day of this.progressHistory) {
      const task = day.tasks[taskId];
      console.log('task: ',task);
      if (task?.completedAt) {

        console.log('task.completedAt: ',task.completedAt);
        return task.completedAt;
      }
    }
    return null;
  }

  getTasksByProgress(progress: number): ChallengeTask[] {
    if (!this.currentPhase?.tasks) return [];

    switch(progress) {
      case 100: // Completed tasks
        return this.currentPhase.tasks.filter(task => task.completed);
      case 50: // In progress tasks
        return this.currentPhase.tasks.filter(task => !task.completed && task.progress > 0);
      case 0: // Not started tasks
        return this.currentPhase.tasks.filter(task => !task.completed && task.progress === 0);
      default:
        return [];
    }
  }

  async updateTaskProgress(task: ChallengeTask, event: any) {
    if (!this.challenge) return;

    const isCompleted = event.detail.checked;

    try {
      // Спочатку оновлюємо на сервері
      await this.challengeService.updateTodayProgress(this.challenge.id, task.id, isCompleted);

      // Якщо оновлення успішне, оновлюємо локальний стан
      task.completed = isCompleted;
      task.progress = isCompleted ? 100 : 0;
      this.todayProgress[task.id] = isCompleted;

      // Оновлюємо статистику
      await this.calculateStatistics(this.challenge.id);

      // Показуємо повідомлення про успіх
      const toast = await this.toastController.create({
        message: isCompleted ? 'Завдання виконано!' : 'Завдання скасовано',
        duration: 2000,
        color: isCompleted ? 'success' : 'medium',
        position: 'bottom'
      });
      toast.present();
    } catch (error) {
      console.error('Error updating task status:', error);

      // У випадку помилки показуємо повідомлення
      const toast = await this.toastController.create({
        message: 'Помилка оновлення завдання',
        duration: 2000,
        color: 'danger',
        position: 'bottom'
      });
      toast.present();

      // Повертаємо попередній стан чекбокса
      task.completed = !isCompleted;
      task.progress = !isCompleted ? 100 : 0;
      this.todayProgress[task.id] = !isCompleted;
    }
  }

  updateTasksStatus() {
    if (this.currentPhase?.tasks) {
      this.currentPhase.tasks.forEach(task => {
        const isCompleted = this.todayProgress[task.id] || false;
        task.completed = isCompleted;
        task.progress = isCompleted ? 100 : 0;
      });
    }
  }

  async quitChallenge() {
    if (this.challenge) {
      const alert = document.createElement('ion-alert');
      alert.header = 'Підтвердження';
      alert.message = 'Ви впевнені, що хочете відмовитись від челенджу?';
      alert.buttons = [
        {
          text: 'Відміна',
          role: 'cancel'
        },
        {
          text: 'Так, відмовитись',
          role: 'confirm',
          handler: async () => {
            const success = await this.challengeService.quitChallenge(this.challenge!.id);
            if (success) {
              this.router.navigate(['/tabs/challenges']);
            }
          }
        }
      ];

      document.body.appendChild(alert);
      await alert.present();
    }
  }

  async toggleTaskCompletion(task: ChallengeTask) {
    if (!this.challenge) return;

    try {
      const isCompleted = this.isTaskCompleted(task.id);
      if (isCompleted) {
        await this.challengeService.uncompleteTask(this.challenge.id, task.id);
      } else {
        await this.challengeService.completeTask(this.challenge.id, task.id);
      }
      await this.loadChallenge();
    } catch (error) {
      console.error('Error toggling task completion:', error);
    }
  }

  isTaskCompleted(taskId: string): boolean {
    return this.taskProgress.some(progress => progress.taskId === taskId && progress.completed);
  }

  getTaskCompletionDate(taskId: string): Date | undefined {
    const progress = this.taskProgress.find(p => p.taskId === taskId);
    return progress?.completedAt;
  }
}
