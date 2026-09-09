export type EnrollmentStatus = "active" | "completed" | "cancelled";

export type Enrollment = {
  id: number;

  student_id: number;
  batch_id: number;

  joined_at: string;

  left_at?: string | null;

  status: EnrollmentStatus;

  created_at: string;
  updated_at: string;
};

export type CreateEnrollmentPayload = {
  student_id: number;
  batch_id: number;
  joined_at?: string;
};

export type UpdateEnrollmentPayload = {
  status: "completed" | "cancelled";

  left_at?: string;
};
