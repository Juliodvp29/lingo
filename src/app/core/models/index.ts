export type CefrLevel   = 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2';
export type VocabStatus = 'new' | 'learning' | 'known';

export interface User {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  level: CefrLevel | null;
  interests: string[] | null;
  daily_goal_minutes: number;
  streak_days: number;
  xp_total: number;
  is_premium: boolean;
  created_at: string;
  updated_at: string;
}

export interface Scene {
  type: 'narration' | 'dialogue';
  text: string;
  translation_es: string;
  character?: string;
  emoji?: string;
  bg_color?: string;
}

export interface Story {
  id: string;
  title: string;
  cover_image_url: string | null;
  level: CefrLevel;
  topic_tags: string[] | null;
  scenes: Scene[];
  word_count: number | null;
  estimated_minutes: number | null;
  is_published: boolean;
  author_id: string | null;
  created_at: string;
}

export interface StoryWithProgress extends Story {
  user_progress: UserStoryProgress | null;
}

export interface Vocabulary {
  id: string;
  word: string;
  ipa: string | null;
  definition_es: string;
  example_en: string | null;
  audio_url: string | null;
  frequency_rank: number | null;
  level: CefrLevel | null;
}

export interface UserVocabulary {
  id: string;
  user_id: string;
  vocab_id: string;
  status: VocabStatus;
  srs_interval_days: number;
  srs_ease_factor: number;
  next_review_at: string;
  review_count: number;
  last_seen_at: string;
}

export interface UserVocabularyWithWord extends UserVocabulary {
  vocabulary: Vocabulary;
}

export interface UserStoryProgress {
  id: string;
  user_id: string;
  story_id: string;
  completed: boolean;
  read_percentage: number;
  completed_at: string | null;
}

export interface DailyProgress {
  id: string;
  user_id: string;
  date: string;
  minutes_read: number;
  xp_earned: number;
  words_learned: number;
}

export interface UserStats {
  user_id: string;
  display_name: string | null;
  level: CefrLevel | null;
  streak_days: number;
  xp_total: number;
  is_premium: boolean;
  words_known: number;
  words_learning: number;
  words_new: number;
  stories_completed: number;
}

export interface WordDueToday {
  user_id: string;
  user_vocab_id: string;
  word: string;
  ipa: string | null;
  definition_es: string;
  example_en: string | null;
  audio_url: string | null;
  level: CefrLevel | null;
  status: VocabStatus;
  srs_interval_days: number;
  review_count: number;
  next_review_at: string;
}

export interface SessionResult {
  score: number;
  totalQuestions: number;
  xpAwarded: number;
  wordsLearned: number;
  minutesRead: number;
}

export interface QuizQuestion {
  question: string;
  hint: string;
  options: string[];
  correctIndex: number;
  relatedWord?: string;
}

export interface OnboardingData {
  level: CefrLevel;
  interests: string[];
  daily_goal_minutes: number;
}