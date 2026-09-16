import { createSlice } from "@reduxjs/toolkit";

import {
  bulkAttendance,
  createAttendance,
  getAttendanceByID,
  getBatchAttendance,
  getBatchAttendanceRegister,
  getEnrollmentAttendance,
  getMyAttendance,
  updateAttendance,
} from "./attendanceThunks";

import type { Attendance, AttendanceRegisterRow } from "./attendanceTypes";

type AttendanceState = {
  attendance: Attendance[];
  register: AttendanceRegisterRow[];
  selectedAttendance: Attendance | null;

  loading: boolean;
  registerLoading: boolean;
  creating: boolean;
  updating: boolean;
  bulkUpdating: boolean;

  error: string | null;
  registerError: string | null;
  createError: string | null;
  updateError: string | null;
  bulkError: string | null;
};

const initialState: AttendanceState = {
  attendance: [],
  register: [],
  selectedAttendance: null,

  loading: false,
  registerLoading: false,
  creating: false,
  updating: false,
  bulkUpdating: false,

  error: null,
  registerError: null,
  createError: null,
  updateError: null,
  bulkError: null,
};

const attendanceSlice = createSlice({
  name: "attendance",

  initialState,

  reducers: {
    clearAttendanceError(state) {
      state.error = null;
      state.registerError = null;
    },

    clearCreateAttendanceError(state) {
      state.createError = null;
    },

    clearUpdateAttendanceError(state) {
      state.updateError = null;
    },

    clearAttendance(state) {
      state.attendance = [];
      state.register = [];
      state.selectedAttendance = null;

      state.error = null;
      state.registerError = null;
      state.createError = null;
      state.updateError = null;
      state.bulkError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // GET BATCH ATTENDANCE REGISTER
      .addCase(getBatchAttendanceRegister.pending, (state) => {
        state.registerLoading = true;
        state.registerError = null;
      })
      .addCase(getBatchAttendanceRegister.fulfilled, (state, action) => {
        state.registerLoading = false;
        state.register = action.payload;
      })
      .addCase(getBatchAttendanceRegister.rejected, (state, action) => {
        state.registerLoading = false;
        state.registerError =
          action.payload ?? "Failed to get attendance register";
      })

      // GET BATCH ATTENDANCE
      .addCase(getBatchAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBatchAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.attendance = action.payload;
      })
      .addCase(getBatchAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to get batch attendance";
      })

      // GET ENROLLMENT ATTENDANCE
      .addCase(getEnrollmentAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getEnrollmentAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.attendance = action.payload;
      })
      .addCase(getEnrollmentAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to get enrollment attendance";
      })

      // GET MY ATTENDANCE
      .addCase(getMyAttendance.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getMyAttendance.fulfilled, (state, action) => {
        state.loading = false;
        state.attendance = action.payload;
      })
      .addCase(getMyAttendance.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to get attendance";
      })

      // GET ATTENDANCE BY ID
      .addCase(getAttendanceByID.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAttendanceByID.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedAttendance = action.payload;
      })
      .addCase(getAttendanceByID.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Failed to get attendance";
      })

      // CREATE ATTENDANCE
      .addCase(createAttendance.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createAttendance.fulfilled, (state, action) => {
        state.creating = false;

        const attendance = action.payload;

        const attendanceIndex = state.attendance.findIndex(
          (record) => record.id === attendance.id,
        );

        if (attendanceIndex === -1) {
          state.attendance.push(attendance);
        } else {
          state.attendance[attendanceIndex] = attendance;
        }

        updateRegisterRow(state.register, attendance);
      })
      .addCase(createAttendance.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload ?? "Failed to mark attendance";
      })

      // UPDATE ATTENDANCE
      .addCase(updateAttendance.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateAttendance.fulfilled, (state, action) => {
        state.updating = false;

        const attendance = action.payload;

        const attendanceIndex = state.attendance.findIndex(
          (record) => record.id === attendance.id,
        );

        if (attendanceIndex !== -1) {
          state.attendance[attendanceIndex] = attendance;
        }

        if (state.selectedAttendance?.id === attendance.id) {
          state.selectedAttendance = attendance;
        }

        updateRegisterRow(state.register, attendance);
      })
      .addCase(updateAttendance.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload ?? "Failed to update attendance";
      })

      // BULK ATTENDANCE
      .addCase(bulkAttendance.pending, (state) => {
        state.bulkUpdating = true;
        state.bulkError = null;
      })
      .addCase(bulkAttendance.fulfilled, (state, action) => {
        state.bulkUpdating = false;

        for (const attendance of action.payload) {
          const attendanceIndex = state.attendance.findIndex(
            (record) => record.id === attendance.id,
          );

          if (attendanceIndex === -1) {
            state.attendance.push(attendance);
          } else {
            state.attendance[attendanceIndex] = attendance;
          }

          updateRegisterRow(state.register, attendance);
        }
      })
      .addCase(bulkAttendance.rejected, (state, action) => {
        state.bulkUpdating = false;
        state.bulkError = action.payload ?? "Failed to mark bulk attendance";
      });
  },
});

function updateRegisterRow(
  register: AttendanceRegisterRow[],
  attendance: Attendance,
) {
  const index = register.findIndex(
    (row) => row.enrollment_id === attendance.enrollment_id,
  );

  if (index === -1) return;

  register[index].attendance_id = attendance.id;
  register[index].status = attendance.status;
  register[index].remarks = attendance.remarks ?? null;
  register[index].marked_by = attendance.marked_by;
  register[index].marked_at = attendance.marked_at;
  register[index].updated_at = attendance.updated_at;
}

export const {
  clearAttendanceError,
  clearCreateAttendanceError,
  clearUpdateAttendanceError,
  clearAttendance,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;
