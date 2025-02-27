import { Component, OnInit } from '@angular/core';
import { IonicModule } from '@ionic/angular'; // Додаємо модулі Ionic
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
//import { QuestionService } from '../../services/question.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-questions',
  standalone: true, // Це standalone компонент
  imports: [CommonModule, IonicModule, FormsModule], // Додаємо модулі
  templateUrl: './questions.page.html',
  styleUrls: ['./questions.page.scss'],
})
export class QuestionsPage implements OnInit {
  questions: any[] = [];
  currentIndex: number = 0;
  userAnswers: any = {};
  currentSlideIndex = 0;

  userAnswers2: { [key: number]: string } = {};
  //userAnswers: { [key: number]: string } = {};

  constructor(
    //private questionService: QuestionService,
     private router: Router) {}

  ngOnInit() {
    this.loadQuestions(); // Load questions from the JSON file
  }
  async loadQuestions() {
    try {
      const userLanguage = navigator.language; // Get user language ("en", "uk", "de", etc.)
      let langFile = 'en.json'; // Default to English

      if (userLanguage.startsWith('uk')) {
        langFile = 'uk.json'; // Ukrainian
      } else if (userLanguage.startsWith('de')) {
        langFile = 'de.json'; // German
      }
      console.log('langFile: ', langFile);

      // Fetch the appropriate JSON file
      const response = await fetch(`assets/json/${langFile}`);
      const data = await response.json();
      this.questions = data.questions;
      console.log('Questions:', this.questions);
    } catch (error) {
      console.error('Error loading questions:', error);
      // Fallback to English if no suitable file is found
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
  saveAnswers() {
    console.log('Selected answers:', this.userAnswers);

    return new Promise((resolve, reject) => {
      try {
        localStorage.setItem('quizAnswers', JSON.stringify(this.userAnswers));
        localStorage.setItem('quizAnswers2', JSON.stringify(this.userAnswers2));
        resolve('Answers successfully saved');  // Success response
      } catch (error) {
        reject('Error saving to localStorage: ' + error);  // Error response
      }
    })
      .then((message) => {
        console.log(message);  // 'Answers successfully saved'
      })
      .catch((error) => {
        console.error(error);  // Handle error during save
      });
  }
  isAnswerSelected(): boolean {
    if (!this.questions.length) return false; // If questions are not loaded

    const currentQuestionId = this.questions[this.currentSlideIndex]?.id;
    return currentQuestionId !== undefined && currentQuestionId in this.userAnswers;
  }
  // Update answers when a selection changes
  onAnswerChange(id: any) {

    this.saveAnswers();
    console.log('Selected answers: id', id);
  }
  // Save an individual answer
  saveAnswer(answer: string, questionId: number) {
    this.userAnswers[questionId] = answer;
    console.log('saveAnswer: ', this.userAnswers);
  }
  nextQuestion() {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentSlideIndex = this.currentIndex;
      this.currentIndex++;
    } else {
      this.router.navigate(['/auth']);
    }
  }
  submitAnswers(){
    console.log('Selected answers:', this.userAnswers2);
  }
}
