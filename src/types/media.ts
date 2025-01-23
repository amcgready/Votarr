// Path: src/types/media.ts

export interface PlexMediaItem {
  ratingKey: string;
  title: string;
  year?: number;
  thumb?: string;
  type: 'movie' | 'show';
  summary?: string;
  duration?: number;
  contentRating?: string;
  genre?: string[];
}

export interface PlexSearchOptions {
  type?: 'movie' | 'show' | 'any';
  limit?: number;
}

export interface PlexUserInfo {
  id: string;
  username: string;
  email: string;
  thumb?: string;
}
