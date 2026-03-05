import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { AuthService } from '@app/core/services/auth';
import { ProgressService } from '@app/core/services/progress';
import { AppStore } from '@app/core/store/app.store';
import { Router } from '@angular/router';
import { DailyProgress, UserStats } from '@app/core/models';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonSpinner]
})
export class ProfilePage implements OnInit {

  readonly auth = inject(AuthService);
  readonly store = inject(AppStore);
  private progress = inject(ProgressService);
  private router = inject(Router);

  stats = signal<UserStats | null>(null);
  weeklyData = signal<DailyProgress[]>([]);
  loading = signal(true);

  readonly weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  async ngOnInit() {
    try {
      const [stats, weekly] = await Promise.all([
        this.progress.getUserStats(),
        this.progress.getWeeklyProgress()
      ]);
      this.stats.set(stats);
      this.weeklyData.set(weekly);
    } finally {
      this.loading.set(false);
    }
  }

  get weekGrid() {
    const days: { label: string; minutes: number; date: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = this.weekDays[d.getDay() === 0 ? 6 : d.getDay() - 1];
      const found = this.weeklyData().find(w => w.date === dateStr);
      days.push({ label: dayLabel, minutes: found?.minutes_read ?? 0, date: dateStr });
    }
    return days;
  }

  get maxMinutes(): number {
    const max = Math.max(...this.weekGrid.map(d => d.minutes), 1);
    return max;
  }

  get totalWeekMinutes(): number {
    return this.weeklyData().reduce((sum, d) => sum + d.minutes_read, 0);
  }

  get totalWeekXp(): number {
    return this.weeklyData().reduce((sum, d) => sum + d.xp_earned, 0);
  }
  get totalVocab(): number {
    const s = this.store.stats();
    if (!s) return 1;
    return (s.words_known + s.words_learning + s.words_new) || 1;
  }

  get goalPct(): number {
    const progress = this.store.todayProgress();
    const goal = this.auth.user()?.daily_goal_minutes ?? 10;
    if (!progress) return 0;
    return Math.min(100, Math.round((progress.minutes_read / goal) * 100));
  }

  get goalOffset(): number {
    const circumference = 2 * Math.PI * 26;
    return circumference * (1 - this.goalPct / 100);
  }

  isToday(dateStr: string): boolean {
    return dateStr === new Date().toISOString().split('T')[0];
  }

  levelLabel(level: string | null): string {
    const map: Record<string, string> = {
      a1: 'Principiante', a2: 'Básico',
      b1: 'Intermedio', b2: 'Avanzado',
      c1: 'Avanzado+', c2: 'Maestro'
    };
    return level ? map[level] ?? level.toUpperCase() : 'Sin nivel';
  }

  async signOut() {
    await this.auth.signOut();
    this.router.navigate(['/auth/login']);
  }

}
