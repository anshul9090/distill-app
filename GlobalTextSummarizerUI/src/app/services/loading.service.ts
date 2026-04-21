import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  isLoading = signal(false);
  private count = 0;

  show() {
    this.count++;
    this.isLoading.set(true);
  }

  hide() {
    this.count = Math.max(0, this.count - 1);
    if (this.count === 0) this.isLoading.set(false);
  }
}