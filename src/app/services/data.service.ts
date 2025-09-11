import { Injectable } from '@angular/core';
import { FirebaseService } from './firebase.service';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  constructor(private firebaseService: FirebaseService) {}

  // Отримання ID поточного користувача
  private async getCurrentUserId(): Promise<string | null> {
    try {
      const { value } = await Preferences.get({ key: 'userData' });
      if (value) {
        const userData = JSON.parse(value);
        return userData.id || null;
      }
      return null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }

  // Збереження відповідей на питання
  async saveQuestionAnswers(answers: any) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.warn('No user ID found, saving without user ID');
        await this.firebaseService.saveData('questions', answers);
        return;
      }
      
      console.log('Saving question answers for user:', userId);
      await this.firebaseService.setDocument('questions', userId, answers);
    } catch (error) {
      console.error('Error saving question answers:', error);
      // Зберігаємо локально якщо Firebase не працює
      await this.saveLocally('questionAnswers', answers);
    }
  }

  // Збереження даних користувача
  async saveUserData(userData: any) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.warn('No user ID found, saving without user ID');
        await this.firebaseService.saveData('users', userData);
        return;
      }
      
      console.log('Saving user data for user:', userId);
      await this.firebaseService.setDocument('users', userId, userData);
    } catch (error) {
      console.error('Error saving user data:', error);
      await this.saveLocally('userData', userData);
    }
  }

  // Збереження челенджів
  async saveChallenge(challenge: any) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.warn('No user ID found, saving without user ID');
        await this.firebaseService.saveData('challenges', challenge);
        return;
      }
      
      const challengeId = challenge.id || Date.now().toString();
      console.log('Saving challenge for user:', userId);
      await this.firebaseService.setDocument('challenges', `${userId}_${challengeId}`, challenge);
    } catch (error) {
      console.error('Error saving challenge:', error);
      await this.saveLocally('challenges', challenge);
    }
  }

  // Збереження звичок
  async saveHabit(habit: any) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.warn('No user ID found, saving without user ID');
        await this.firebaseService.saveData('habits', habit);
        return;
      }
      
      const habitId = habit.id || Date.now().toString();
      console.log('Saving habit for user:', userId);
      await this.firebaseService.setDocument('habits', `${userId}_${habitId}`, habit);
    } catch (error) {
      console.error('Error saving habit:', error);
      await this.saveLocally('habits', habit);
    }
  }

  // Збереження емоцій
  async saveEmotion(emotion: any) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.warn('No user ID found, saving without user ID');
        await this.firebaseService.saveData('emotions', emotion);
        return;
      }
      
      const emotionId = emotion.id || Date.now().toString();
      console.log('Saving emotion for user:', userId);
      await this.firebaseService.setDocument('emotions', `${userId}_${emotionId}`, emotion);
    } catch (error) {
      console.error('Error saving emotion:', error);
      await this.saveLocally('emotions', emotion);
    }
  }

  // Збереження балів
  async savePoints(points: number) {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.warn('No user ID found, saving without user ID');
        await this.firebaseService.saveData('points', { points, date: new Date() });
        return;
      }
      
      console.log('Saving points for user:', userId);
      await this.firebaseService.setDocument('points', userId, { 
        points, 
        date: new Date(),
        userId 
      });
    } catch (error) {
      console.error('Error saving points:', error);
      await this.saveLocally('points', { points, date: new Date() });
    }
  }

  // Локальне збереження даних
  private async saveLocally(key: string, data: any) {
    try {
      await Preferences.set({
        key: `local_${key}`,
        value: JSON.stringify(data)
      });
      console.log(`Data saved locally: ${key}`);
    } catch (error) {
      console.error(`Error saving data locally: ${key}`, error);
    }
  }

  // Отримання відповідей на питання
  async getQuestionAnswers() {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return await this.firebaseService.getData('questions');
      }
      return await this.firebaseService.getDocument('questions', userId);
    } catch (error) {
      console.error('Error getting question answers:', error);
      return this.getLocally('questionAnswers');
    }
  }

  // Отримання даних користувача
  async getUserData() {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return await this.firebaseService.getData('users');
      }
      return await this.firebaseService.getDocument('users', userId);
    } catch (error) {
      console.error('Error getting user data:', error);
      return this.getLocally('userData');
    }
  }

  // Отримання челенджів
  async getChallenges() {
    try {
      return await this.firebaseService.getData('challenges');
    } catch (error) {
      console.error('Error getting challenges:', error);
      return this.getLocally('challenges');
    }
  }

  // Отримання звичок
  async getHabits() {
    try {
      return await this.firebaseService.getData('habits');
    } catch (error) {
      console.error('Error getting habits:', error);
      return this.getLocally('habits');
    }
  }

  // Отримання емоцій
  async getEmotions() {
    try {
      return await this.firebaseService.getData('emotions');
    } catch (error) {
      console.error('Error getting emotions:', error);
      return this.getLocally('emotions');
    }
  }

  // Отримання балів
  async getPoints() {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return await this.firebaseService.getData('points');
      }
      return await this.firebaseService.getDocument('points', userId);
    } catch (error) {
      console.error('Error getting points:', error);
      return this.getLocally('points');
    }
  }

  // Локальне отримання даних
  private async getLocally(key: string) {
    try {
      const { value } = await Preferences.get({ key: `local_${key}` });
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Error getting data locally: ${key}`, error);
      return null;
    }
  }
} 