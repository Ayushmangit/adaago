import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import studentReducer from "../features/students/studentSlice";
import programReducer from "../features/programs/programSlice";
import batchReducer from "../features/batches/batchSlice";
import enrollmentReducer from "../features/enrollments/enrollmentSlice";
import attendanceReducer from "../features/attendance/attendanceSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    students: studentReducer,
    programs: programReducer,
    batches: batchReducer,
    enrollments: enrollmentReducer,
    attendance: attendanceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
