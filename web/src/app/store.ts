import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../features/auth/authSlice";
import studentReducer from "../features/students/studentSlice";
import programReducer from "../features/programs/programSlice";
import batchReducer from "../features/batches/batchSlice";
import enrollmentReducer from "../features/enrollments/enrollmentSlice";
import attendanceReducer from "../features/attendance/attendanceSlice";
import feeReducer from "../features/fees/feeSlice";
import dashboardReducer from "../features/dashboard/dashboardSlice";
import studentDashboardReducer from "../features/studentDashboard/studentDashboardSlice";
import studentFeeReducer from "../features/studentFees/studentFeesSlice.ts";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    students: studentReducer,
    programs: programReducer,
    batches: batchReducer,
    enrollments: enrollmentReducer,
    attendance: attendanceReducer,
    fees: feeReducer,
    dashboard: dashboardReducer,
    studentDashboard: studentDashboardReducer,
    studentFees: studentFeeReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;
