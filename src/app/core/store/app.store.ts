import { Injectable, signal, computed } from '@angular/core';
import { UserStats, DailyProgress, WordDueToday } from '../models';

@Injectable({ providedIn: 'root' })
export class AppStore {
  private _stats = signal<UserStats | null>(null);
  private _todayProgress = signal<DailyProgress | null>(null);
  private _wordsDue = signal<WordDueToday[]>([]);
  private _reviewCount = signal<number>(0);

  readonly stats = this._stats.asReadonly();
  readonly todayProgress = this._todayProgress.asReadonly();
  readonly wordsDue = this._wordsDue.asReadonly();
  readonly reviewCount = this._reviewCount.asReadonly();

  readonly dailyGoalProgress = computed(() => {
    const progress = this._todayProgress();
    const stats = this._stats();
    if (!progress || !stats) return 0;
    // Calculate progress ratio against a fixed daily goal (10 minutes)
    const goal = stats.xp_total > 0 ? 10 : 10;
    return Math.min(1, progress.minutes_read / goal);
  });

  readonly hasPendingReviews = computed(() => this._reviewCount() > 0);

  setStats(stats: UserStats | null) { this._stats.set(stats); }
  setTodayProgress(p: DailyProgress | null) { this._todayProgress.set(p); }
  setWordsDue(words: WordDueToday[]) { this._wordsDue.set(words); }
  setReviewCount(n: number) { this._reviewCount.set(n); }

  addXp(amount: number) {
    this._stats.update(s => s ? { ...s, xp_total: s.xp_total + amount } : s);
  }

  addSessionProgress(minutes: number, xp: number, words: number) {
    this._todayProgress.update(p => {
      if (!p) {
        return {
          id: '', user_id: '', date: new Date().toISOString(),
          minutes_read: minutes, xp_earned: xp, words_learned: words
        } as DailyProgress;
      }
      return {
        ...p,
        minutes_read: p.minutes_read + minutes,
        xp_earned: p.xp_earned + xp,
        words_learned: p.words_learned + words
      };
    });
    this.addXp(xp);
  } // Update stats signal as well when session is saved

  incrementStreak() {
    this._stats.update(s => s ? { ...s, streak_days: s.streak_days + 1 } : s);
  }

  reset() {
    this._stats.set(null);
    this._todayProgress.set(null);
    this._wordsDue.set([]);
    this._reviewCount.set(0);
  }
}