import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonSpinner } from '@ionic/angular/standalone';
import { AuthService } from '@app/core/services/auth';

function passwordsMatch(control: AbstractControl): ValidationErrors | null {
    const pw = control.get('password')?.value;
    const cpw = control.get('confirmPassword')?.value;
    // Cross-field validator to ensure passwords match during registration
    return pw && cpw && pw !== cpw ? { mismatch: true } : null;
}

@Component({
    selector: 'app-register',
    templateUrl: './register.page.html',
    styleUrls: ['./register.page.scss'],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterLink,
        IonContent,
        IonSpinner,
    ],
})
export class RegisterPage {
    readonly isLoading = signal(false);
    readonly showPass = signal(false);
    readonly showCPass = signal(false);
    readonly errorMsg = signal('');
    readonly success = signal(false);

    form = this.fb.group({
        displayName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
    }, { validators: passwordsMatch });

    constructor(
        private fb: FormBuilder,
        private auth: AuthService,
        private router: Router,
    ) { }

    get displayName() { return this.form.controls.displayName; }
    get email() { return this.form.controls.email; }
    get password() { return this.form.controls.password; }
    get confirmPassword() { return this.form.controls.confirmPassword; }
    get mismatch() { return this.form.hasError('mismatch') && this.confirmPassword.touched; }

    togglePass() { this.showPass.update(v => !v); }
    toggleCPass() { this.showCPass.update(v => !v); }

    async register() {
        if (this.form.invalid) { this.form.markAllAsTouched(); return; }
        this.isLoading.set(true);
        this.errorMsg.set('');
        try {
            await this.auth.signUpWithEmail(
                this.email.value!,
                this.password.value!,
                this.displayName.value!
            );
            this.success.set(true);
            // Auto-redirect to onboarding after successful registration
            setTimeout(() => this.router.navigate(['/onboarding']), 1500);
        } catch (err: any) {
            this.errorMsg.set(this.mapError(err.message));
        } finally {
            this.isLoading.set(false);
        }
    }

    private mapError(msg: string): string {
        if (msg?.includes('already registered')) return 'Este email ya tiene una cuenta.';
        if (msg?.includes('Password should be')) return 'La contraseña debe tener al menos 8 caracteres.';
        return 'Ocurrió un error. Intenta de nuevo.';
    }
}
