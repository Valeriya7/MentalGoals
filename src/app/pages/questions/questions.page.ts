import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthGuard } from '../../guards/auth.guard';

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
    private dataService: DataService
  ) {}

  ngOnInit() {
    this.loadQuestions();
  }

  async loadQuestions() {
    try {
      const userLanguage = navigator.language;
      let langFile = 'en.json';

      if (userLanguage.startsWith('uk')) {
        langFile = 'uk.json';
      } else if (userLanguage.startsWith('de')) {
        langFile = 'de.json';
      }
      console.log('Loading questions from:', langFile);

      const response = await fetch(`assets/json/${langFile}`);
      const data = await response.json();
      this.questions = data.questions;
      console.log('Questions loaded:', this.questions);
    } catch (error) {
      console.error('Error loading questions:', error);
      try {
        const response = await fetch('assets/json/en.json');
        const data = await response.json();
        this.questions = data.questions;
        console.log('Fallback to English questions:', this.questions);
      } catch (error) {
        console.error('Error loading English questions:', error);
      }
    }
  }

  async saveAnswers() {
    try {
      await this.dataService.saveQuestionAnswers({
        answers: this.userAnswers,
        answers2: this.userAnswers2,
        timestamp: new Date()
      });

      localStorage.setItem('quizAnswers', JSON.stringify(this.userAnswers));
      localStorage.setItem('quizAnswers2', JSON.stringify(this.userAnswers2));
      
      console.log('Answers saved successfully');
      return 'Answers successfully saved';
    } catch (error) {
      console.error('Error saving answers:', error);
      throw new Error('Error saving to Firebase: ' + error);
    }
  }

  isAnswerSelected(): boolean {
    if (!this.questions.length) return false;
    const currentQuestionId = this.questions[this.currentSlideIndex]?.id;
    return currentQuestionId !== undefined && currentQuestionId in this.userAnswers;
  }

  onAnswerChange(id: any) {
    this.saveAnswers();
    console.log('Selected answer for question:', id);
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
      console.log('All questions answered, navigating to auth');
      this.router.navigate(['/auth']);
    }
  }

  async submitAnswers() {
    try {
      console.log('Submitting answers...');
      await this.saveAnswers();
      console.log('Answers submitted, navigating to home');
      await this.router.navigate(['/tabs/home']);
    } catch (error) {
      console.error('Error submitting answers:', error);
    }
  }
}
