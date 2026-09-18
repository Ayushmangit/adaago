import { CalendarDays, Mail, MapPin, Phone, User, Users } from "lucide-react";

import { useEffect, type ReactNode } from "react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { getMyProfile } from "../../features/students/studentThunks";

function StudentProfilePage() {
  const dispatch = useAppDispatch();

  const { profile, profileLoading, profileError } = useAppSelector(
    (state) => state.students,
  );

  useEffect(() => {
    dispatch(getMyProfile());
  }, [dispatch]);

  if (profileLoading) {
    return (
      <PageState icon={<User size={22} />} message="Loading your profile..." />
    );
  }

  if (profileError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {profileError}
      </div>
    );
  }

  if (!profile) {
    return (
      <PageState
        icon={<User size={22} />}
        message="Profile information is unavailable."
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm font-semibold text-emerald-700">
          Student Account
        </p>

        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
          My Profile
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          Your personal and account information registered with Adaa Farms.
        </p>
      </header>

      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="h-24 bg-emerald-950 sm:h-28" />

        <div className="px-4 pb-5 sm:px-6 sm:pb-6">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-9 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-emerald-100 text-xl font-bold text-emerald-900 shadow-sm">
                {getInitials(profile.full_name)}
              </div>

              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold text-slate-950 sm:text-2xl">
                    {profile.full_name}
                  </h2>

                  <StatusBadge status={profile.status} />
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  @{profile.username}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 sm:mb-1">
              <CalendarDays size={16} className="shrink-0 text-emerald-700" />

              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                  Joined Adaa Farms
                </p>

                <p className="text-sm font-semibold text-slate-700">
                  {formatDate(profile.joined_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section
          title="Account information"
          description="The details associated with your login."
        >
          <InfoRow
            icon={<User size={18} />}
            label="Username"
            value={profile.username}
          />

          <InfoRow
            icon={<Mail size={18} />}
            label="Email address"
            value={profile.email}
          />

          <InfoRow
            icon={<CalendarDays size={18} />}
            label="Joined"
            value={formatDate(profile.joined_at)}
          />
        </Section>

        <Section
          title="Personal information"
          description="Your personal details registered with Adaa Farms."
        >
          <InfoRow
            icon={<User size={18} />}
            label="Full name"
            value={profile.full_name}
          />

          <InfoRow
            icon={<Phone size={18} />}
            label="Phone"
            value={profile.phone ?? "Not provided"}
          />

          <InfoRow
            icon={<CalendarDays size={18} />}
            label="Date of birth"
            value={
              profile.date_of_birth
                ? formatDate(profile.date_of_birth)
                : "Not provided"
            }
          />

          <InfoRow
            icon={<MapPin size={18} />}
            label="Address"
            value={profile.address ?? "Not provided"}
          />
        </Section>
      </div>

      <Section
        title="Guardian information"
        description="Guardian contact details associated with your account."
      >
        <div className="grid md:grid-cols-2 md:gap-8">
          <InfoRow
            icon={<Users size={18} />}
            label="Guardian name"
            value={profile.guardian_name ?? "Not provided"}
          />

          <InfoRow
            icon={<Phone size={18} />}
            label="Guardian phone"
            value={profile.guardian_phone ?? "Not provided"}
          />
        </div>
      </Section>

      <section className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-lg bg-white p-2 text-emerald-700 shadow-sm">
            <User size={17} />
          </div>

          <div>
            <h2 className="text-sm font-semibold text-emerald-950">
              Need to update your information?
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-emerald-800/70">
              Student information is managed by the Adaa Farms administration.
              Contact the administration if any of these details need to be
              corrected.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <h2 className="font-semibold text-slate-950">{title}</h2>

        <p className="mt-1 text-sm leading-5 text-slate-500">{description}</p>
      </div>

      <div className="divide-y divide-slate-100 px-4 sm:px-5">{children}</div>
    </section>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-start gap-3 py-4 sm:gap-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-800">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
        status === "active"
          ? "bg-emerald-50 text-emerald-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function PageState({ icon, message }: { icon: ReactNode; message: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          {icon}
        </div>

        <p className="mt-4 text-sm text-slate-500">{message}</p>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/);

  if (parts.length === 0 || !parts[0]) {
    return "ST";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default StudentProfilePage;
