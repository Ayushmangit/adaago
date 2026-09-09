import { createSlice } from "@reduxjs/toolkit";

import {
  bulkAttendance,
  createAttendance,
  getAttendanceByID,
  getBatchAttendance,
  getEnrollmentAttendance,
  getMyAttendance,
  updateAttendance,
} from "./attendanceThunks";

import type { Attendance } from "./attendanceTypes";

type AttendanceState = {
  attendance: Attendance[];
  selectedAttendance: Attendance | null;

  loading: boolean;
  creating: boolean;
  updating: boolean;
  bulkUpdating: boolean;

  error: string | null;
  createError: string | null;
  updateError: string | null;
  bulkError: string | null;
};
const initialState: AttendanceState = {
  attendance: [],
  selectedAttendance: null,

  loading: false,
  creating: false,
  updating: false,
  bulkUpdating: false,

  error: null,
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
    },

    clearCreateAttendanceError(state) {
      state.createError = null;
    },

    clearUpdateAttendanceError(state) {
      state.updateError = null;
    },

    clearAttendance(state) {
      state.attendance = [];
      state.selectedAttendance = null;
      state.error = null;
      state.createError = null;
      state.updateError = null;
    },
  },

  extraReducers: (builder) => {
    builder

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

      // CREATE
      .addCase(createAttendance.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })
      .addCase(createAttendance.fulfilled, (state, action) => {
        state.creating = false;

        const existingIndex = state.attendance.findIndex(
          (record) => record.id === action.payload.id,
        );

        if (existingIndex === -1) {
          state.attendance.push(action.payload);
        } else {
          state.attendance[existingIndex] = action.payload;
        }
      })
      .addCase(createAttendance.rejected, (state, action) => {
        state.creating = false;
        state.createError = action.payload ?? "Failed to mark attendance";
      })

      // UPDATE
      .addCase(updateAttendance.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateAttendance.fulfilled, (state, action) => {
        state.updating = false;

        const index = state.attendance.findIndex(
          (record) => record.id === action.payload.id,
        );

        if (index !== -1) {
          state.attendance[index] = action.payload;
        }

        if (state.selectedAttendance?.id === action.payload.id) {
          state.selectedAttendance = action.payload;
        }
      })
      .addCase(updateAttendance.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload ?? "Failed to update attendance";
      });

    builder
      .addCase(bulkAttendance.pending, (state) => {
        state.bulkUpdating = true;
        state.bulkError = null;
      })
      .addCase(bulkAttendance.fulfilled, (state, action) => {
        state.bulkUpdating = false;
        state.attendance = action.payload;
      })
      .addCase(bulkAttendance.rejected, (state, action) => {
        state.bulkUpdating = false;
        state.bulkError = action.payload ?? "Failed to mark bulk attendance";
      });
  },
});

export const {
  clearAttendanceError,
  clearCreateAttendanceError,
  clearUpdateAttendanceError,
  clearAttendance,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;
