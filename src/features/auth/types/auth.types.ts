export interface User {
  id: number;
  username: string;
  name: string;
  role: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
