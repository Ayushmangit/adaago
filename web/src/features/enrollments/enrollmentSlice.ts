import { createSlice } from "@reduxjs/toolkit";

import {
  createEnrollment,
  getBatchEnrollments,
  getMyEnrollments,
  getStudentEnrollments,
  updateEnrollment,
} from "./enrollmentThunks";

import type { Enrollment } from "./enrollmentTypes";

type EnrollmentState = {
  enrollments: Enrollment[];

  loading: boolean;

  creating: boolean;

  updating: boolean;

  error: string | null;

  createError: string | null;

  updateError: string | null;
};

const initialState: EnrollmentState = {
  enrollments: [],

  loading: false,

  creating: false,

  updating: false,

  error: null,

  createError: null,

  updateError: null,
};

const enrollmentSlice = createSlice({
  name: "enrollments",

  initialState,

  reducers: {
    clearEnrollments: (state) => {
      state.enrollments = [];

      state.error = null;
    },

    clearCreateEnrollmentError: (state) => {
      state.createError = null;
    },

    clearUpdateEnrollmentError: (state) => {
      state.updateError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      .addCase(getStudentEnrollments.pending, (state) => {
        state.loading = true;

        state.error = null;
      })

      .addCase(getStudentEnrollments.fulfilled, (state, action) => {
        state.loading = false;

        state.enrollments = action.payload;
      })

      .addCase(getStudentEnrollments.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload ?? "Unable to load enrollments";
      })

      .addCase(getBatchEnrollments.pending, (state) => {
        state.loading = true;

        state.error = null;
      })

      .addCase(getBatchEnrollments.fulfilled, (state, action) => {
        state.loading = false;

        state.enrollments = action.payload;
      })

      .addCase(getBatchEnrollments.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload ?? "Unable to load enrollments";
      })

      .addCase(createEnrollment.pending, (state) => {
        state.creating = true;

        state.createError = null;
      })

      .addCase(createEnrollment.fulfilled, (state, action) => {
        state.creating = false;

        state.enrollments.push(action.payload);
      })

      .addCase(createEnrollment.rejected, (state, action) => {
        state.creating = false;

        state.createError = action.payload ?? "Unable to create enrollment";
      })

      .addCase(updateEnrollment.pending, (state) => {
        state.updating = true;

        state.updateError = null;
      })

      .addCase(updateEnrollment.fulfilled, (state, action) => {
        state.updating = false;

        const index = state.enrollments.findIndex(
          (enrollment) => enrollment.id === action.payload.id,
        );

        if (index !== -1) {
          state.enrollments[index] = action.payload;
        }
      })

      .addCase(updateEnrollment.rejected, (state, action) => {
        state.updating = false;

        state.updateError = action.payload ?? "Unable to update enrollment";
      })

      .addCase(getMyEnrollments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getMyEnrollments.fulfilled, (state, action) => {
        state.loading = false;
        state.enrollments = action.payload;
      })

      .addCase(getMyEnrollments.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload ?? "Unable to load enrollments";
      });
  },
});

export const {
  clearEnrollments,
  clearCreateEnrollmentError,
  clearUpdateEnrollmentError,
} = enrollmentSlice.actions;

export default enrollmentSlice.reducer;
