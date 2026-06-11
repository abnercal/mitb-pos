import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppEventsService {
  private readonly saleCompleted = new Subject<void>();
  readonly saleCompleted$ = this.saleCompleted.asObservable();

  notifySaleCompleted(): void {
    this.saleCompleted.next();
  }
}
