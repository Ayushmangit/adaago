import { createAsyncThunk } from "@reduxjs/toolkit";

import axios from "axios";

import api from "../../api/axios";

import type {
  LoginPayload,
  LoginResponse,
  LoginData,
  MeResponse,
  User,
} from "./authTypes";

/*
|--------------------------------------------------------------------------
| Login
|--------------------------------------------------------------------------
*/

export const login = createAsyncThunk<
  LoginData,
  LoginPayload,
  { rejectValue: string }
>(
  "auth/login",

  async (payload, thunkAPI) => {
    try {
      const response = await api.post<LoginResponse>("/auth/login", payload);

      const authData = response.data.data;

      localStorage.setItem("access_token", authData.access_token);

      return authData;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return thunkAPI.rejectWithValue(
          error.response?.data?.error ?? "Unable to login",
        );
      }

      return thunkAPI.rejectWithValue("Unable to login");
    }
  },
);

/*
|--------------------------------------------------------------------------
| Rehydrate Auth
|--------------------------------------------------------------------------
*/

export const rehydrateAuth = createAsyncThunk<
  User,
  void,
  { rejectValue: string }
>(
  "auth/rehydrateAuth",

  async (_, thunkAPI) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      return thunkAPI.rejectWithValue("No access token");
    }

    try {
      const response = await api.get<MeResponse>("/me");

      return response.data.data;
    } catch (error) {
      /*
        |--------------------------------------------------------------------------
        | Token is invalid / expired / unusable
        |--------------------------------------------------------------------------
        */

      localStorage.removeItem("access_token");

      if (axios.isAxiosError(error)) {
        return thunkAPI.rejectWithValue(
          error.response?.data?.error ?? "Session expired",
        );
      }

      return thunkAPI.rejectWithValue("Unable to restore session");
    }
  },
);

/*
|--------------------------------------------------------------------------
| Change Password
|--------------------------------------------------------------------------
*/

export type ChangePasswordPayload = {
  current_password: string;
  new_password: string;
};

export const changePassword = createAsyncThunk<
  string,
  ChangePasswordPayload,
  { rejectValue: string }
>(
  "auth/changePassword",

  async (payload, thunkAPI) => {
    try {
      const response = await api.patch<{
        data: {
          message: string;
        };
      }>("/me/password", payload);

      return response.data.data.message;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return thunkAPI.rejectWithValue(
          error.response?.data?.error ?? "Unable to change password",
        );
      }

      return thunkAPI.rejectWithValue("Unable to change password");
    }
  },
);
