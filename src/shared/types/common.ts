export type Nullable<T> = T | null;

export type ID = number;

export type DateString = string;

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export type LoadingState = "idle" | "loading" | "success" | "error";

export type SortDirection = "asc" | "desc";

export interface Identifiable {
  id: ID;
}
