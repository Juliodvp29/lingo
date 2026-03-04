import { Injectable } from '@angular/core';
import { CefrLevel, Story, StoryWithProgress } from '../models';
import { AuthService } from './auth';
import { SupabaseService } from './supabase';

@Injectable({
  providedIn: 'root',
})
export class StoryService {
  private get db() { return this.supabase.client; }

  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) { }

  async getStoriesForFeed(level?: CefrLevel): Promise<StoryWithProgress[]> {
    const userId = this.auth.user()?.id;

    let query = this.db
      .from('stories')
      .select(`
        *,
        user_progress:user_story_progress(*)
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (level) {
      query = query.eq('level', level);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data as any[]).map(story => ({
      ...story,
      scenes: story.scenes?.scenes ?? story.scenes ?? [],
      user_progress: story.user_progress?.[0] ?? null
    })) as StoryWithProgress[];
  }

  async getStoryById(id: string): Promise<Story> {
    const { data, error } = await this.db
      .from('stories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    const raw = data as any;
    return {
      ...raw,
      scenes: raw.scenes?.scenes ?? raw.scenes ?? [],
      quiz: raw.scenes?.quiz ?? []
    } as Story;
  }

  async upsertReadingProgress(
    storyId: string,
    readPercentage: number,
    completed: boolean
  ): Promise<void> {
    const userId = this.auth.user()?.id;
    if (!userId) return;

    const { error } = await this.db
      .from('user_story_progress')
      .upsert({
        user_id: userId,
        story_id: storyId,
        read_percentage: readPercentage,
        completed,
        completed_at: completed ? new Date().toISOString() : null
      }, { onConflict: 'user_id,story_id' });

    if (error) throw error;
  }
}
