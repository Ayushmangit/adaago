import { createSlice } from "@reduxjs/toolkit";

import {
  createStudent,
  getMyProfile,
  getStudents,
  updateStudent,
} from "./studentThunks";

import type { StudentWithUser } from "./studentTypes";

type StudentState = {
  students: StudentWithUser[];

  profile: StudentWithUser | null;

  loading: boolean;

  profileLoading: boolean;

  creating: boolean;

  updating: boolean;

  error: string | null;

  profileError: string | null;

  createError: string | null;

  updateError: string | null;
};

const initialState: StudentState = {
  students: [],

  profile: null,

  loading: false,

  profileLoading: false,

  creating: false,

  updating: false,

  error: null,

  profileError: null,

  createError: null,

  updateError: null,
};

const studentSlice = createSlice({
  name: "students",

  initialState,

  reducers: {
    clearStudentError: (state) => {
      state.error = null;
    },

    clearProfileError: (state) => {
      state.profileError = null;
    },

    clearCreateStudentError: (state) => {
      state.createError = null;
    },

    clearUpdateStudentError: (state) => {
      state.updateError = null;
    },

    clearStudentProfile: (state) => {
      state.profile = null;

      state.profileError = null;
    },
  },

  extraReducers: (builder) => {
    /*
      |--------------------------------------------------------------------------
      | Get Students
      |--------------------------------------------------------------------------
      */

    builder
      .addCase(getStudents.pending, (state) => {
        state.loading = true;

        state.error = null;
      })

      .addCase(getStudents.fulfilled, (state, action) => {
        state.loading = false;

        state.students = action.payload;

        state.error = null;
      })

      .addCase(getStudents.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload ?? "Unable to load students";
      });

    /*
      |--------------------------------------------------------------------------
      | Get My Profile
      |--------------------------------------------------------------------------
      */

    builder
      .addCase(getMyProfile.pending, (state) => {
        state.profileLoading = true;

        state.profileError = null;
      })

      .addCase(getMyProfile.fulfilled, (state, action) => {
        state.profileLoading = false;

        state.profile = action.payload;

        state.profileError = null;
      })

      .addCase(getMyProfile.rejected, (state, action) => {
        state.profileLoading = false;

        state.profileError = action.payload ?? "Unable to load profile";
      });

    /*
      |--------------------------------------------------------------------------
      | Create Student
      |--------------------------------------------------------------------------
      */

    builder
      .addCase(createStudent.pending, (state) => {
        state.creating = true;

        state.createError = null;
      })

      .addCase(createStudent.fulfilled, (state, action) => {
        state.creating = false;

        state.students.push(action.payload);

        state.students.sort((a, b) => a.full_name.localeCompare(b.full_name));

        state.createError = null;
      })

      .addCase(createStudent.rejected, (state, action) => {
        state.creating = false;

        state.createError = action.payload ?? "Unable to create student";
      });

    /*
      |--------------------------------------------------------------------------
      | Update Student
      |--------------------------------------------------------------------------
      */

    builder
      .addCase(updateStudent.pending, (state) => {
        state.updating = true;

        state.updateError = null;
      })

      .addCase(updateStudent.fulfilled, (state, action) => {
        state.updating = false;

        const index = state.students.findIndex(
          (student) => student.id === action.payload.id,
        );

        if (index !== -1) {
          state.students[index] = action.payload;
        }

        /*
            |--------------------------------------------------------------------------
            | Keep own profile in sync
            |--------------------------------------------------------------------------
            |
            | Usually the student profile will not be updated from the admin
            | session, but this keeps the slice internally consistent.
            |
            */

        if (state.profile?.id === action.payload.id) {
          state.profile = action.payload;
        }

        state.students.sort((a, b) => a.full_name.localeCompare(b.full_name));

        state.updateError = null;
      })

      .addCase(updateStudent.rejected, (state, action) => {
        state.updating = false;

        state.updateError = action.payload ?? "Unable to update student";
      });
  },
});

export const {
  clearStudentError,
  clearProfileError,
  clearCreateStudentError,
  clearUpdateStudentError,
  clearStudentProfile,
} = studentSlice.actions;

export default studentSlice.reducer;
