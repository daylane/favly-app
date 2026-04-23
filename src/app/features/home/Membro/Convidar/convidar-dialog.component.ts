import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { ConviteService } from '../../Convite/convite.service';

@Component({
  selector: 'app-convidar-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './convidar-dialog.component.html',
  styleUrls: ['./convidar-dialog.component.scss'],
})
export class ConvidarDialogComponent {

  private fb             = inject(FormBuilder);
  private conviteService = inject(ConviteService);
  private dialogRef      = inject(MatDialogRef<ConvidarDialogComponent>);

  isLoading    = signal(false);
  errorMessage = signal('');

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  get emailControl(): AbstractControl { return this.form.get('email')!; }

  get emailError(): string {
    const c = this.emailControl;
    if (c.invalid && c.touched) {
      if (c.hasError('required')) return 'E-mail é obrigatório.';
      if (c.hasError('email'))    return 'E-mail inválido.';
    }
    return '';
  }

  onEnviar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.conviteService.convidar({ emailConvidado: this.form.value.email! }).subscribe({
      next: ()    => this.dialogRef.close(true),
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Erro ao enviar convite.');
      },
    });
  }

  onCancelar(): void {
    this.dialogRef.close(false);
  }
}
