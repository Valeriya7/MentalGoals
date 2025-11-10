import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthGuard } from '../../guards/auth.guard';
import { Preferences } from '@capacitor/preferences';
import { NavController } from '@ionic/angular';

@Component({
  selector: 'app-questions',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, RouterModule],
  providers: [DataService, AuthGuard],
  templateUrl: './questions.page.html',
  styleUrls: ['./questions.page.scss'],
})
export class QuestionsPage implements OnInit {
  questions: any[] = [];
  currentIndex: number = 0;
  userAnswers: any = {};
  currentSlideIndex = 0;
  userAnswers2: { [key: number]: string } = {};

  constructor(
    private router: Router,
    private dataService: DataService,
    private navCtrl: NavController
  ) {}

  ngOnInit() {
    this.loadQuestions();
  }

  async loadQuestions() {
    try {
      // Завжди використовуємо англійську мову
      const langFile = 'en.json';
      console.log('Loading questions from:', langFile);

      const response = await fetch(`assets/json/${langFile}`);
      const data = await response.json();
      this.questions = data.questions;
      console.log('Questions loaded:', this.questions);
    } catch (error) {
      console.error('Error loading questions:', error);
      // Якщо є помилка, все одно намагаємося завантажити англійські питання
      try {
        const response = await fetch('assets/json/en.json');
        const data = await response.json();
        this.questions = data.questions;
        console.log('Fallback to English questions:', this.questions);
      } catch (error) {
        console.error('Error loading English questions:', error);
        this.questions = []; // Встановлюємо пустий масив якщо не вдалося завантажити
      }
    }
  }

  async saveAnswers() {
    try {
      console.log('Starting to save answers...');
      
      // Перевіряємо, чи користувач авторизований
      const { value: userData } = await Preferences.get({ key: 'userData' });
      if (!userData) {
        console.warn('No user data found, saving locally only');
        localStorage.setItem('quizAnswers', JSON.stringify(this.userAnswers));
        localStorage.setItem('quizAnswers2', JSON.stringify(this.userAnswers2));
        return 'Answers saved locally';
      }

      const user = JSON.parse(userData);
      console.log('User data found:', { id: user.id, email: user.email });

      // Зберігаємо локально в будь-якому випадку
      localStorage.setItem('quizAnswers', JSON.stringify(this.userAnswers));
      localStorage.setItem('quizAnswers2', JSON.stringify(this.userAnswers2));
      
      // Перевіряємо, чи Firebase користувач авторизований
      const firebaseUser = this.dataService['firebaseService'].currentUser;
      if (!firebaseUser) {
        console.warn('Firebase user not authenticated, saving locally only');
        return 'Answers saved locally (Firebase not authenticated)';
      }
      
      console.log('Firebase user authenticated:', firebaseUser.uid);
      
      // Намагаємося зберегти в Firebase
      try {
        await this.dataService.saveQuestionAnswers({
          answers: this.userAnswers,
          answers2: this.userAnswers2,
          timestamp: new Date(),
          userId: user.id
        });
        console.log('Answers saved to Firebase successfully');
      } catch (firebaseError) {
        console.warn('Firebase save failed, but answers are saved locally:', firebaseError);
        // Не кидаємо помилку, оскільки дані збережені локально
      }
      
      console.log('Answers saved successfully');
      return 'Answers successfully saved';
    } catch (error) {
      console.error('Error saving answers:', error);
      // Зберігаємо локально якщо все інше не вдалося
      localStorage.setItem('quizAnswers', JSON.stringify(this.userAnswers));
      localStorage.setItem('quizAnswers2', JSON.stringify(this.userAnswers2));
      return 'Answers saved locally due to error';
    }
  }

  isAnswerSelected(): boolean {
    if (!this.questions.length) return false;
    const currentQuestionId = this.questions[this.currentSlideIndex]?.id;
    return currentQuestionId !== undefined && currentQuestionId in this.userAnswers;
  }

  onAnswerChange(id: any) {
    console.log('Selected answer for question:', id);
    // Не зберігаємо при кожній зміні, тільки при завершенні
  }

  saveAnswer(answer: string, questionId: number) {
    this.userAnswers[questionId] = answer;
    console.log('Answer saved:', { questionId, answer });
  }

  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentSlideIndex = this.currentIndex;
      this.currentIndex++;
      console.log('Moving to next question:', this.currentIndex);
    } else {
      console.log('All questions answered, submitting answers');
      this.submitAnswers();
    }
  }

  async submitAnswers() {
    try {
      console.log('Submitting answers...');
      
      // Зберігаємо відповіді локально в будь-якому випадку
      localStorage.setItem('quizAnswers', JSON.stringify(this.userAnswers));
      localStorage.setItem('quizAnswers2', JSON.stringify(this.userAnswers2));
      console.log('Answers saved locally');
      
      // Скидаємо прапорець першого входу
      await Preferences.set({ key: 'isFirstLogin', value: 'false' });
      console.log('First login flag reset to false');
      
      // Намагаємося зберегти в Firebase, але не блокуємо навігацію
      this.saveAnswers().then(result => {
        console.log('Firebase save result:', result);
      }).catch(error => {
        console.warn('Firebase save failed, but continuing with navigation:', error);
      });
      
      console.log('Answers submitted, navigating to home');
      
      // Гарантована навігація на домашню сторінку
      await this.navigateToHome();
      
    } catch (error) {
      console.error('Error in submitAnswers:', error);
      
      // Навіть якщо є помилка, все одно перенаправляємо
      console.log('Error occurred, but still navigating to home...');
      await this.navigateToHome();
    }
  }

  // Метод для пропуску Firebase збереження (для тестування)
  async skipFirebaseAndNavigate() {
    try {
      console.log('Skipping Firebase save and navigating directly...');
      
      // Зберігаємо локально
      localStorage.setItem('quizAnswers', JSON.stringify(this.userAnswers));
      localStorage.setItem('quizAnswers2', JSON.stringify(this.userAnswers2));
      console.log('Answers saved locally');
      
      // Скидаємо прапорець першого входу
      await Preferences.set({ key: 'isFirstLogin', value: 'false' });
      console.log('First login flag reset to false');
      
      // Навігація на домашню сторінку
      await this.navigateToHome();
      
    } catch (error) {
      console.error('Error in skipFirebaseAndNavigate:', error);
      await this.navigateToHome();
    }
  }

  private async navigateToHome() {
    try {
      // Використовуємо NavController для кращої навігації
      await this.navCtrl.navigateRoot('/tabs/home', {
        animated: true,
        animationDirection: 'forward'
      });
      console.log('Navigation to home successful via NavController');
    } catch (navError) {
      console.warn('NavController failed, trying Router:', navError);
      
      try {
        await this.router.navigate(['/tabs/home'], { replaceUrl: true });
        console.log('Navigation to home successful via Router');
      } catch (routerError) {
        console.error('Router navigation failed, using window.location:', routerError);
        window.location.href = '/tabs/home';
      }
    }
  }
}
