import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '../services/translate.service';

@Pipe({
  name: 'translate',
  standalone: true
})
export class TranslatePipe implements PipeTransform {
  private translateService = inject(TranslateService);

  transform(key: string): string {
    return this.translateService.translate(key);
  }
} 