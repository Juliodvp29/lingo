import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  readonly isSpeaking = signal(false);
  readonly currentCharIndex = signal<number | null>(null);
  readonly isSupported = true;

  private utterance: SpeechSynthesisUtterance | null = null;
  private wordBoundaryTimer: any = null;

  speak(text: string, onEnd?: () => void): void {
    if (!('speechSynthesis' in window)) {
      console.warn('[AudioService] speechSynthesis no disponible');
      onEnd?.();
      return;
    }

    if (!this.isSupported) return;
    this.stop();

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
      window.speechSynthesis.onvoiceschanged = () => { setVoice(); };
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

  private startWordBoundaryFallback(text: string): void {
    const words: { word: string; start: number }[] = [];
    const regex = /\S+/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      words.push({ word: m[0], start: m.index });
    }

    if (!words.length) return;

    let boundaryFired = false;

    const origBoundary = this.utterance!.onboundary;
    this.utterance!.onboundary = (event) => {
      boundaryFired = true;
      origBoundary?.call(this.utterance!, event);
    };

    const checkTimer = setTimeout(() => {
      if (!boundaryFired && this.isSpeaking()) {
        this.runTimerBasedHighlight(words, text.length);
      }
    }, 350);

    this.wordBoundaryTimer = checkTimer;
  }

  private runTimerBasedHighlight(
    words: { word: string; start: number }[],
    totalLength: number
  ): void {
    const wpm = 140 * 0.82;
    const totalWords = words.length;
    const totalMs = (totalWords / wpm) * 60 * 1000;
    const msPerWord = totalMs / totalWords;

    let i = 0;

    const tick = () => {
      if (!this.isSpeaking() || i >= words.length) return;
      this.currentCharIndex.set(words[i].start);
      i++;
      this.wordBoundaryTimer = setTimeout(tick, msPerWord);
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
    window.speechSynthesis.cancel();
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
