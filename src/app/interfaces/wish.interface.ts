export interface Wish {
  id: number;
  uk: string;
  en: string;
  de: string;
}

export interface DailyWish {
  date: string;
  wish: Wish;
} 