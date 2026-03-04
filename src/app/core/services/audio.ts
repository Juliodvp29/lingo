import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  readonly isSpeaking = signal(false);
  readonly currentCharIndex = signal<number | null>(null);
  readonly isSupported = 'speechSynthesis' in window;

  private utterance: SpeechSynthesisUtterance | null = null;

  speak(text: string, onEnd?: () => void): void {
    if (!this.isSupported) return;

    this.stop();

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.lang = 'en-US';
    this.utterance.rate = 0.85;
    this.utterance.pitch = 1;
    this.utterance.volume = 1;

    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.lang === 'en-US' && (
        v.name.includes('Samantha') ||
        v.name.includes('Google US') ||
        v.name.includes('Microsoft Aria')
      )
    ) ?? voices.find(v => v.lang === 'en-US')
      ?? voices.find(v => v.lang.startsWith('en'));

    if (preferred) this.utterance.voice = preferred;

    this.utterance.onstart = () => {
      this.isSpeaking.set(true);
      this.currentCharIndex.set(0);
    };
    this.utterance.onend = () => {
      this.isSpeaking.set(false);
      this.currentCharIndex.set(null);
      onEnd?.();
    };
    this.utterance.onerror = () => {
      this.isSpeaking.set(false);
      this.currentCharIndex.set(null);
    };

    this.utterance.onboundary = (event) => {
      if (event.name === 'word') {
        console.log(`[AudioService] Word boundary at index: ${event.charIndex}, text length: ${text.length}`);
        this.currentCharIndex.set(event.charIndex);
      }
    };

    console.log(`[AudioService] Speaking: "${text}"`);
    window.speechSynthesis.speak(this.utterance);
  }

  stop(): void {
    console.log('[AudioService] Stopping playback');
    window.speechSynthesis.cancel();
    this.isSpeaking.set(false);
    this.currentCharIndex.set(null);
  }

  pronounceWord(word: string): void {
    this.speak(word);
  }

  readScene(text: string, onEnd?: () => void): void {
    const clean = text.replace(/\{(\w+)\}/g, '$1');
    this.speak(clean, onEnd);
  }

}
