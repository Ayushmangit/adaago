export type AttendanceStatus = "present" | "absent" | "leave";

export type Attendance = {
  id: number;
  enrollment_id: number;
  attendance_date: string;
  status: AttendanceStatus;
  remarks?: string | null;
  marked_by: number;
  marked_at: string;
  updated_at: string;
};

export type CreateAttendancePayload = {
  enrollment_id: number;
  attendance_date: string;
  status: AttendanceStatus;
  remarks?: string;
};

export type UpdateAttendancePayload = {
  status: AttendanceStatus;
  remarks?: string;
};

export type UpdateAttendanceArgs = {
  attendanceID: number;
  payload: UpdateAttendancePayload;
};

export type BulkAttendanceRecord = {
  enrollment_id: number;
  status: AttendanceStatus;
  remarks?: string;
};

export type BulkAttendancePayload = {
  attendance_date: string;
  records: BulkAttendanceRecord[];
};

export type BulkAttendanceArgs = {
  batchID: number;
  payload: BulkAttendancePayload;
};
