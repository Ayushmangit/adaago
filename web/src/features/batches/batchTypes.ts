export type Batch = {
  id: number;
  program_id: number;
  name: string;
  start_time: string;
  end_time: string;
  weekdays: number[];
  monthly_fee_paise: number;
  capacity: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CreateBatchPayload = {
  program_id: number;
  name: string;
  start_time: string;
  end_time: string;
  weekdays: number[];
  monthly_fee_paise: number;
  capacity?: number;
};

export type UpdateBatchPayload = {
  name?: string;
  start_time?: string;
  end_time?: string;
  weekdays?: number[];
  monthly_fee_paise?: number;
  capacity?: number;
  is_active?: boolean;
};
