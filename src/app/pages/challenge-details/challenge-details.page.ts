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
  checkmarkCircleOutline
} from 'ionicons/icons';
import { ToastController } from '@ionic/angular';

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
        <ion-card>
          <ion-card-header>
            <ion-card-title>{{ challenge.title }}</ion-card-title>
            <ion-card-subtitle>{{ challenge.description }}</ion-card-subtitle>
          </ion-card-header>
          
          <ion-card-content>
            <ion-text color="medium">
              <p>День {{ statistics.completedDays }} з {{ statistics.totalDays }}</p>
              <p>Початок: {{ challenge.startDate | date }}</p>
              <p>Кінець: {{ challenge.endDate | date }}</p>
            </ion-text>
          </ion-card-content>
        </ion-card>

        <ion-list>
          <ion-list-header>
            <ion-label>Завдання на сьогодні</ion-label>
          </ion-list-header>

          <ion-item *ngFor="let task of currentPhase?.tasks">
            <ion-checkbox 
              slot="start" 
              [checked]="task.completed"
              [aria-label]="task.title"
              (ionChange)="updateTaskProgress(task, $event)">
              {{ task.title }}
            </ion-checkbox>
            <ion-label>
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
    .statistics-card {
      margin-top: 20px;
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
  imports: [IonicModule, CommonModule, TranslateModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ChallengeDetailsPage implements OnInit {
  challenge: Challenge | undefined;
  currentPhase: ChallengePhase | null | undefined;
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
      checkmarkCircleOutline
    });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      await this.loadChallenge(id);
      await this.calculateStatistics(id);
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

  async calculateStatistics(id: string) {
    try {
      const challenge = await this.challengeService.getChallenge(id);
      if (!challenge) return;

      const today = new Date();
      const startDate = challenge.startDate ? new Date(challenge.startDate) : today;
      const completedDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      const completedTasks = challenge.tasks.filter(task => task.completed).length;
      const totalTasks = challenge.tasks.length;
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      this.statistics = {
        completedDays,
        totalDays: challenge.duration,
        completedTasks,
        totalTasks,
        progress
      };
    } catch (error) {
      console.error('Error calculating statistics:', error);
    }
  }

  async updateTaskProgress(task: ChallengeTask, event: any) {
    const completed = event.detail.checked;
    if (this.challenge) {
      await this.challengeService.updateTodayProgress(this.challenge.id, task.id, completed);
      task.completed = completed;
      await this.calculateStatistics(this.challenge.id);
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