import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BookmarkedArticle {
  id: string;
  title: string;
  link: string;
  summary: string;
  publishDate: string;
  sourceName: string;
  bookmarkedAt: string;
}

interface BookmarkStore {
  bookmarks: BookmarkedArticle[];
  addBookmark: (article: BookmarkedArticle) => void;
  removeBookmark: (id: string) => void;
  isBookmarked: (id: string) => boolean;
  clearAllBookmarks: () => void;
}

export const useBookmarks = create<BookmarkStore>()(
  persist(
    (set, get) => ({
      bookmarks: [],
      
      addBookmark: (article) => {
        const { bookmarks } = get();
        // 既に存在するブックマークなら追加しない
        if (bookmarks.some(bookmark => bookmark.id === article.id)) {
          return;
        }
        
        set({ 
          bookmarks: [...bookmarks, {
            ...article,
            bookmarkedAt: new Date().toISOString()
          }] 
        });
      },
      
      removeBookmark: (id) => {
        const { bookmarks } = get();
        set({ 
          bookmarks: bookmarks.filter(bookmark => bookmark.id !== id) 
        });
      },
      
      isBookmarked: (id) => {
        const { bookmarks } = get();
        return bookmarks.some(bookmark => bookmark.id === id);
      },
      
      clearAllBookmarks: () => {
        set({ bookmarks: [] });
      }
    }),
    {
      name: 'ai-news-bookmarks', // ローカルストレージのキー
    }
  )
);