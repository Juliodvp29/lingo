import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { VocabStatus, Vocabulary } from '@app/core/models';
import { AudioService } from '@app/core/services/audio';
import { IonSpinner } from "@ionic/angular/standalone";

@Component({
  selector: 'app-word-card',
  templateUrl: './word-card.component.html',
  styleUrls: ['./word-card.component.scss'],
  imports: [IonSpinner, CommonModule],
})
export class WordCardComponent {

  @Input() word!: Vocabulary;
  @Input() currentStatus: VocabStatus | null = null;
  @Input() isLoading = false;

  @Output() statusChange = new EventEmitter<VocabStatus>();
  @Output() close = new EventEmitter<void>();

  readonly audio = inject(AudioService);

  protected statusLabels: Record<VocabStatus, string> | any = {
    new: '🔵 Nueva',
    learning: '🟡 Aprendiendo',
    known: '🟢 Conocida'
  };

  protected statusList: VocabStatus[] = ['new', 'learning', 'known'];

  select(status: VocabStatus) {
    this.statusChange.emit(status);
  }

  pronounce() {
    this.audio.pronounceWord(this.word.word);
  }

}
