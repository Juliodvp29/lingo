import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { trigger, transition, style, animate } from '@angular/animations';
import { CefrLevel, OnboardingData } from '@app/core/models';
import { Auth } from '@app/core/services/auth';
import { Router } from '@angular/router';

@Component({
  selector: 'app-onboarding',
  templateUrl: './onboarding.page.html',
  styleUrls: ['./onboarding.page.scss'],
  standalone: true,
  imports: [IonContent, CommonModule, FormsModule, IonSpinner],
  animations: [
    trigger('fadeSlide', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(16px)' }),
        animate('300ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ]
})
export class OnboardingPage {

  private auth = inject(Auth);
  private router = inject(Router);

  step = signal(0);
  isLoading = signal(false);
  errorMsg = signal<string | null>(null);

  selectedLevel = signal<CefrLevel>('a1');
  selectedInterests = signal<string[]>([]);
  selectedGoal = signal<number>(10);

  levels = [
    { value: 'a1' as CefrLevel, label: 'Principiante', desc: 'Sé muy poco o nada' },
    { value: 'a2' as CefrLevel, label: 'Básico', desc: 'Entiendo frases simples' },
    { value: 'b1' as CefrLevel, label: 'Intermedio', desc: 'Me defiendo en conversaciones' },
    { value: 'b2' as CefrLevel, label: 'Avanzado', desc: 'Leo y escucho con fluidez' },
  ];

  interests = [
    { value: 'travel', label: 'Viajes', emoji: '✈️' },
    { value: 'business', label: 'Negocios', emoji: '💼' },
    { value: 'science', label: 'Ciencia', emoji: '🔬' },
    { value: 'culture', label: 'Cultura', emoji: '🎭' },
    { value: 'food', label: 'Gastronomía', emoji: '🍽️' },
    { value: 'tech', label: 'Tecnología', emoji: '💻' },
    { value: 'sports', label: 'Deportes', emoji: '⚽' },
    { value: 'nature', label: 'Naturaleza', emoji: '🌿' },
  ];

  goals = [
    { minutes: 5, label: 'Casual', desc: '5 min — una historia rápida', emoji: '🌱' },
    { minutes: 10, label: 'Regular', desc: '10 min — el punto ideal', emoji: '🔥' },
    { minutes: 15, label: 'Serio', desc: '15 min — progreso notorio', emoji: '🚀' },
    { minutes: 20, label: 'Intensivo', desc: '20 min — aprende el doble', emoji: '⚡' },
  ];

  canAdvance = computed(() => {
    if (this.step() === 0) return !!this.selectedLevel();
    if (this.step() === 1) return this.selectedInterests().length > 0;
    if (this.step() === 2) return !!this.selectedGoal();
    return false;
  });

  isInterestSelected(value: string) {
    return this.selectedInterests().includes(value);
  }

  toggleInterest(value: string) {
    this.selectedInterests.update(list =>
      list.includes(value) ? list.filter(i => i !== value) : [...list, value]
    );
  }

  async advance() {
    if (!this.canAdvance()) return;

    if (this.step() < 2) {
      this.step.update(s => s + 1);
      return;
    }

    this.isLoading.set(true);
    this.errorMsg.set(null);
    try {
      await this.auth.updateProfile({
        level: this.selectedLevel(),
        interests: this.selectedInterests(),
        daily_goal_minutes: this.selectedGoal(),
      });
      await this.router.navigate(['/tabs/home'], { replaceUrl: true });
    } catch (e: any) {
      console.error('[Onboarding] Error al guardar:', e);
      this.errorMsg.set(e?.message ?? 'Error al guardar. Intenta de nuevo.');
    } finally {
      this.isLoading.set(false);
    }
  }

}
