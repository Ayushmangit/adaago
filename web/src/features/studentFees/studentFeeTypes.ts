export type FeeDueStatus = "pending" | "partial" | "paid" | "cancelled";

export type StudentFee = {
  id: number;
  enrollment_id: number;
  student_id: number;
  student_name: string;
  batch_id: number;
  batch_name: string;
  program_id: number;
  program_name: string;
  billing_month: string;
  amount_paise: number;
  due_date: string;
  status: FeeDueStatus;
  notes?: string | null;
  paid_at?: string | null;
  created_at: string;
  updated_at: string;
};
