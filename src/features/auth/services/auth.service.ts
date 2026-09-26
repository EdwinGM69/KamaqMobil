import { type SQLiteDatabase } from "expo-sqlite";

export interface AuthUser {
  id: number;
  username: string;
  name: string;
  role: string;
}

const MOCK_USERS: Array<{ username: string; password: string }> = [
  { username: "admin", password: "admin123" },
  { username: "edwin", password: "123456" },
  { username: "maria", password: "123456" },
];

export const authService = {
  login: async (
    db: SQLiteDatabase,
    username: string,
    password: string
  ): Promise<AuthUser | null> => {
    const mockUser = MOCK_USERS.find(
      (u) => u.username === username && u.password === password
    );

    if (!mockUser) {
      await new Promise((resolve) => setTimeout(resolve, 300));
      return null;
    }

    const user = await db.getFirstAsync<AuthUser>(
      "SELECT id, username, name, role FROM users WHERE username = ?",
      [username]
    );

    return user;
  },

  getMockUsers: () => MOCK_USERS,
};
