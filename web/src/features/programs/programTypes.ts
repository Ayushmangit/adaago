export type Program = {
  id: number;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateProgramPayload = {
  name: string;
  description?: string;
};

export type UpdateProgramPayload = {
  name?: string;
  description?: string;
  is_active?: boolean;
};
