import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { QuizQuestion, SessionResult } from '@app/core/models';

@Component({
  selector: 'app-quiz',
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.scss'],
})
export class QuizComponent {
  @Input() questions: QuizQuestion[] = [];
  @Input() storyTitle = '';
  @Output() completed = new EventEmitter<SessionResult>();
  @Output() dismissed = new EventEmitter<void>();

  currentIndex = signal(0);
  selectedIndex = signal<number | null>(null);
  answered = signal(false);
  score = signal(0);

  get current() { return this.questions[this.currentIndex()]; }
  get isLast() { return this.currentIndex() === this.questions.length - 1; }

  get progressPct() {
    return ((this.currentIndex()) / this.questions.length) * 100;
  }

  selectOption(idx: number) {
    // Only allow one answer per question
    if (this.answered()) return;
    this.selectedIndex.set(idx);
    this.answered.set(true);
    if (idx === this.current.correctIndex) {
      this.score.update(s => s + 1);
    }
  }

  optionClass(idx: number): string {
    if (!this.answered()) return '';
    if (idx === this.current.correctIndex) return 'correct';
    if (idx === this.selectedIndex() && idx !== this.current.correctIndex) return 'wrong';
    return '';
  }

  next() {
    if (!this.isLast) {
      this.currentIndex.update(i => i + 1);
      this.selectedIndex.set(null);
      this.answered.set(false);
    } else {
      this.finish();
    }
  }

  finish() {
    const total = this.questions.length;
    const s = this.score();
    this.completed.emit({
      score: s,
      totalQuestions: total,
      // Map quiz performance to XP and word mastery gains
      xpAwarded: s * 10,
      wordsLearned: s,
      minutesRead: 5
    });
  }

}
