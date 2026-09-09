export type UserRole = "admin" | "student";

export type User = {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type LoginData = {
  user: User;
  access_token: string;
};

export type LoginResponse = {
  data: LoginData;
};

export type MeResponse = {
  data: User;
};
