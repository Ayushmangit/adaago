import { createSlice } from "@reduxjs/toolkit";

import { createProgram, getPrograms, updateProgram } from "./programThunks";

import type { Program } from "./programTypes";

type ProgramState = {
  programs: Program[];

  loading: boolean;
  creating: boolean;
  updating: boolean;

  error: string | null;
  createError: string | null;
  updateError: string | null;
};

const initialState: ProgramState = {
  programs: [],

  loading: false,
  creating: false,
  updating: false,

  error: null,
  createError: null,
  updateError: null,
};

const programSlice = createSlice({
  name: "programs",

  initialState,

  reducers: {
    clearCreateProgramError: (state) => {
      state.createError = null;
    },

    clearUpdateProgramError: (state) => {
      state.updateError = null;
    },
  },

  extraReducers: (builder) => {
    builder

      // GET PROGRAMS

      .addCase(getPrograms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(getPrograms.fulfilled, (state, action) => {
        state.loading = false;

        state.programs = action.payload;
      })

      .addCase(getPrograms.rejected, (state, action) => {
        state.loading = false;

        state.error = action.payload ?? "Unable to load programs";
      })

      // CREATE PROGRAM

      .addCase(createProgram.pending, (state) => {
        state.creating = true;
        state.createError = null;
      })

      .addCase(createProgram.fulfilled, (state, action) => {
        state.creating = false;

        state.programs.push(action.payload);

        state.programs.sort((a, b) => a.name.localeCompare(b.name));
      })

      .addCase(createProgram.rejected, (state, action) => {
        state.creating = false;

        state.createError = action.payload ?? "Unable to create program";
      })

      // UPDATE PROGRAM

      .addCase(updateProgram.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })

      .addCase(updateProgram.fulfilled, (state, action) => {
        state.updating = false;

        const index = state.programs.findIndex(
          (program) => program.id === action.payload.id,
        );

        if (index !== -1) {
          state.programs[index] = action.payload;
        }

        state.programs.sort((a, b) => a.name.localeCompare(b.name));
      })

      .addCase(updateProgram.rejected, (state, action) => {
        state.updating = false;

        state.updateError = action.payload ?? "Unable to update program";
      });
  },
});

export const { clearCreateProgramError, clearUpdateProgramError } =
  programSlice.actions;

export default programSlice.reducer;
