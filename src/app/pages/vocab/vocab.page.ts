import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { VocabularyService } from '@app/core/services/vocabulary';
import { AudioService } from '@app/core/services/audio';
import { AppStore } from '@app/core/store/app.store';
import { UserVocabularyWithWord, VocabStatus, WordDueToday } from '@app/core/models';

type Tab = 'list' | 'review';

@Component({
  selector: 'app-vocab',
  templateUrl: './vocab.page.html',
  styleUrls: ['./vocab.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonSpinner]
})
export class VocabPage implements OnInit {

  private vocabSvc = inject(VocabularyService);
  readonly audio = inject(AudioService);
  readonly store = inject(AppStore);

  activeTab = signal<Tab>('list');

  allWords = signal<UserVocabularyWithWord[]>([]);
  activeFilter = signal<VocabStatus | null>(null);
  loadingList = signal(true);

  filteredWords = computed(() => {
    const f = this.activeFilter();
    // Dynamically filter vocabulary list based on selected status (New, Learning, Known)
    return f ? this.allWords().filter(w => w.status === f) : this.allWords();
  });

  reviewWords = signal<WordDueToday[]>([]);
  loadingReview = signal(false);
  reviewIndex = signal(0);
  showAnswer = signal(false);
  reviewDone = signal(false);
  reviewResults = signal<{ word: string; quality: number }[]>([]);

  get currentReviewWord() {
    return this.reviewWords()[this.reviewIndex()];
  }

  get reviewProgress() {
    const total = this.reviewWords().length;
    if (!total) return 0;
    return Math.round((this.reviewIndex() / total) * 100);
  }

  readonly filters: { value: VocabStatus | null; label: string; color: string }[] = [
    { value: null, label: 'Todas', color: 'var(--lingo-ink)' },
    { value: 'new', label: '🔵 Nuevas', color: '#3A7BE8' },
    { value: 'learning', label: '🟡 Aprendiendo', color: '#F5C842' },
    { value: 'known', label: '🟢 Conocidas', color: '#3DAA72' },
  ];

  async ngOnInit() {
    await this.loadList();
  }

  async loadList() {
    this.loadingList.set(true);
    try {
      const words = await this.vocabSvc.getUserVocabulary();
      this.allWords.set(words);
    } finally {
      this.loadingList.set(false);
    }
  }

  async switchTab(tab: Tab) {
    this.activeTab.set(tab);
    if (tab === 'review') {
      await this.loadReview();
    }
  }

  async loadReview() {
    this.loadingReview.set(true);
    this.reviewIndex.set(0);
    this.showAnswer.set(false);
    this.reviewDone.set(false);
    this.reviewResults.set([]);
    try {
      const words = await this.vocabSvc.getWordsDueToday();
      this.reviewWords.set(words);
    } finally {
      this.loadingReview.set(false);
    }
  }

  flip() {
    this.showAnswer.set(true);
    if (this.currentReviewWord) {
      // Speak the word automatically when revealing the translation
      this.audio.pronounceWord(this.currentReviewWord.word);
    }
  }

  async rate(quality: number) {
    const word = this.currentReviewWord;
    if (!word) return;

    this.reviewResults.update(r => [...r, { word: word.word, quality }]);

    try {
      // Use SRS algorithm (Spaced Repetition System) to process the word review
      await this.vocabSvc.processReview(word.user_vocab_id, quality);
    } catch (e) {
      console.error(e);
    }

    const next = this.reviewIndex() + 1;
    if (next >= this.reviewWords().length) {
      this.reviewDone.set(true);
      this.store.setReviewCount(0);
    } else {
      this.reviewIndex.set(next);
      this.showAnswer.set(false);
    }
  }

  get correctCount() {
    return this.reviewResults().filter(r => r.quality >= 3).length;
  }

  statusLabel(status: VocabStatus): string {
    const map: Record<VocabStatus, string> = {
      new: '🔵 Nueva', learning: '🟡 Aprendiendo', known: '🟢 Conocida'
    };
    return map[status];
  }

  statusColor(status: VocabStatus): string {
    const map: Record<VocabStatus, string> = {
      new: '#EBF1FF', learning: '#FFFAEB', known: '#E8F7EF'
    };
    return map[status];
  }

}
