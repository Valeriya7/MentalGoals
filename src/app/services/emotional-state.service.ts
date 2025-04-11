import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

export interface EmotionalState {
  date: string;
  emotion: string;
  note: string;
  color: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmotionalStateService {
  private readonly STORAGE_KEY = 'emotional_states';

  constructor() {}

  async saveEmotionalState(state: EmotionalState): Promise<void> {
    try {
      const existingStates = await this.getEmotionalStates();
      const updatedStates = existingStates.filter(s => s.date !== state.date);
      updatedStates.push(state);
      
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(updatedStates)
      });
    } catch (error) {
      console.error('Error saving emotional state:', error);
      throw error;
    }
  }

  async getEmotionalStates(): Promise<EmotionalState[]> {
    try {
      const { value } = await Preferences.get({ key: this.STORAGE_KEY });
      return value ? JSON.parse(value) : [];
    } catch (error) {
      console.error('Error getting emotional states:', error);
      return [];
    }
  }

  async getEmotionalStateByDate(date: string): Promise<EmotionalState | null> {
    try {
      const states = await this.getEmotionalStates();
      return states.find(state => state.date === date) || null;
    } catch (error) {
      console.error('Error getting emotional state by date:', error);
      return null;
    }
  }

  async deleteEmotionalState(date: string): Promise<void> {
    try {
      const states = await this.getEmotionalStates();
      const updatedStates = states.filter(state => state.date !== date);
      
      await Preferences.set({
        key: this.STORAGE_KEY,
        value: JSON.stringify(updatedStates)
      });
    } catch (error) {
      console.error('Error deleting emotional state:', error);
      throw error;
    }
  }
} 