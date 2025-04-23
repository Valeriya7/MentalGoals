import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private firebaseService: FirebaseService) {}

  // Збереження відповідей на питання
  async saveQuestionAnswers(answers: any) {
    await this.firebaseService.saveData('questions', answers);
  }

  // Отримання відповідей на питання
  async getQuestionAnswers() {
    return await this.firebaseService.getData('questions');
  }

  // Збереження даних користувача
  async saveUserData(userData: any) {
    await this.firebaseService.saveData('users', userData);
  }

  // Отримання даних користувача
  async getUserData() {
    return await this.firebaseService.getData('users');
  }

  // Збереження челенджів
  async saveChallenge(challenge: any) {
    await this.firebaseService.saveData('challenges', challenge);
  }

  // Отримання челенджів
  async getChallenges() {
    return await this.firebaseService.getData('challenges');
  }

  // Збереження звичок
  async saveHabit(habit: any) {
    await this.firebaseService.saveData('habits', habit);
  }

  // Отримання звичок
  async getHabits() {
    return await this.firebaseService.getData('habits');
  }

  // Збереження емоцій
  async saveEmotion(emotion: any) {
    await this.firebaseService.saveData('emotions', emotion);
  }

  // Отримання емоцій
  async getEmotions() {
    return await this.firebaseService.getData('emotions');
  }

  // Збереження балів
  async savePoints(points: number) {
    await this.firebaseService.saveData('points', { points, date: new Date() });
  }

  // Отримання балів
  async getPoints() {
    return await this.firebaseService.getData('points');
  }
} 