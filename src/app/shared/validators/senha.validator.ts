import { AbstractControl, ValidationErrors } from '@angular/forms';

export function senhaForteValidator(control: AbstractControl): ValidationErrors | null {
  const value: string = control.value || '';
  if (!value) return null;

  const temMaiuscula = /[A-Z]/.test(value);
  const temNumero    = /[0-9]/.test(value);

  if (!temMaiuscula || !temNumero) {
    return { senhaFraca: true };
  }
  return null;
}
