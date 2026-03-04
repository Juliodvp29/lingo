import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonTabButton, IonTabs, IonTabBar, IonLabel, IonBadge } from '@ionic/angular/standalone';
import { AppStore } from '@app/core/store/app.store';
import { Vocabulary } from '@app/core/services/vocabulary';
import { Progress } from '@app/core/services/progress';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonTabButton, IonTabs, IonTabBar, IonLabel, IonBadge]
})
export class TabsPage implements OnInit {
  readonly store = inject(AppStore);

  private vocab = inject(Vocabulary);
  private progress = inject(Progress);

  async ngOnInit() {
    const [stats, todayProgress, wordsDue] = await Promise.all([
      this.progress.getUserStats(),
      this.progress.getTodayProgress(),
      this.vocab.getWordsDueToday()
    ]);

    this.store.setStats(stats);
    this.store.setTodayProgress(todayProgress);
    this.store.setWordsDue(wordsDue);
    this.store.setReviewCount(wordsDue.length);
  }

}
