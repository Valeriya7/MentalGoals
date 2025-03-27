import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Bookmark {
  id: string;
  title: string;
  description: string;
  type: 'challenge' | 'task' | 'article';
  itemId: string;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class BookmarksService {
  private readonly STORAGE_KEY = 'bookmarks';
  private bookmarksSubject = new BehaviorSubject<Bookmark[]>([]);
  public bookmarks$ = this.bookmarksSubject.asObservable();

  constructor(private storage: Storage) {
    this.initStorage();
  }

  private async initStorage() {
    await this.storage.create();
    this.loadBookmarks();
  }

  public async loadBookmarks(): Promise<void> {
    try {
      const bookmarks = await this.storage.get(this.STORAGE_KEY) || [];
      this.bookmarksSubject.next(bookmarks);
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      throw error;
    }
  }

  async addBookmark(bookmark: Omit<Bookmark, 'id' | 'createdAt'>): Promise<void> {
    try {
      const newBookmark: Bookmark = {
        ...bookmark,
        id: crypto.randomUUID(),
        createdAt: new Date()
      };
      
      const currentBookmarks = this.bookmarksSubject.value;
      const updatedBookmarks = [...currentBookmarks, newBookmark];
      
      await this.storage.set(this.STORAGE_KEY, updatedBookmarks);
      this.bookmarksSubject.next(updatedBookmarks);
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  async removeBookmark(id: string): Promise<void> {
    try {
      const currentBookmarks = this.bookmarksSubject.value;
      const updatedBookmarks = currentBookmarks.filter(b => b.id !== id);
      
      await this.storage.set(this.STORAGE_KEY, updatedBookmarks);
      this.bookmarksSubject.next(updatedBookmarks);
    } catch (error) {
      console.error('Error removing bookmark:', error);
      throw error;
    }
  }

  async isBookmarked(type: Bookmark['type'], itemId: string): Promise<boolean> {
    const bookmarks = this.bookmarksSubject.value;
    return bookmarks.some(b => b.type === type && b.itemId === itemId);
  }
} 