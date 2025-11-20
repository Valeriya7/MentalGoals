import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, ToastController } from '@ionic/angular';
import { ElasticsearchService, SearchResult, EmotionDocument, HabitDocument, ChallengeDocument } from '../../services/elasticsearch.service';
import { addIcons } from 'ionicons';
import { happyOutline, sadOutline, helpCircleOutline } from 'ionicons/icons';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-elasticsearch-test',
  templateUrl: './elasticsearch-test.page.html',
  styleUrls: ['./elasticsearch-test.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, TranslateModule]
})
export class ElasticsearchTestPage implements OnInit {
  // Пошук емоцій
  emotionQuery: string = '';
  emotionResults: SearchResult<EmotionDocument> | null = null;
  emotionLoading: boolean = false;

  // Пошук звичок
  habitQuery: string = '';
  habitResults: SearchResult<HabitDocument> | null = null;
  habitLoading: boolean = false;

  // Рекомендації викликів
  challengeRecommendations: SearchResult<ChallengeDocument> | null = null;
  recommendationsLoading: boolean = false;

  // Sentiment analysis
  sentimentText: string = '';
  sentimentResult: any = null;
  sentimentLoading: boolean = false;

  // Аномалії
  anomalies: any = null;
  anomaliesLoading: boolean = false;

  // Статус
  isMockMode: boolean = true;
  connectionStatus: string = 'Перевірка...';

  constructor(
    private elasticsearch: ElasticsearchService,
    private toastController: ToastController,
    private translate: TranslateService
  ) {
    // Реєстрація іконок
    addIcons({
      'happy': happyOutline,
      'sad': sadOutline,
      'help-circle': helpCircleOutline
    });
  }

  async ngOnInit() {
    this.isMockMode = this.elasticsearch.isMockMode();
    await this.checkConnection();
  }

  async checkConnection() {
    this.connectionStatus = this.translate.instant('ELASTICSEARCH_TEST.CHECKING');
    this.elasticsearch.checkConnection().subscribe({
      next: (connected) => {
        if (connected) {
          this.connectionStatus = this.translate.instant('ELASTICSEARCH_TEST.CONNECTED');
        } else {
          // Якщо не підключено, але це не мок-режим, значить проблема з CORS
          if (!this.isMockMode) {
            this.connectionStatus = '⚠️ CORS помилка - використовуються мок-дані';
            this.showToast('CORS помилка. Використовуються мок-дані для тестування', 'warning');
          } else {
            this.connectionStatus = this.translate.instant('ELASTICSEARCH_TEST.MOCK_CONNECTED');
          }
        }
      },
      error: () => {
        this.connectionStatus = this.isMockMode 
          ? this.translate.instant('ELASTICSEARCH_TEST.MOCK_CONNECTED')
          : '⚠️ Помилка підключення - використовуються мок-дані';
      }
    });
  }

  // ============================================
  // 1. ПОШУК ЕМОЦІЙ
  // ============================================

  async searchEmotions() {
    if (!this.emotionQuery.trim()) {
      this.showToast(this.translate.instant('ELASTICSEARCH_TEST.TOASTS.ENTER_QUERY'), 'warning');
      return;
    }

    this.emotionLoading = true;
    this.emotionResults = null;

    this.elasticsearch.searchEmotionNotes('user1', this.emotionQuery)
      .subscribe({
        next: (results) => {
          this.emotionResults = results;
          this.emotionLoading = false;
          this.showToast(
            this.translate.instant('ELASTICSEARCH_TEST.TOASTS.FOUND_RESULTS', { count: results.total.value }),
            'success'
          );
        },
        error: (error) => {
          console.error('Error searching emotions:', error);
          this.emotionLoading = false;
          this.showToast(this.translate.instant('ELASTICSEARCH_TEST.TOASTS.SEARCH_ERROR'), 'danger');
        }
      });
  }

  // ============================================
  // 2. ПОШУК ЗВИЧОК
  // ============================================

