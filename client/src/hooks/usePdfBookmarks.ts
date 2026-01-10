import { useState, useEffect } from "react";

/**
 * Hook to manage PDF bookmarks for a specific lesson
 * Stores bookmarks in localStorage with structure: { [lessonId]: number[] }
 * where the array contains page numbers that are bookmarked
 */
export function usePdfBookmarks(lessonId: string) {
  const storageKey = `pdf-bookmarks-${lessonId}`;
  
  const [bookmarks, setBookmarks] = useState<number[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(bookmarks));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  }, [bookmarks, storageKey]);

  const addBookmark = (pageNumber: number) => {
    setBookmarks(prev => {
      if (prev.includes(pageNumber)) {
        return prev; // Already bookmarked
      }
      return [...prev, pageNumber].sort((a, b) => a - b);
    });
  };

  const removeBookmark = (pageNumber: number) => {
    setBookmarks(prev => prev.filter(page => page !== pageNumber));
  };

  const toggleBookmark = (pageNumber: number) => {
    if (bookmarks.includes(pageNumber)) {
      removeBookmark(pageNumber);
    } else {
      addBookmark(pageNumber);
    }
  };

  const isBookmarked = (pageNumber: number) => {
    return bookmarks.includes(pageNumber);
  };

  const clearAllBookmarks = () => {
    setBookmarks([]);
  };

  return {
    bookmarks,
    addBookmark,
    removeBookmark,
    toggleBookmark,
    isBookmarked,
    clearAllBookmarks,
  };
}



