import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonTabButton, IonTabs, IonTabBar, IonLabel, IonBadge } from '@ionic/angular/standalone';
import { AppStore } from '@app/core/store/app.store';
import { VocabularyService } from '@app/core/services/vocabulary';
import { ProgressService } from '@app/core/services/progress';

@Component({
  selector: 'app-tabs',
  templateUrl: './tabs.page.html',
  styleUrls: ['./tabs.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonTabButton, IonTabs, IonTabBar, IonLabel, IonBadge]
})
export class TabsPage implements OnInit {
  readonly store = inject(AppStore);

  private vocab = inject(VocabularyService);
  private progress = inject(ProgressService);

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
