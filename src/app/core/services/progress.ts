import { Injectable } from '@angular/core';
import { AuthService } from './auth';
import { SupabaseService } from './supabase';
import { DailyProgress, UserStats } from '../models';

@Injectable({
  providedIn: 'root',
})
export class ProgressService {
  private get db() { return this.supabase.client; }

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) { }

  async getUserStats(): Promise<UserStats | null> {
    const userId = this.auth.user()?.id;
    if (!userId) return null;

    const { data, error } = await this.db
      .from('v_user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data as UserStats;
  }

  async getTodayProgress(): Promise<DailyProgress | null> {
    const userId = this.auth.user()?.id;
    if (!userId) return null;

    const today = new Date().toISOString().split('T')[0];

    const { data } = await this.db
      .from('daily_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .maybeSingle();

    return data as DailyProgress | null;
  }

  async recordSession(
    minutesRead: number,
    xpEarned: number,
    wordsLearned: number
  ): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    // Use database RPC to update daily statistics (minutes, XP, words)
    const { error } = await this.db.rpc('update_daily_progress', {
      p_user_id: userId,
      p_minutes: minutesRead,
      p_xp: xpEarned,
      p_words_learned: wordsLearned
    });

    if (error) throw error;
  }

  async getWeeklyProgress(): Promise<DailyProgress[]> {
    const userId = this.auth.user()?.id;
    if (!userId) return [];

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    const fromDate = sevenDaysAgo.toISOString().split('T')[0];

    const { data, error } = await this.db
      .from('daily_progress')
      .select('*')
      .eq('user_id', userId)
      .gte('date', fromDate)
      .order('date', { ascending: true });

    if (error) throw error;
    return data as DailyProgress[];
  }
}
