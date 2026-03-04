import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonSkeletonText, IonRefresher, IonRefresherContent } from '@ionic/angular/standalone';
import { CefrLevel, StoryWithProgress } from '@app/core/models';
import { AppStore } from '@app/core/store/app.store';
import { AuthService } from '@app/core/services/auth';
import { StoryService } from '@app/core/services/story';
import { ProgressService } from '@app/core/services/progress';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonSkeletonText, IonRefresher, IonRefresherContent]
})
export class HomePage implements OnInit {

  readonly store = inject(AppStore);
  readonly auth = inject(AuthService);
  private stories$ = inject(StoryService);
  private progress = inject(ProgressService);
  private router = inject(Router);

  stories = signal<StoryWithProgress[]>([]);
  loading = signal(true);
  activeLevel = signal<CefrLevel | null>(null);

  levels: { value: CefrLevel | null, label: string }[] = [
    { value: null, label: 'Todas' },
    { value: 'a1', label: 'A1' },
    { value: 'a2', label: 'A2' },
    { value: 'b1', label: 'B1' },
    { value: 'b2', label: 'B2' },
  ];

  async ngOnInit() {
    await this.loadStories();
  }

  async loadStories(level?: CefrLevel | null) {
    this.loading.set(true);
    try {
      const data = await this.stories$.getStoriesForFeed(level ?? undefined);
      this.stories.set(data);
    } finally {
      this.loading.set(false);
    }
  }

  async filterByLevel(level: CefrLevel | null) {
    this.activeLevel.set(level);
    await this.loadStories(level);
  }

  async handleRefresh(event: any) {
    const [stats, todayProgress] = await Promise.all([
      this.progress.getUserStats(),
      this.progress.getTodayProgress(),
      this.loadStories(this.activeLevel() ?? undefined)
    ]);
    this.store.setStats(stats);
    this.store.setTodayProgress(todayProgress);
    event.target.complete();
  }

  openStory(id: string) {
    this.router.navigate(['/reader', id]);
  }

  get ringOffset(): number {
    const circumference = 2 * Math.PI * 32;
    return circumference * (1 - this.store.dailyGoalProgress());
  }

  levelColor(level: CefrLevel): string {
    const map: Record<CefrLevel, string> = {
      a1: '#3DAA72', a2: '#3A7BE8',
      b1: '#F5C842', b2: '#E8623A',
      c1: '#9B59B6', c2: '#1A1714'
    };
    return map[level];
  }

}
