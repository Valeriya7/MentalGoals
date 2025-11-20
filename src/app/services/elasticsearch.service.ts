import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Emotion } from '../models/emotion.model';
import { Habit } from '../interfaces/habit.interface';
import { Challenge } from '../interfaces/challenge.interface';

// Інтерфейси для типізації
export interface SearchResult<T> {
  hits: Array<{
    _id: string;
    _score: number;
    _source: T;
  }>;
  total: {
    value: number;
  };
}

export interface EmotionDocument extends Emotion {
  userId?: string;
  noteEmbedding?: number[];
  sentiment?: {
    prediction: string;
    confidence: number;
    score: number;
  };
}

export interface HabitDocument extends Habit {
  userId?: string;
  descriptionEmbedding?: number[];
}

export interface ChallengeDocument extends Challenge {
  descriptionEmbedding?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class ElasticsearchService {
  private readonly baseUrl: string;
  private readonly headers: HttpHeaders;
  private readonly useMock: boolean;
  
  // Мок-дані для тестування
  private mockEmotions: EmotionDocument[] = [];
  private mockHabits: HabitDocument[] = [];
  private mockChallenges: ChallengeDocument[] = [];

  constructor(private http: HttpClient) {
    // Перевіряємо, чи налаштований Elasticsearch
    this.useMock = !environment.elasticsearch?.enabled || !environment.elasticsearch?.url;
    
    // Якщо URL починається з /, це proxy - не додаємо API key в headers (він вже в proxy)
    const isProxy = environment.elasticsearch?.url?.startsWith('/');
    this.baseUrl = environment.elasticsearch?.url || 'http://localhost:9200';
    
    this.headers = new HttpHeaders({
      'Content-Type': 'application/json',
      // API key додається тільки якщо не використовуємо proxy
      ...(!isProxy && environment.elasticsearch?.apiKey && {
        'Authorization': `ApiKey ${environment.elasticsearch.apiKey}`
      })
    });

    if (this.useMock) {
      console.log('🔍 Elasticsearch: Використовується мок-режим для тестування');
      this.initializeMockData();
    } else {
      const isProxy = environment.elasticsearch?.url?.startsWith('/');
      console.log('🔍 Elasticsearch: Підключення до', this.baseUrl);
      if (isProxy) {
        console.log('🔍 Elasticsearch: Використовується proxy для обходу CORS');
      } else {
        console.log('🔍 Elasticsearch: API Key налаштовано:', !!environment.elasticsearch?.apiKey);
      }
    }
  }

  // ============================================
  // ІНІЦІАЛІЗАЦІЯ МОК-ДАНИХ
  // ============================================

  private initializeMockData() {
    // Мок-емоції
    this.mockEmotions = [
      {
        id: '1',
        userId: 'user1',
        type: 'happy',
        value: 8,
        energy: 7,
        note: 'Сьогодні був чудовий день! Відчуваю себе натхненною та енергійною.',
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        icon: 'happy',
        color: '#4CAF50',
        sentiment: {
          prediction: 'positive',
          confidence: 0.95,
          score: 0.8
        }
      },
      {
        id: '2',
        userId: 'user1',
        type: 'anxious',
        value: 3,
        energy: 5,
        note: 'Відчуваю тривогу через завтрашню презентацію. Потрібно підготуватися краще.',
        date: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        icon: 'anxious',
        color: '#FF9800',
        sentiment: {
          prediction: 'negative',
          confidence: 0.85,
          score: -0.6
        }
      },
      {
        id: '3',
        userId: 'user1',
        type: 'calm',
        value: 7,
        energy: 6,
        note: 'Після медитації відчуваю спокій та гармонію. Це допомагає мені зосередитися.',
        date: new Date(Date.now() - 172800000).toISOString(),
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        icon: 'calm',
        color: '#2196F3',
        sentiment: {
          prediction: 'positive',
          confidence: 0.9,
          score: 0.7
        }
      }
    ];

    // Мок-звички
    this.mockHabits = [
      {
        id: '1',
        userId: 'user1',
        name: 'Медитація',
        description: 'Щоденна медитація для релаксації та зосередженості',
        icon: 'meditation',
        category: 'mindfulness',
        difficulty: 'easy',
        points: 10,
        isActive: true,
        isChallengeHabit: false,
        completionStatus: {},
        streak: { current: 5, best: 10 },
        target: 1,
        unit: 'раз',
        frequency: 'daily',
        progress: {}
      },
      {
        id: '2',
        userId: 'user1',
        name: 'Вправи',
        description: 'Фізичні вправи для підтримки здоров\'я та енергії',
        icon: 'fitness',
        category: 'fitness',
        difficulty: 'medium',
        points: 15,
        isActive: true,
        isChallengeHabit: false,
        completionStatus: {},
        streak: { current: 3, best: 7 },
        target: 30,
        unit: 'хвилин',
        frequency: 'daily',
        progress: {}
      }
    ];

    // Мок-виклики
    this.mockChallenges = [
      {
        id: '1',
        title: 'Медитація для початківців',
        description: '21-денний виклик для освоєння основ медитації та релаксації',
        tasks: [],
        status: 'available',
        duration: 21,
        difficulty: 'beginner',
        difficultyLevel: 1,
        rewards: {
          points: 100,
          discounts: []
        },
        phases: []
      },
      {
        id: '2',
        title: 'Йога для релаксації',
        description: 'Тиждень практики йоги для зняття стресу та покращення гнучкості',
        tasks: [],
        status: 'available',
        duration: 7,
        difficulty: 'beginner',
        difficultyLevel: 1,
        rewards: {
          points: 50,
          discounts: []
        },
        phases: []
      }
    ];
  }

  // ============================================
  // 1. СЕМАНТИЧНИЙ ПОШУК У НОТАТКАХ
  // ============================================

  /**
   * Семантичний пошук у нотатках про емоції
   */
  searchEmotionNotes(
    userId: string,
    query: string,
    queryEmbedding?: number[],
    size: number = 10
  ): Observable<SearchResult<EmotionDocument>> {
    if (this.useMock) {
      return this.mockSearchEmotions(userId, query, size);
    }

    const searchQuery = {
      knn: {
        field: 'noteEmbedding',
        query_vector: queryEmbedding || [],
        k: size,
        num_candidates: 100,
        filter: {
          term: { userId }
        }
      }
    };

    return this.http.post<{ hits: SearchResult<EmotionDocument> }>(
      `${this.baseUrl}/emotions/_search`,
      { query: searchQuery },
      { headers: this.headers }
    ).pipe(
      map(response => response.hits),
      catchError(error => {
        console.error('Error searching emotion notes:', error);
        // Якщо індекс не існує (404) або CORS помилка (status 0), повертаємо мок-дані
        if (error.status === 404 || error.status === 0) {
          if (error.status === 0) {
            console.warn('⚠️ Elasticsearch: CORS помилка. Використовуються мок-дані.');
          } else {
            console.warn('Elasticsearch index not found, using mock data');
          }
          return this.mockSearchEmotions(userId, query, 10);
        }
        return throwError(() => error);
      })
    );
  }

  private mockSearchEmotions(
    userId: string,
    query: string,
    size: number
  ): Observable<SearchResult<EmotionDocument>> {
    const lowerQuery = query.toLowerCase();
    const filtered = this.mockEmotions
      .filter(e => e.userId === userId)
      .filter(e => {
        if (!e.note) return false;
        const note = e.note.toLowerCase();
        // Простий пошук за ключовими словами
        const keywords = ['тривога', 'стрес', 'занепокоєння', 'паніка', 'anxious', 'anxiety', 'stress'];
        const queryKeywords = ['щастя', 'радість', 'happy', 'joy', 'calm', 'спокій'];
        
        if (keywords.some(k => lowerQuery.includes(k) || note.includes(k))) {
          return keywords.some(k => note.includes(k));
        }
        if (queryKeywords.some(k => lowerQuery.includes(k) || note.includes(k))) {
          return queryKeywords.some(k => note.includes(k));
        }
        return note.includes(lowerQuery);
      })
      .slice(0, size)
      .map((e, index) => ({
        _id: e.id,
        _score: 1.0 - (index * 0.1),
        _source: e
      }));

    return of({
      hits: filtered,
      total: { value: filtered.length }
    }).pipe(delay(300)); // Симуляція затримки мережі
  }

  /**
   * Гібридний пошук (keyword + semantic)
   */
  hybridSearchEmotions(
    userId: string,
    query: string,
    queryEmbedding?: number[],
    size: number = 10
  ): Observable<SearchResult<EmotionDocument>> {
    if (this.useMock) {
      return this.mockSearchEmotions(userId, query, size);
    }

    const searchQuery = {
      query: {
        bool: {
          must: [{ term: { userId } }],
          should: [
            { match: { note: { query, boost: 2.0 } } },
            { match: { emotion: { query, boost: 1.5 } } }
          ],
          minimum_should_match: 1
        }
      },
      knn: {
        field: 'noteEmbedding',
        query_vector: queryEmbedding || [],
        k: size,
        num_candidates: 100,
        filter: { term: { userId } },
        boost: 0.5
      },
      size
    };

    return this.http.post<{ hits: SearchResult<EmotionDocument> }>(
      `${this.baseUrl}/emotions/_search`,
      searchQuery,
      { headers: this.headers }
    ).pipe(
      map(response => response.hits),
      catchError(error => {
        console.error('Error in hybrid search:', error);
        // Якщо CORS помилка (status 0), повертаємо мок-дані
        if (error.status === 404 || error.status === 0) {
          if (error.status === 0) {
            console.warn('⚠️ Elasticsearch: CORS помилка. Використовуються мок-дані.');
          } else {
            console.warn('Elasticsearch index not found, using mock data');
          }
          return this.mockSearchEmotions(userId, query, size);
        }
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // 2. АНАЛІЗ ЕМОЦІЙНИХ ПАТЕРНІВ
  // ============================================

  /**
   * Отримання аномалій у емоційних станах
   */
  getEmotionAnomalies(
    userId: string,
    startDate: string,
    endDate: string
  ): Observable<any> {
    if (this.useMock) {
      return this.mockGetAnomalies(userId, startDate, endDate);
    }

    const query = {
      query: {
        bool: {
          must: [
            { term: { userId } },
            { range: { date: { gte: startDate, lte: endDate } } },
            { range: { anomaly_score: { gte: 75 } } }
          ]
        }
      },
      sort: [{ timestamp: { order: 'desc' } }]
    };

    return this.http.post(
      `${this.baseUrl}/.ml-anomaly-detector-emotion-patterns/_search`,
      query,
      { headers: this.headers }
    ).pipe(
      catchError(error => {
        // Якщо ML job не існує (404) або CORS помилка (status 0), повертаємо мок-дані
        // Це очікувана поведінка, тому не логуємо як помилку
        if (error.status === 404 || error.status === 0) {
          // Тихо використовуємо мок-дані без логування помилки
          return this.mockGetAnomalies(userId, startDate, endDate);
        }
        // Для інших помилок логуємо
        console.error('Error getting anomalies:', error);
        return throwError(() => error);
      })
    );
  }

  private mockGetAnomalies(
    userId: string,
    startDate: string,
    endDate: string
  ): Observable<any> {
    // Симуляція виявлення аномалій
    const anomalies = this.mockEmotions
      .filter(e => e.userId === userId && e.value < 4)
      .map(e => ({
        _id: e.id,
        _score: 0.85,
        _source: {
          ...e,
          anomaly_score: 80,
          timestamp: e.date
        }
      }));

    return of({
      hits: anomalies,
      total: { value: anomalies.length }
    }).pipe(delay(200));
  }

  // ============================================
  // 3. РЕКОМЕНДАЦІЇ ВИКЛИКІВ
  // ============================================

  /**
   * Персоналізовані рекомендації викликів
   */
  getChallengeRecommendations(
    userId: string,
    userProfileEmbedding?: number[],
    completedChallengeIds: string[] = [],
    size: number = 5
  ): Observable<SearchResult<ChallengeDocument>> {
    if (this.useMock) {
      return this.mockGetRecommendations(completedChallengeIds, size);
    }

    const query = {
      query: {
        bool: {
          must_not: { terms: { id: completedChallengeIds } }
        }
      },
      knn: {
        field: 'descriptionEmbedding',
        query_vector: userProfileEmbedding || [],
        k: size,
        num_candidates: 100
      },
      size
    };

    return this.http.post<{ hits: SearchResult<ChallengeDocument> }>(
      `${this.baseUrl}/challenges/_search`,
      query,
      { headers: this.headers }
    ).pipe(
      map(response => response.hits),
      catchError(error => {
        console.error('Error getting recommendations:', error);
        // Якщо індекс не існує (404) або CORS помилка (status 0), повертаємо мок-дані
        if (error.status === 404 || error.status === 0) {
          if (error.status === 0) {
            console.warn('⚠️ Elasticsearch: CORS помилка. Використовуються мок-дані.');
          } else {
            console.warn('Elasticsearch index not found, using mock data');
          }
          return this.mockGetRecommendations(completedChallengeIds, size);
        }
        return throwError(() => error);
      })
    );
  }

  private mockGetRecommendations(
    completedIds: string[],
    size: number
  ): Observable<SearchResult<ChallengeDocument>> {
    const filtered = this.mockChallenges
      .filter(c => !completedIds.includes(c.id))
      .slice(0, size)
      .map((c, index) => ({
        _id: c.id,
        _score: 0.9 - (index * 0.1),
        _source: c
      }));

    return of({
      hits: filtered,
      total: { value: filtered.length }
    }).pipe(delay(300));
  }

  // ============================================
  // 4. SENTIMENT ANALYSIS
  // ============================================

  /**
   * Аналіз тональності нотатки
   */
  analyzeSentiment(note: string): Observable<any> {
    if (this.useMock) {
      return this.mockAnalyzeSentiment(note);
    }

    const query = {
      pipeline: {
        processors: [{
          inference: {
            model_id: 'sentiment-analysis-model',
            field_map: { note: 'text_field' },
            target_field: 'sentiment'
          }
        }]
      },
      docs: [{ _source: { note } }]
    };

    return this.http.post(
      `${this.baseUrl}/_ingest/pipeline/_simulate`,
      query,
      { headers: this.headers }
    ).pipe(
      catchError(error => {
        console.error('Error analyzing sentiment:', error);
        // Якщо pipeline не існує (404) або CORS помилка (status 0), повертаємо мок-дані
        if (error.status === 404 || error.status === 0) {
          if (error.status === 0) {
            console.warn('⚠️ Elasticsearch: CORS помилка. Використовуються мок-дані.');
          } else {
            console.warn('Elasticsearch pipeline not found, using mock data');
          }
          return this.mockAnalyzeSentiment(note);
        }
        return throwError(() => error);
      })
    );
  }

  private mockAnalyzeSentiment(note: string): Observable<any> {
    const lowerNote = note.toLowerCase();
    const positiveWords = ['чудовий', 'радість', 'щастя', 'добре', 'відмінно', 'натхнення'];
    const negativeWords = ['тривога', 'стрес', 'погано', 'проблема', 'складно', 'важко'];
    
    const positiveCount = positiveWords.filter(w => lowerNote.includes(w)).length;
    const negativeCount = negativeWords.filter(w => lowerNote.includes(w)).length;
    
    let prediction = 'neutral';
    let score = 0;
    
    if (positiveCount > negativeCount) {
      prediction = 'positive';
      score = Math.min(0.9, 0.5 + (positiveCount * 0.1));
    } else if (negativeCount > positiveCount) {
      prediction = 'negative';
      score = Math.max(-0.9, -0.5 - (negativeCount * 0.1));
    }

    return of({
      docs: [{
        doc: {
          _source: {
            note,
            sentiment: {
              prediction,
              confidence: 0.85,
              score
            }
          }
        }
      }]
    }).pipe(delay(200));
  }

  /**
   * Отримання тренду тональності
   */
  getSentimentTrend(
    userId: string,
    startDate: string,
    endDate: string
  ): Observable<any> {
    if (this.useMock) {
      return this.mockGetSentimentTrend(userId, startDate, endDate);
    }

    const query = {
      query: {
        bool: {
          must: [
            { term: { userId } },
            { range: { date: { gte: startDate, lte: endDate } } },
            { exists: { field: 'sentiment.score' } }
          ]
        }
      },
      aggs: {
        sentiment_over_time: {
          date_histogram: {
            field: 'date',
            calendar_interval: 'day'
          },
          aggs: {
            avg_sentiment: {
              avg: { field: 'sentiment.score' }
            }
          }
        }
      }
    };

    return this.http.post(
      `${this.baseUrl}/emotions/_search`,
      query,
      { headers: this.headers }
    ).pipe(
      catchError(error => {
        console.error('Error getting sentiment trend:', error);
        // Якщо індекс не існує (404) або CORS помилка (status 0), повертаємо мок-дані
        if (error.status === 404 || error.status === 0) {
          if (error.status === 0) {
            console.warn('⚠️ Elasticsearch: CORS помилка. Використовуються мок-дані.');
          } else {
            console.warn('Elasticsearch index not found, using mock data');
          }
          return this.mockGetSentimentTrend(userId, startDate, endDate);
        }
        return throwError(() => error);
      })
    );
  }

  private mockGetSentimentTrend(
    userId: string,
    startDate: string,
    endDate: string
  ): Observable<any> {
    const emotions = this.mockEmotions.filter(e => e.userId === userId);
    const trend = emotions.map(e => ({
      key_as_string: e.date,
      key: new Date(e.date).getTime(),
      doc_count: 1,
      avg_sentiment: {
        value: e.sentiment?.score || 0
      }
    }));

    return of({
      aggregations: {
        sentiment_over_time: {
          buckets: trend
        }
      }
    }).pipe(delay(200));
  }

  // ============================================
  // 5. РОЗУМНИЙ ПОШУК ЗВИЧОК
  // ============================================

  /**
   * Семантичний пошук звичок
   */
  searchHabits(
    userId: string,
    query: string,
    queryEmbedding?: number[],
    size: number = 10
  ): Observable<SearchResult<HabitDocument>> {
    if (this.useMock) {
      return this.mockSearchHabits(userId, query, size);
    }

    const searchQuery = {
      query: {
        bool: {
          must: [{ term: { userId } }],
          should: [
            { match: { name: { query, boost: 2.0 } } },
            { match: { description: { query, boost: 1.5 } } }
          ],
          minimum_should_match: 1
        }
      },
      knn: {
        field: 'descriptionEmbedding',
        query_vector: queryEmbedding || [],
        k: size,
        num_candidates: 100,
        filter: { term: { userId } },
        boost: 1.0
      },
      size
    };

    return this.http.post<{ hits: SearchResult<HabitDocument> }>(
      `${this.baseUrl}/habits/_search`,
      searchQuery,
      { headers: this.headers }
    ).pipe(
      map(response => response.hits),
      catchError(error => {
        console.error('Error searching habits:', error);
        // Якщо індекс не існує (404) або CORS помилка (status 0), повертаємо мок-дані
        if (error.status === 404 || error.status === 0) {
          if (error.status === 0) {
            console.warn('⚠️ Elasticsearch: CORS помилка. Використовуються мок-дані.');
          } else {
            console.warn('Elasticsearch index not found, using mock data');
          }
          return this.mockSearchHabits(userId, query, 10);
        }
        return throwError(() => error);
      })
    );
  }

  private mockSearchHabits(
    userId: string,
    query: string,
    size: number
  ): Observable<SearchResult<HabitDocument>> {
    const lowerQuery = query.toLowerCase();
    const filtered = this.mockHabits
      .filter(h => h.userId === userId)
      .filter(h => {
        const name = h.name.toLowerCase();
        const desc = h.description.toLowerCase();
        return name.includes(lowerQuery) || desc.includes(lowerQuery);
      })
      .slice(0, size)
      .map((h, index) => ({
        _id: h.id,
        _score: 1.0 - (index * 0.1),
        _source: h
      }));

    return of({
      hits: filtered,
      total: { value: filtered.length }
    }).pipe(delay(200));
  }

  // ============================================
  // 6. ВИЯВЛЕННЯ АНОМАЛІЙ
  // ============================================

  /**
   * Отримання аномалій у поведінці
   */
  getBehaviorAnomalies(
    userId: string,
    startDate: string,
    endDate: string
  ): Observable<any> {
    if (this.useMock) {
      return this.mockGetAnomalies(userId, startDate, endDate);
    }

    const query = {
      query: {
        bool: {
          must: [
            { term: { userId } },
            { range: { date: { gte: startDate, lte: endDate } } },
            { range: { anomaly_score: { gte: 75 } } }
          ]
        }
      },
      sort: [{ timestamp: { order: 'desc' } }]
    };

    return this.http.post(
      `${this.baseUrl}/.ml-anomaly-detector-behavior/_search`,
      query,
      { headers: this.headers }
    ).pipe(
      catchError(error => {
        // Якщо ML job не існує (404) або CORS помилка (status 0), повертаємо мок-дані
        // Це очікувана поведінка, тому не логуємо як помилку
        if (error.status === 404 || error.status === 0) {
          // Тихо використовуємо мок-дані без логування помилки
          return this.mockGetAnomalies(userId, startDate, endDate);
        }
        // Для інших помилок логуємо
        console.error('Error getting behavior anomalies:', error);
        return throwError(() => error);
      })
    );
  }

  // ============================================
  // 7. БАГАТОМОВНИЙ ПОШУК
  // ============================================

  /**
   * Багатомовний пошук викликів
   */
  multilingualSearchChallenges(
    query: string,
    language: 'uk' | 'en' | 'de' = 'uk',
    size: number = 10
  ): Observable<SearchResult<ChallengeDocument>> {
    if (this.useMock) {
      return this.mockSearchChallenges(query, size);
    }

    const searchQuery = {
      query: {
        multi_match: {
          query,
          fields: [
            `title.${language}^2`,
            'title.uk',
            'title.en',
            'title.de',
            'description'
          ],
          type: 'best_fields',
          fuzziness: 'AUTO'
        }
      },
      size
    };

    return this.http.post<{ hits: SearchResult<ChallengeDocument> }>(
      `${this.baseUrl}/challenges/_search`,
      searchQuery,
      { headers: this.headers }
    ).pipe(
      map(response => response.hits),
      catchError(error => {
        console.error('Error in multilingual search:', error);
        // Якщо індекс не існує (404) або CORS помилка (status 0), повертаємо мок-дані
        if (error.status === 404 || error.status === 0) {
          if (error.status === 0) {
            console.warn('⚠️ Elasticsearch: CORS помилка. Використовуються мок-дані.');
          } else {
            console.warn('Elasticsearch index not found, using mock data');
          }
          return this.mockSearchChallenges(query, 10);
        }
        return throwError(() => error);
      })
    );
  }

  private mockSearchChallenges(
    query: string,
    size: number
  ): Observable<SearchResult<ChallengeDocument>> {
    const lowerQuery = query.toLowerCase();
    const filtered = this.mockChallenges
      .filter(c => {
        const title = (c.title || '').toLowerCase();
        const desc = (c.description || '').toLowerCase();
        return title.includes(lowerQuery) || desc.includes(lowerQuery);
      })
      .slice(0, size)
      .map((c, index) => ({
        _id: c.id,
        _score: 1.0 - (index * 0.1),
        _source: c
      }));

    return of({
      hits: filtered,
      total: { value: filtered.length }
    }).pipe(delay(200));
  }

  // ============================================
  // ДОПОМІЖНІ МЕТОДИ
  // ============================================

  /**
   * Перевірка підключення до Elasticsearch
   */
  checkConnection(): Observable<boolean> {
    if (this.useMock) {
      return of(true).pipe(delay(100));
    }

    // Для serverless Elasticsearch використовуємо простий запит
    return this.http.get(`${this.baseUrl}/`, { 
      headers: this.headers,
      observe: 'response'
    })
      .pipe(
        map(() => true),
        catchError((error) => {
          // HTTP status 0 зазвичай означає CORS або мережеву проблему
          // Але це не критично - можемо використовувати мок-дані
          if (error.status === 0) {
            console.warn('⚠️ Elasticsearch: CORS або мережева помилка. Використовуватимуться мок-дані.');
            console.warn('💡 Для використання реального Elasticsearch потрібно налаштувати CORS на сервері або використовувати proxy.');
            return of(false); // Повертаємо false, щоб показати, що реальне підключення недоступне
          }
          // Якщо отримали помилку, але це не проблема підключення, вважаємо успішним
          if (error.status === 404 || error.status === 200) {
            return of(true);
          }
          console.warn('Elasticsearch connection check:', error);
          return of(false);
        })
      );
  }

  /**
   * Отримання статусу (мок або реальний)
   */
  isMockMode(): boolean {
    return this.useMock;
  }
}

