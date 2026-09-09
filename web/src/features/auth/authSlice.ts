import { createSlice } from "@reduxjs/toolkit";

import type { User } from "./authTypes";

import { changePassword, login, rehydrateAuth } from "./authThunks";

type AuthState = {
  user: User | null;

  accessToken: string | null;

  loading: boolean;

  initialized: boolean;

  error: string | null;

  changingPassword: boolean;

  changePasswordError: string | null;

  changePasswordSuccess: string | null;
};

const initialState: AuthState = {
  user: null,

  accessToken: localStorage.getItem("access_token"),

  loading: false,

  initialized: false,

  error: null,

  changingPassword: false,

  changePasswordError: null,

  changePasswordSuccess: null,
};

const authSlice = createSlice({
  name: "auth",

  initialState,

  reducers: {
    logout(state) {
      localStorage.removeItem("access_token");

      state.user = null;

      state.accessToken = null;

      state.error = null;

      state.changePasswordError = null;

      state.changePasswordSuccess = null;

      state.changingPassword = false;
    },

    clearAuthError(state) {
      state.error = null;
    },

    clearChangePasswordState(state) {
      state.changePasswordError = null;

      state.changePasswordSuccess = null;
    },
  },

  extraReducers: (builder) => {
    /*
      |--------------------------------------------------------------------------
      | Login
      |--------------------------------------------------------------------------
      */

    builder
      .addCase(login.pending, (state) => {
        state.loading = true;

        state.error = null;
      })

      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;

        state.user = action.payload.user;

        state.accessToken = action.payload.access_token;

        state.error = null;
      })

      .addCase(login.rejected, (state, action) => {
        state.loading = false;

        state.user = null;

        state.accessToken = null;

        state.error = action.payload ?? "Unable to login";
      });

    /*
      |--------------------------------------------------------------------------
      | Rehydrate Auth
      |--------------------------------------------------------------------------
      */

    builder
      .addCase(rehydrateAuth.pending, (state) => {
        state.initialized = false;
      })

      .addCase(rehydrateAuth.fulfilled, (state, action) => {
        state.initialized = true;

        state.user = action.payload;

        state.accessToken = localStorage.getItem("access_token");

        state.error = null;
      })

      .addCase(rehydrateAuth.rejected, (state) => {
        localStorage.removeItem("access_token");

        state.initialized = true;

        state.user = null;

        state.accessToken = null;

        state.error = null;
      });

    /*
      |--------------------------------------------------------------------------
      | Change Password
      |--------------------------------------------------------------------------
      */

    builder
      .addCase(changePassword.pending, (state) => {
        state.changingPassword = true;

        state.changePasswordError = null;

        state.changePasswordSuccess = null;
      })

      .addCase(changePassword.fulfilled, (state, action) => {
        state.changingPassword = false;

        state.changePasswordSuccess = action.payload;

        state.changePasswordError = null;
      })

      .addCase(changePassword.rejected, (state, action) => {
        state.changingPassword = false;

        state.changePasswordError =
          action.payload ?? "Unable to change password";

        state.changePasswordSuccess = null;
      });
  },
});

export const { logout, clearAuthError, clearChangePasswordState } =
  authSlice.actions;

export default authSlice.reducer;
