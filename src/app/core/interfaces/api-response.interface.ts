export interface ApiResponse<T, M = unknown> {
  ok: boolean;
  message: string;
  data: T;
  meta: M;
}
