import { Component, OnInit } from '@angular/core';
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
  calendarOutline,
  chevronBackOutline,
  chevronForwardOutline
} from 'ionicons/icons';

@Component({
  selector: 'app-challenge-details',
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/challenges"></ion-back-button>
        </ion-buttons>
        <ion-title>{{ challenge?.title }}</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="quitChallenge()" color="danger">
            <ion-icon name="close-circle-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ng-container *ngIf="challenge">
        <!-- Прогрес челенджу -->
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ challenge.title }}</ion-card-title>
            <ion-card-subtitle>{{ challenge.description }}</ion-card-subtitle>
          </ion-card-header>
          
          <ion-card-content>
            <div class="progress-info">
              <p>День {{ statistics.completedDays }} з {{ statistics.totalDays }}</p>
              <ion-progress-bar
                [value]="statistics.completedDays / statistics.totalDays"
                [color]="statistics.progress >= 70 ? 'success' : 'warning'"
                class="days-progress">
              </ion-progress-bar>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Календар -->
        <ion-card class="calendar-card">
          <ion-card-header>
            <div class="calendar-header">
              <ion-button fill="clear" (click)="previousWeek()">
                <ion-icon name="chevron-back-outline"></ion-icon>
              </ion-button>
              <h3>{{ currentWeekLabel }}</h3>
              <ion-button fill="clear" (click)="nextWeek()">
                <ion-icon name="chevron-forward-outline"></ion-icon>
              </ion-button>
            </div>
          </ion-card-header>
          <ion-card-content>
            <div class="calendar-grid">
              <div *ngFor="let day of weekDays" 
                   [class.active]="isCurrentDay(day.date)"
                   [class.past]="isPastDay(day.date)"
                   [class.future]="isFutureDay(day.date)"
                   [class.has-tasks]="day.hasCompletedTasks"
                   (click)="selectDay(day)">
                <span class="day-name">{{ day.name }}</span>
                <span class="day-date">{{ day.date }}</span>
                <ion-icon *ngIf="day.hasCompletedTasks" 
                         name="checkmark-circle-outline" 
                         color="success">
                </ion-icon>
              </div>
            </div>
          </ion-card-content>
        </ion-card>

        <!-- Завдання на вибраний день -->
        <ion-list>
          <ion-list-header>
            <ion-label>
              Завдання на {{ selectedDate | date }}
            </ion-label>
          </ion-list-header>

          <ion-item *ngFor="let task of currentPhase?.tasks">
            <ion-checkbox 
              slot="start" 
              [checked]="task.completed"
              [disabled]="isFutureDay(selectedDate)"
              (ionChange)="updateTaskProgress(task, $event)">
            </ion-checkbox>
            <ion-label>
              <h2>{{ task.title }}</h2>
              <p *ngIf="task.description">{{ task.description }}</p>
            </ion-label>
            <ion-icon 
              *ngIf="task.icon" 
              [name]="task.icon" 
              slot="end" 
              [color]="task.completed ? 'success' : 'medium'">
            </ion-icon>
          </ion-item>
        </ion-list>

        <!-- Загальна статистика -->
        <ion-card class="statistics-card">
          <ion-card-header>
            <ion-card-title>Статистика</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <ion-grid>
              <ion-row>
                <ion-col>
                  <div class="stat-item">
                    <ion-text color="primary">
                      <h2>{{ statistics.completedTasks }}</h2>
                    </ion-text>
                    <ion-text color="medium">
                      <p>Виконано завдань</p>
                    </ion-text>
                  </div>
                </ion-col>
                <ion-col>
                  <div class="stat-item">
                    <ion-text color="primary">
                      <h2>{{ statistics.totalTasks }}</h2>
                    </ion-text>
                    <ion-text color="medium">
                      <p>Всього завдань</p>
                    </ion-text>
                  </div>
                </ion-col>
                <ion-col>
                  <div class="stat-item">
                    <ion-text [color]="statistics.progress >= 70 ? 'success' : 'warning'">
                      <h2>{{ statistics.progress }}%</h2>
                    </ion-text>
                    <ion-text color="medium">
                      <p>Прогрес</p>
                    </ion-text>
                  </div>
                </ion-col>
              </ion-row>
            </ion-grid>

            <ion-progress-bar
              [value]="statistics.progress / 100"
              [color]="statistics.progress >= 70 ? 'success' : 'warning'"
              class="progress-bar">
            </ion-progress-bar>
          </ion-card-content>
        </ion-card>
      </ng-container>
    </ion-content>
  `,
  styles: [`
    .progress-info {
      text-align: center;
      margin-bottom: 1rem;
      
      p {
        margin-bottom: 0.5rem;
        color: var(--ion-color-medium);
      }
    }

    .days-progress {
      height: 8px;
      border-radius: 4px;
    }

    .calendar-card {
      margin: 1rem 0;

      .calendar-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        
        h3 {
          margin: 0;
          font-size: 1.1rem;
        }
      }

      .calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 0.5rem;
        margin-top: 1rem;

        > div {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 0.5rem;
          border-radius: 8px;
          cursor: pointer;
          position: relative;

          &.active {
            background-color: var(--ion-color-primary);
            color: white;
          }

          &.past {
            color: var(--ion-color-medium);
          }

          &.future {
            color: var(--ion-color-medium);
            opacity: 0.7;
          }

          &.has-tasks {
            ion-icon {
              position: absolute;
              bottom: -4px;
              right: -4px;
              font-size: 1rem;
              background: white;
              border-radius: 50%;
            }
          }

          .day-name {
            font-size: 0.8rem;
            margin-bottom: 0.2rem;
          }

          .day-date {
            font-size: 1rem;
            font-weight: bold;
          }
        }
      }
    }

    .statistics-card {
      margin-top: 1rem;
    }
    
    .stat-item {
      text-align: center;
      
      h2 {
        font-size: 24px;
        margin: 0;
      }
      
      p {
        margin: 5px 0 0;
        font-size: 14px;
      }
    }

    .progress-bar {
      margin-top: 16px;
      height: 8px;
      border-radius: 4px;
    }
  `],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule]
})
export class ChallengeDetailsPage implements OnInit {
  challenge: Challenge | undefined;
  currentPhase: ChallengePhase | undefined;
  selectedDate: Date = new Date();
  weekDays: any[] = [];
  currentWeekLabel: string = '';
  todayProgress: { [key: string]: boolean } = {};
  statistics = {
    completedDays: 0,
    totalDays: 40,
    completedTasks: 0,
    totalTasks: 0,
    progress: 0
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private challengeService: ChallengeService
  ) {
    addIcons({
      closeCircleOutline,
      iceCreamOutline,
      cafeOutline,
      fitnessOutline,
      footstepsOutline,
      bookOutline,
      checkmarkCircleOutline,
      calendarOutline,
      chevronBackOutline,
      chevronForwardOutline
    });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.loadChallenge(id);
      await this.loadStatistics(id);
      this.generateWeekDays();
      await this.loadSelectedDayProgress();
    }
  }

  async loadChallenge(id: string) {
    try {
      this.challenge = await this.challengeService.getChallenge(id);
      if (this.challenge) {
        this.currentPhase = await this.challengeService.getCurrentPhase(id);
        this.todayProgress = await this.challengeService.getTodayProgress(id);
        this.updateTasksStatus();
      }
    } catch (error) {
      console.error('Error loading challenge:', error);
    }
  }

  async loadStatistics(id: string) {
    try {
      this.statistics = await this.challengeService.getStatistics(id);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  }

  generateWeekDays() {
    const startDate = new Date(this.selectedDate);
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    const dayNames = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    this.weekDays = [];
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      
      this.weekDays.push({
        name: dayNames[date.getDay()],
        date: date.getDate(),
        fullDate: date,
        hasCompletedTasks: false // Буде оновлено після завантаження прогресу
      });
    }

    this.updateWeekLabel();
  }

  updateWeekLabel() {
    const firstDay = this.weekDays[0].fullDate;
    const lastDay = this.weekDays[6].fullDate;
    this.currentWeekLabel = `${firstDay.getDate()} - ${lastDay.getDate()} ${lastDay.toLocaleString('uk-UA', { month: 'long' })}`;
  }

  previousWeek() {
    this.selectedDate.setDate(this.selectedDate.getDate() - 7);
    this.generateWeekDays();
    this.loadSelectedDayProgress();
  }

  nextWeek() {
    this.selectedDate.setDate(this.selectedDate.getDate() + 7);
    this.generateWeekDays();
    this.loadSelectedDayProgress();
  }

  async selectDay(day: any) {
    this.selectedDate = new Date(day.fullDate);
    await this.loadSelectedDayProgress();
  }

  async loadSelectedDayProgress() {
    if (this.challenge) {
      this.todayProgress = await this.challengeService.getTodayProgress(
        this.challenge.id,
        this.selectedDate.toISOString().split('T')[0]
      );
      this.updateTasksStatus();

      // Оновлюємо статус виконаних завдань для всіх днів тижня
      for (const day of this.weekDays) {
        const dayProgress = await this.challengeService.getTodayProgress(
          this.challenge.id,
          day.fullDate.toISOString().split('T')[0]
        );
        day.hasCompletedTasks = Object.values(dayProgress).some(Boolean);
      }
    }
  }

  isCurrentDay(date: number): boolean {
    const today = new Date();
    return date === today.getDate() && 
           this.selectedDate.getMonth() === today.getMonth() &&
           this.selectedDate.getFullYear() === today.getFullYear();
  }

  isPastDay(date: Date): boolean {
    return new Date(date).getTime() < new Date().setHours(0, 0, 0, 0);
  }

  isFutureDay(date: Date): boolean {
    return new Date(date).getTime() > new Date().setHours(23, 59, 59, 999);
  }

  async updateTaskProgress(task: ChallengeTask, event: any) {
    const completed = event.detail.checked;
    if (this.challenge) {
      await this.challengeService.updateTodayProgress(this.challenge.id, task.id, completed);
      task.completed = completed;
      await this.loadStatistics(this.challenge.id);
      await this.loadSelectedDayProgress();
    }
  }

  updateTasksStatus() {
    if (this.currentPhase) {
      this.currentPhase.tasks.forEach(task => {
        task.completed = this.todayProgress[task.id] || false;
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
} 