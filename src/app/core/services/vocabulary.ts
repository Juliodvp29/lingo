import { Injectable } from '@angular/core';
import { Supabase } from './supabase';
import { Auth } from './auth';
import { UserVocabulary, UserVocabularyWithWord, VocabStatus, WordDueToday } from '../models';

@Injectable({
  providedIn: 'root',
})
export class Vocabulary {
  private get db() { return this.supabase.client; }

  constructor(
    private supabase: Supabase,
    private auth: Auth
  ) {}

  async lookupWord(word: string): Promise<Vocabulary | null> {
    const { data, error } = await this.db
      .from('vocabulary')
      .select('*')
      .eq('word', word.toLowerCase())
      .maybeSingle(); 

    if (error) throw error;
    return data as Vocabulary | null;
  }

  async getUserWordStatus(vocabId: string): Promise<UserVocabulary | null> {
    const userId = this.auth.user()?.id;
    if (!userId) return null;

    const { data } = await this.db
      .from('user_vocabulary')
      .select('*')
      .eq('user_id', userId)
      .eq('vocab_id', vocabId)
      .maybeSingle();

    return data as UserVocabulary | null;
  }

  async setWordStatus(vocabId: string, status: VocabStatus): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const { error } = await this.db
      .from('user_vocabulary')
      .upsert({
        user_id: userId,
        vocab_id: vocabId,
        status,
        last_seen_at: new Date().toISOString()
      }, { onConflict: 'user_id,vocab_id' });

    if (error) throw error;
  }

  async getUserVocabulary(
    status?: VocabStatus
  ): Promise<UserVocabularyWithWord[]> {
    const userId = this.auth.user()?.id;
    if (!userId) return [];

    let query = this.db
      .from('user_vocabulary')
      .select('*, vocabulary(*)')
      .eq('user_id', userId)
      .order('last_seen_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data as UserVocabularyWithWord[];
  }

  async getWordsDueToday(): Promise<WordDueToday[]> {
    const userId = this.auth.user()?.id;
    if (!userId) return [];

    const { data, error } = await this.db
      .from('v_words_due_today')
      .select('*')
      .eq('user_id', userId)
      .order('next_review_at', { ascending: true });

    if (error) throw error;
    return data as WordDueToday[];
  }

  async processReview(userVocabId: string, quality: number): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const { data: uvData } = await this.db
      .from('user_vocabulary')
      .select('vocab_id')
      .eq('id', userVocabId)
      .single();

    if (!uvData) return;

    const { error } = await this.db.rpc('process_srs_review', {
      p_user_id:  userId,
      p_vocab_id: uvData.vocab_id,
      p_quality:  quality
    });

    if (error) throw error;
  }
}
