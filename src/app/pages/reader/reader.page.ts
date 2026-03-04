import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { QuizQuestion, Scene, SessionResult, Story, UserVocabulary, VocabStatus, Vocabulary } from '@app/core/models';
import { ActivatedRoute, Router } from '@angular/router';
import { ProgressService } from '@app/core/services/progress';
import { StoryService } from '@app/core/services/story';
import { VocabularyService } from '@app/core/services/vocabulary';
import { AppStore } from '@app/core/store/app.store';
import { WordCardComponent } from './components/word-card/word-card.component';
import { QuizComponent } from './components/quiz/quiz.component';
import { TranslationComponent } from "./translation.component";
import { AudioService } from '@app/core/services/audio';

export interface TextToken {
  type: 'word' | 'text';
  content: string;
  key?: string;
  start: number;
  end: number;
}

@Component({
  selector: 'app-reader',
  templateUrl: './reader.page.html',
  styleUrls: ['./reader.page.scss'],
  standalone: true,
  imports: [IonContent, IonSpinner, CommonModule, FormsModule, WordCardComponent, QuizComponent, TranslationComponent]
})
export class ReaderPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private storySvc = inject(StoryService);
  private vocabSvc = inject(VocabularyService);
  private progSvc = inject(ProgressService);
  private store = inject(AppStore);
  readonly audio = inject(AudioService);

  loading = signal(true);
  story = signal<Story | null>(null);

  tokenizedScenes = signal<{ scene: Scene; tokens: TextToken[] }[]>([]);

  readProgress = signal(0);
  startTime = Date.now();

  wordCache = new Map<string, { vocab: Vocabulary | null; status: VocabStatus | null }>();

  activeWord = signal<string | null>(null);
  activeVocab = signal<Vocabulary | null>(null);
  activeStatus = signal<VocabStatus | null>(null);
  wordCardLoading = signal(false);

  playingSceneIndex = signal<number | null>(null);

  showQuiz = signal(false);
  quizQuestions = signal<QuizQuestion[]>([]);

  showResult = signal(false);
  sessionResult = signal<SessionResult | null>(null);

  wordsMarkedCount = 0;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.router.navigate(['/tabs/home']); return; }

    try {
      const story = await this.storySvc.getStoryById(id);
      this.story.set(story);
      this.tokenizedScenes.set(
        story.scenes.map((scene: Scene) => ({
          scene,
          tokens: this.tokenize(scene.text)
        }))
      );
      this.buildQuizFromStory(story);
    } catch (e) {
      console.error(e);
    } finally {
      this.loading.set(false);
    }
  }

  ngOnDestroy() {
    this.audio.stop();
    this.saveProgress(false);
  }

  tokenize(text: string): TextToken[] {
    const tokens: TextToken[] = [];
    const regex = /\{(\w+)\}/g;
    let lastIndex = 0;
    let cleanOffset = 0;
    let match: RegExpExecArray | null;

    const pushTextWords = (txt: string, startOffset: number) => {
      // Split by words and whitespace, keep punctuation attached to words for now
      const parts = txt.split(/(\s+)/);
      let localOffset = startOffset;
      for (const part of parts) {
        if (!part) continue;
        tokens.push({
          type: 'text',
          content: part,
          start: localOffset,
          end: localOffset + part.length
        });
        localOffset += part.length;
      }
      return localOffset;
    };

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        const content = text.slice(lastIndex, match.index);
        cleanOffset = pushTextWords(content, cleanOffset);
      }

      const word = match[1];
      tokens.push({
        type: 'word',
        content: word,
        key: word.toLowerCase(),
        start: cleanOffset,
        end: cleanOffset + word.length
      });
      cleanOffset += word.length;
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      const content = text.slice(lastIndex);
      pushTextWords(content, cleanOffset);
    }

    return tokens;
  }

  toggleSceneAudio(scene: Scene, index: number) {
    if (this.audio.isSpeaking() && this.playingSceneIndex() === index) {
      this.audio.stop();
      this.playingSceneIndex.set(null);
    } else {
      this.playingSceneIndex.set(index);
      this.audio.readScene(scene.text, () => {
        if (this.playingSceneIndex() === index) {
          this.playingSceneIndex.set(null);
        }
      });
    }
  }

  async onWordTap(word: string) {
    const key = word.toLowerCase();
    this.activeWord.set(word);
    this.wordCardLoading.set(true);

    if (this.wordCache.has(key)) {
      const cached = this.wordCache.get(key)!;
      this.activeVocab.set(cached.vocab);
      this.activeStatus.set(cached.status);
      this.wordCardLoading.set(false);
      return;
    }

    try {
      const vocab = await this.vocabSvc.lookupWord(key);
      const userStatus = vocab
        ? await this.vocabSvc.getUserWordStatus(vocab.id)
        : null;

      const status = userStatus?.status ?? null;
      this.wordCache.set(key, { vocab, status });
      this.activeVocab.set(vocab);
      this.activeStatus.set(status);
    } catch (e) {
      console.error(e);
    } finally {
      this.wordCardLoading.set(false);
    }
  }
  closeWordCard() {
    this.activeWord.set(null);
    this.activeVocab.set(null);
    this.activeStatus.set(null);
  }

  async onStatusChange(status: VocabStatus) {
    const vocab = this.activeVocab();
    if (!vocab) return;

    this.wordCardLoading.set(true);
    try {
      await this.vocabSvc.setWordStatus(vocab.id, status);
      this.wordCache.set(vocab.word.toLowerCase(), { vocab, status });
      this.activeStatus.set(status);
      this.wordsMarkedCount++;
    } catch (e) {
      console.error(e);
    } finally {
      this.wordCardLoading.set(false);
    }
  }

  onScroll(event: any) {
    const el = event.detail;
    const pct = Math.min(100, Math.round(
      (el.scrollTop / (el.scrollHeight - el.contentHeight)) * 100
    ));
    this.readProgress.set(pct);

    if (pct > 0 && pct % 25 === 0) {
      this.saveProgress(pct >= 100);
    }
  }

  private async saveProgress(completed: boolean) {
    const story = this.story();
    if (!story) return;
    try {
      await this.storySvc.upsertReadingProgress(
        story.id,
        this.readProgress(),
        completed
      );
    } catch (e) { console.error(e); }
  }
  private buildQuizFromStory(story: Story) {
    const questions: QuizQuestion[] = (story.scenes as any)?.quiz
      ?? (story as any).quiz
      ?? [];
    this.quizQuestions.set(questions);
  }

  startQuiz() {
    if (this.quizQuestions().length === 0) {
      this.completeWithoutQuiz();
      return;
    }
    this.showQuiz.set(true);
  }

  onQuizCompleted(result: SessionResult) {
    this.showQuiz.set(false);
    const minutesRead = Math.round((Date.now() - this.startTime) / 60000);
    const finalResult: SessionResult = {
      ...result,
      minutesRead: Math.max(minutesRead, 1),
      wordsLearned: this.wordsMarkedCount
    };
    this.sessionResult.set(finalResult);
    this.showResult.set(true);
    this.saveProgress(true);
    this.recordSession(finalResult);
  }

  private async completeWithoutQuiz() {
    const minutesRead = Math.max(
      Math.round((Date.now() - this.startTime) / 60000), 1
    );
    const result: SessionResult = {
      score: 0, totalQuestions: 0,
      xpAwarded: this.wordsMarkedCount * 5,
      wordsLearned: this.wordsMarkedCount,
      minutesRead
    };
    this.sessionResult.set(result);
    this.showResult.set(true);
    this.saveProgress(true);
    this.recordSession(result);
  }

  private async recordSession(result: SessionResult) {
    try {
      await this.progSvc.recordSession(
        result.minutesRead,
        result.xpAwarded,
        result.wordsLearned
      );
      this.store.addXp(result.xpAwarded);
    } catch (e) { console.error(e); }
  }

  goHome() {
    this.router.navigate(['/tabs/home']);
  }

  getWordStatus(word: string): VocabStatus | null {
    return this.wordCache.get(word.toLowerCase())?.status ?? null;
  }

}