  async searchHabits() {
    if (!this.habitQuery.trim()) {
      this.showToast(this.translate.instant('ELASTICSEARCH_TEST.TOASTS.ENTER_QUERY'), 'warning');
      return;
    }

    this.habitLoading = true;
    this.habitResults = null;

    this.elasticsearch.searchHabits('user1', this.habitQuery)
      .subscribe({
        next: (results) => {
          this.habitResults = results;
          this.habitLoading = false;
          this.showToast(
            this.translate.instant('ELASTICSEARCH_TEST.TOASTS.FOUND_RESULTS', { count: results.total.value }),
            'success'
          );
        },
        error: (error) => {
          console.error('Error searching habits:', error);
          this.habitLoading = false;
          this.showToast(this.translate.instant('ELASTICSEARCH_TEST.TOASTS.SEARCH_ERROR'), 'danger');
        }
      });
  }

  // ============================================
  // 3. РЕКОМЕНДАЦІЇ ВИКЛИКІВ
  // ============================================

  async getRecommendations() {
    this.recommendationsLoading = true;
    this.challengeRecommendations = null;

    this.elasticsearch.getChallengeRecommendations('user1', undefined, [])
      .subscribe({
        next: (results) => {
          this.challengeRecommendations = results;
          this.recommendationsLoading = false;
          this.showToast(
            this.translate.instant('ELASTICSEARCH_TEST.TOASTS.FOUND_RECOMMENDATIONS', { count: results.total.value }),
            'success'
          );
        },
        error: (error) => {
          console.error('Error getting recommendations:', error);
          this.recommendationsLoading = false;
          this.showToast(this.translate.instant('ELASTICSEARCH_TEST.TOASTS.RECOMMENDATIONS_ERROR'), 'danger');
        }
      });
  }

  // ============================================
  // 4. SENTIMENT ANALYSIS
  // ============================================

  async analyzeSentiment() {
    if (!this.sentimentText.trim()) {
      this.showToast(this.translate.instant('ELASTICSEARCH_TEST.TOASTS.ENTER_TEXT'), 'warning');
      return;
    }

    this.sentimentLoading = true;
    this.sentimentResult = null;

    this.elasticsearch.analyzeSentiment(this.sentimentText)
      .subscribe({
        next: (result) => {
          this.sentimentResult = result;
          this.sentimentLoading = false;
          const sentiment = result.docs?.[0]?.doc?._source?.sentiment;
          if (sentiment) {
            this.showToast(
              `Тональність: ${sentiment.prediction} (${(sentiment.confidence * 100).toFixed(0)}%)`,
              sentiment.prediction === 'positive' ? 'success' : 'warning'
            );
          }
        },
        error: (error) => {
          console.error('Error analyzing sentiment:', error);
          this.sentimentLoading = false;
          this.showToast(this.translate.instant('ELASTICSEARCH_TEST.TOASTS.SENTIMENT_ERROR'), 'danger');
        }
      });
  }

  // ============================================
  // 5. АНОМАЛІЇ
  // ============================================

  async getAnomalies() {
    this.anomaliesLoading = true;
    this.anomalies = null;

    const endDate = new Date().toISOString();
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    this.elasticsearch.getEmotionAnomalies('user1', startDate, endDate)
      .subscribe({
        next: (results) => {
          this.anomalies = results;
          this.anomaliesLoading = false;
          const count = results.hits?.length || 0;
          this.showToast(
            count > 0 
              ? this.translate.instant('ELASTICSEARCH_TEST.TOASTS.ANOMALIES_FOUND', { count })
              : this.translate.instant('ELASTICSEARCH_TEST.TOASTS.NO_ANOMALIES'),
            count > 0 ? 'warning' : 'success'
          );
        },
        error: (error) => {
          // Помилки вже обробляються в сервісі (fallback на мок-дані)
          // Логуємо тільки неочікувані помилки
          if (error.status !== 404 && error.status !== 0) {
            console.error('Unexpected error getting anomalies:', error);
            this.showToast(this.translate.instant('ELASTICSEARCH_TEST.TOASTS.ANOMALIES_ERROR'), 'danger');
          }
          this.anomaliesLoading = false;
        }
      });
  }

  // ============================================
  // ДОПОМІЖНІ МЕТОДИ
  // ============================================

  getSentimentColor(prediction: string): string {
    switch (prediction) {
      case 'positive': return 'success';
      case 'negative': return 'danger';
      default: return 'medium';
    }
  }

  getSentimentIcon(prediction: string): string {
    switch (prediction) {
      case 'positive': return 'happy';
      case 'negative': return 'sad';
      default: return 'help-circle';
    }
  }

  async showToast(message: string, color: 'success' | 'warning' | 'danger' | 'primary' = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top'
    });
    await toast.present();
  }
}

