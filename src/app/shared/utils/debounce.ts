import { DestroyRef, signal, type Signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

export function createDebouncedSignal(
  initial: string,
  delayMs: number,
  destroyRef: DestroyRef,
): { value: Signal<string>; set: (v: string) => void } {
  const raw = signal(initial);
  const debounced = signal(initial);
  const trigger = new Subject<string>();

  trigger.pipe(
    debounceTime(delayMs),
    distinctUntilChanged(),
    takeUntilDestroyed(destroyRef),
  ).subscribe((v: string) => debounced.set(v));

  return {
    value: debounced.asReadonly(),
    set: (v: string) => {
      raw.set(v);
      trigger.next(v);
    },
  };
}
