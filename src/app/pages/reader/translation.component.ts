import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
    selector: 'app-translation',
    standalone: true,
    imports: [CommonModule],
    template: `
    <button class="trans-btn" (click)="visible = !visible">
      {{ visible ? '🙈 Ocultar' : '👁 Ver traducción' }}
    </button>
    @if (visible) {
      <p class="trans-text">{{ text }}</p>
    }
  `,
    styles: [`
    .trans-btn {
      background: none; border: none; cursor: pointer;
      font-size: 12px; color: var(--lingo-accent);
      padding: 4px 0; font-family: var(--lingo-font);
      display: flex; align-items: center; gap: 4px;
    }
    .trans-text {
      font-size: 13px; color: var(--lingo-ink-muted);
      font-style: italic; margin: 6px 0 0;
      padding: 10px 12px; background: var(--lingo-bg);
      border-radius: 8px; line-height: 1.5;
    }
  `]
})
export class TranslationComponent {
    @Input() text = '';
    visible = false;
}