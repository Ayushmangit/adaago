export type StudentStatus = "active" | "inactive";

export type StudentWithUser = {
  id: number;
  user_id: number;

  full_name: string;

  phone: string | null;

  date_of_birth: string | null;

  guardian_name: string | null;

  guardian_phone: string | null;

  address: string | null;

  joined_at: string;

  status: StudentStatus;

  created_at: string;

  updated_at: string;

  username: string;

  email: string;

  role: "student";
};
