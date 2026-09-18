import { ArrowRight, Dumbbell, LockKeyhole, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { login } from "../features/auth/authThunks";

type LoginForm = {
  email: string;
  password: string;
};

function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    const result = await dispatch(login(data));

    if (login.fulfilled.match(result)) {
      const role = result.payload.user.role;

      if (role === "admin") {
        navigate("/admin");
        return;
      }

      if (role === "student") {
        navigate("/student");
      }
    }
  };

  return (
    <main className="min-h-screen bg-stone-50 lg:grid lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-emerald-950 p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
        <div className="absolute -right-28 -top-28 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute -right-10 -top-10 h-80 w-80 rounded-full border border-white/10" />
        <div className="absolute bottom-20 left-20 h-48 w-48 rounded-full bg-lime-400/5 blur-3xl" />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-lime-400 text-emerald-950">
            <Dumbbell size={22} strokeWidth={2.5} />
          </div>

          <div>
            <p className="text-lg font-bold tracking-tight">ADAA FARMS</p>
            <p className="text-xs text-emerald-200">Sports Complex</p>
          </div>
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="mb-6 h-1 w-14 rounded-full bg-lime-400" />

          <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight xl:text-6xl">
            Your sport.
            <br />
            Your progress.
            <br />
            <span className="text-lime-300">One place.</span>
          </h1>

          <p className="mt-7 max-w-md text-base leading-7 text-emerald-100/70">
            Manage training, attendance, enrollments and fees at Adaa Farms.
          </p>
        </div>

        <p className="relative z-10 text-xs text-emerald-200/50">
          Adaa Farms Sports Complex
        </p>
      </section>

      <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-950 text-lime-300">
              <Dumbbell size={22} />
            </div>

            <div>
              <p className="font-bold tracking-tight text-emerald-950">
                ADAA FARMS
              </p>
              <p className="text-xs text-slate-500">Sports Complex</p>
            </div>
          </div>

          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold text-emerald-700">
              Welcome back
            </p>

            <h2 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Sign in to your account
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Enter your credentials to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>

              <div className="relative">
                <Mail
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  {...register("email", {
                    required: "Email is required",
                  })}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
                />
              </div>

              {errors.email && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <div className="relative">
                <LockKeyhole
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  {...register("password", {
                    required: "Password is required",
                  })}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
                />
              </div>

              {errors.password && (
                <p className="mt-1.5 text-sm text-red-600">
                  {errors.password.message}
                </p>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-950 px-4 text-sm font-semibold text-white transition hover:bg-emerald-900 focus:outline-none focus:ring-4 focus:ring-emerald-900/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}

              {!loading && (
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">
            Adaa Farms · Sports Complex Management
          </p>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;
