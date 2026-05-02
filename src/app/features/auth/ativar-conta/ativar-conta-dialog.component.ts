import {
  Component, inject, signal,
  ViewChildren, QueryList, ElementRef, AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule } from '@angular/forms';

import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { UsuarioService } from '../../../core/services/usuario.service';

export interface AtivarContaDialogData {
  email: string;
}

@Component({
  selector: 'app-ativar-conta-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './ativar-conta-dialog.component.html',
  styleUrls: ['./ativar-conta-dialog.component.scss']
})
export class AtivarContaDialogComponent implements AfterViewInit {

  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef<HTMLInputElement>>;

  private usuarioService = inject(UsuarioService);
  private snackBar       = inject(MatSnackBar);
  private dialogRef      = inject(MatDialogRef<AtivarContaDialogComponent>);
  data = inject<AtivarContaDialogData>(MAT_DIALOG_DATA);

  isLoading        = signal(false);
  isResending      = signal(false);
  errorMessage     = signal('');
  reenvioCountdown = signal(0);

  digits = ['', '', '', '', '', ''];

  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  // FormControl mantém o valor combinado para validação
  form = inject(FormBuilder).group({
    codigo: ['', [Validators.required, Validators.minLength(6)]],
  });

  get codigoInvalido(): boolean {
    return this.form.get('codigo')!.invalid && this.form.get('codigo')!.touched;
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.otpInputs.first?.nativeElement.focus(), 80);
  }

  onInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const val   = input.value.replace(/\D/g, '').slice(-1);
    input.value      = val;
    this.digits[index] = val;

    const combined = this.digits.join('');
    this.form.get('codigo')!.setValue(combined);

    if (val && index < 5) this.focusBox(index + 1);

    if (combined.length === 6 && this.digits.every(d => d)) {
      setTimeout(() => this.onConfirmar(), 200);
    }
  }

  onKeydown(index: number, event: KeyboardEvent): void {
    if (event.key === 'Backspace') {
      if (!this.digits[index] && index > 0) {
        this.digits[index - 1] = '';
        this.form.get('codigo')!.setValue(this.digits.join(''));
        this.focusBox(index - 1);
        event.preventDefault();
      }
    } else if (event.key === 'ArrowLeft'  && index > 0) { this.focusBox(index - 1); event.preventDefault(); }
    else if   (event.key === 'ArrowRight' && index < 5) { this.focusBox(index + 1); event.preventDefault(); }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const nums = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6).split('');
    nums.forEach((d, i) => {
      this.digits[i] = d;
      const el = this.otpInputs.toArray()[i]?.nativeElement;
      if (el) el.value = d;
    });
    const combined = this.digits.join('');
    this.form.get('codigo')!.setValue(combined);
    const nextEmpty = this.digits.findIndex(d => !d);
    this.focusBox(nextEmpty === -1 ? 5 : nextEmpty);
    if (combined.length === 6) setTimeout(() => this.onConfirmar(), 300);
  }

  private focusBox(index: number): void {
    const el = this.otpInputs.toArray()[index]?.nativeElement;
    el?.focus();
    el?.select();
  }

  onConfirmar(): void {
    this.form.get('codigo')!.markAsTouched();
    if (this.form.invalid || this.isLoading()) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.usuarioService.ativar(this.data.email, this.digits.join(''))
      .subscribe({
        next: () => {
          this.snackBar.open('Conta ativada! Faça login.', 'Fechar', { duration: 4000 });
          this.dialogRef.close(true);
        },
        error: (err) => {
          this.isLoading.set(false);
          this.errorMessage.set(err?.error?.message || 'Código inválido ou expirado.');
          this.resetBoxes();
        }
      });
  }

  onReenviar(): void {
    if (this.reenvioCountdown() > 0 || this.isResending()) return;

    this.isResending.set(true);
    this.errorMessage.set('');

    this.usuarioService.reenviarAtivacao(this.data.email)
      .subscribe({
        next: () => {
          this.isResending.set(false);
          this.snackBar.open('Código reenviado! Verifique seu e-mail.', 'Fechar', { duration: 4000 });
          this.iniciarCountdown(60);
        },
        error: (err) => {
          this.isResending.set(false);
          this.errorMessage.set(err?.error?.message || 'Erro ao reenviar código.');
        }
      });
  }

  private resetBoxes(): void {
    this.digits = ['', '', '', '', '', ''];
    this.form.get('codigo')!.setValue('');
    this.otpInputs.forEach(ref => { ref.nativeElement.value = ''; });
    setTimeout(() => this.focusBox(0), 50);
  }

  private iniciarCountdown(segundos: number): void {
    this.reenvioCountdown.set(segundos);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.countdownInterval = setInterval(() => {
      const atual = this.reenvioCountdown();
      if (atual <= 1) { this.reenvioCountdown.set(0); clearInterval(this.countdownInterval!); }
      else              this.reenvioCountdown.set(atual - 1);
    }, 1000);
  }

  onCancelar(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.dialogRef.close(false);
  }
}
