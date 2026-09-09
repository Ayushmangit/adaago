import { useEffect } from "react";

import { Outlet } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "./app/hooks";

import { rehydrateAuth } from "./features/auth/authThunks";

function App() {
  const dispatch = useAppDispatch();

  const { initialized } = useAppSelector((state) => state.auth);

  useEffect(() => {
    dispatch(rehydrateAuth());
  }, [dispatch]);

  if (!initialized) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-sm text-gray-500">Loading...</p>
      </main>
    );
  }

  return <Outlet />;
}

export default App;
