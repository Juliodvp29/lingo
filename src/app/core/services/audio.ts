import { Injectable, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  readonly isSpeaking = signal(false);
  readonly currentCharIndex = signal<number | null>(null);
  readonly isSupported = true;

  private isNative = Capacitor.isNativePlatform();
  private utterance: SpeechSynthesisUtterance | null = null;
  private wordBoundaryTimer: any = null;

  async speak(text: string, onEnd?: () => void): Promise<void> {
    this.stop();

    if (this.isNative && TextToSpeech) {
      await this.speakNative(text, onEnd);
    } else {
      this.speakWeb(text, onEnd);
    }
  }

  private async speakNative(text: string, onEnd?: () => void): Promise<void> {
    try {
      this.isSpeaking.set(true);

      const words = this.extractWords(text);

      setTimeout(() => {
        if (this.isSpeaking()) {
          this.runTimerBasedHighlight(words);
        }
      }, 350);

      await TextToSpeech.speak({
        text,
        lang: 'en-US',
        rate: 0.85,
        pitch: 1.0,
        volume: 1.0,
        category: 'ambient',
      });

      this.isSpeaking.set(false);
      this.currentCharIndex.set(null);
      this.clearWordTimer();
      onEnd?.();
    } catch (e) {
      console.error('[AudioService] TTS nativo error:', e);
      this.isSpeaking.set(false);
      this.clearWordTimer();
    }
  }

  private speakWeb(text: string, onEnd?: () => void): void {
    if (!('speechSynthesis' in window)) {
      console.warn('[AudioService] speechSynthesis no disponible');
      return;
    }

    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.lang = 'en-US';
    this.utterance.rate = 0.82;
    this.utterance.pitch = 1;
    this.utterance.volume = 1;

    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v =>
        v.lang === 'en-US' && (
          v.name.includes('Samantha') ||
          v.name.includes('Google US') ||
          v.name.includes('Microsoft Aria')
        )
      ) ?? voices.find(v => v.lang === 'en-US')
        ?? voices.find(v => v.lang.startsWith('en'));
      if (preferred && this.utterance) this.utterance.voice = preferred;
    };

    if (window.speechSynthesis.getVoices().length) {
      setVoice();
    } else {
      window.speechSynthesis.onvoiceschanged = setVoice;
    }

    this.utterance.onstart = () => {
      this.isSpeaking.set(true);
      this.currentCharIndex.set(0);
    };
    this.utterance.onend = () => {
      this.isSpeaking.set(false);
      this.currentCharIndex.set(null);
      this.clearWordTimer();
      onEnd?.();
    };
    this.utterance.onerror = () => {
      this.isSpeaking.set(false);
      this.currentCharIndex.set(null);
      this.clearWordTimer();
    };
    this.utterance.onboundary = (event) => {
      if (event.name === 'word') {
        this.currentCharIndex.set(event.charIndex);
      }
    };

    window.speechSynthesis.speak(this.utterance);
    this.startWordBoundaryFallback(text);
  }

  private extractWords(text: string): { word: string; start: number }[] {
    const words: { word: string; start: number }[] = [];
    const regex = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      words.push({ word: m[0], start: m.index });
    }
    return words;
  }

  private startWordBoundaryFallback(text: string): void {
    const words = this.extractWords(text);
    if (!words.length) return;
    this.runTimerBasedHighlight(words);
  }
  private runTimerBasedHighlight(words: { word: string; start: number }[], totalChars?: number): void {
    if (!words.length) return;

    const charsPerSecond = 13;
    const totalText = words.map(w => w.word).join(' ');
    const estimatedTotalMs = (totalText.length / charsPerSecond) * 1000;
    const msPerWord = estimatedTotalMs / words.length;

    let i = 0;
    const tick = () => {
      if (!this.isSpeaking() || i >= words.length) return;
      this.currentCharIndex.set(words[i].start);
      i++;

      const currentWord = words[i - 1]?.word ?? '';
      const nextWord = words[i]?.word ?? '';
      const dynamicDelay = msPerWord * (0.5 + (nextWord.length / 8));

      this.wordBoundaryTimer = setTimeout(tick, dynamicDelay);
    };
    tick();
  }

  private clearWordTimer(): void {
    if (this.wordBoundaryTimer) {
      clearTimeout(this.wordBoundaryTimer);
      this.wordBoundaryTimer = null;
    }
  }

  stop(): void {
    if (this.isNative && TextToSpeech) {
      TextToSpeech.stop().catch(() => { });
    } else if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    this.isSpeaking.set(false);
    this.currentCharIndex.set(null);
    this.clearWordTimer();
  }

  pronounceWord(word: string): void {
    this.speak(word);
  }

  readScene(text: string, onEnd?: () => void): void {
    const clean = text.replace(/\{(\w+)\}/g, '$1');
    this.speak(clean, onEnd);
  }

}
