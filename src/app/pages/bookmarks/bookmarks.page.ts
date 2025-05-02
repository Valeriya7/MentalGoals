import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BookmarksService, Bookmark } from '../../services/bookmarks.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-bookmarks',
  templateUrl: './bookmarks.page.html',
  styleUrls: ['./bookmarks.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, TranslateModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class BookmarksPageComponent implements OnInit, OnDestroy {
  bookmarks: Bookmark[] = [];
  isLoading = false;
  error: string | null = null;
  private subscription: Subscription;

  constructor(private bookmarksService: BookmarksService) {
    this.subscription = this.bookmarksService.bookmarks$.subscribe(
      bookmarks => this.bookmarks = bookmarks
    );
  }

  ngOnInit() {
    this.loadBookmarks();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async loadBookmarks() {
    this.isLoading = true;
    try {
      await this.bookmarksService.loadBookmarks();
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      this.error = 'Помилка завантаження закладок';
    } finally {
      this.isLoading = false;
    }
  }

  async removeBookmark(bookmark: Bookmark) {
    try {
      await this.bookmarksService.removeBookmark(bookmark.id);
    } catch (error) {
      console.error('Error removing bookmark:', error);
      this.error = 'Помилка видалення закладки';
    }
  }
} 