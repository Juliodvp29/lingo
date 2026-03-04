import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
    IonContent, IonSpinner,
    ToastController
} from '@ionic/angular/standalone';
import { AuthService } from '@services/auth';

@Component({
    selector: 'app-login',
    templateUrl: './login.page.html',
    styleUrls: ['./login.page.scss'],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        IonContent,
        IonSpinner,
    ],
})
export class LoginPage {
    readonly isLoading = signal(false);
    readonly showPass = signal(false);
    readonly errorMsg = signal('');

    form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
    });

    constructor(
        private fb: FormBuilder,
        private auth: AuthService,
        private router: Router,
        private toast: ToastController,
    ) { }

    get email() { return this.form.controls.email; }
    get password() { return this.form.controls.password; }

    togglePass() { this.showPass.update(v => !v); }

    async signIn() {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        this.isLoading.set(true);
        this.errorMsg.set('');
        try {
            await this.auth.signInWithEmail(
                this.email.value!,
                this.password.value!
            );
            this.router.navigate(['/tabs/home']);
        } catch (err: any) {
            this.errorMsg.set(this.mapError(err.message));
        } finally {
            this.isLoading.set(false);
        }
    }

    async signInWithGoogle() {
        this.isLoading.set(true);
        try {
            await this.auth.signInWithGoogle();
        } catch (err: any) {
            this.errorMsg.set(this.mapError(err.message));
            this.isLoading.set(false);
        }
    }

    private mapError(msg: string): string {
        if (msg?.includes('Invalid login')) return 'Email o contraseña incorrectos.';
        if (msg?.includes('Email not confirmed')) return 'Confirma tu email antes de entrar.';
        return 'Ocurrió un error. Intenta de nuevo.';
    }
}
