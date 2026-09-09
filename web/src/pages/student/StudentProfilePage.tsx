import {
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  Users,
} from "lucide-react";

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
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
        Loading profile...
      </div>
    );
  }

  if (profileError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {profileError}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-10 text-center text-sm text-gray-500">
        Profile information is unavailable.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>

        <p className="mt-1 text-sm text-gray-500">
          View your personal and account information.
        </p>
      </div>

      {/* Profile header */}

      <section className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gray-900 text-lg font-semibold text-white">
            {getInitials(profile.full_name)}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-gray-900">
                {profile.full_name}
              </h2>

              <StatusBadge status={profile.status} />
            </div>

            <p className="mt-1 text-sm text-gray-500">@{profile.username}</p>

            <p className="mt-2 text-xs text-gray-400">
              Student ID: {profile.id}
            </p>
          </div>
        </div>
      </section>

      {/* Account + personal */}

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Account */}

        <Section
          title="Account Information"
          description="Your login and account details."
        >
          <InfoRow
            icon={<User size={18} />}
            label="Username"
            value={profile.username}
          />

          <InfoRow
            icon={<Mail size={18} />}
            label="Email"
            value={profile.email}
          />

          <InfoRow
            icon={<Shield size={18} />}
            label="Role"
            value={capitalize(profile.role)}
          />

          <InfoRow
            icon={<CalendarDays size={18} />}
            label="Joined"
            value={formatDate(profile.joined_at)}
          />
        </Section>

        {/* Personal */}

        <Section
          title="Personal Information"
          description="Personal details registered with the sports complex."
        >
          <InfoRow
            icon={<User size={18} />}
            label="Full Name"
            value={profile.full_name}
          />

          <InfoRow
            icon={<Phone size={18} />}
            label="Phone"
            value={profile.phone ?? "Not provided"}
          />

          <InfoRow
            icon={<CalendarDays size={18} />}
            label="Date of Birth"
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

      {/* Guardian */}

      <Section
        title="Guardian Information"
        description="Guardian details associated with your profile."
      >
        <div className="grid gap-0 md:grid-cols-2 md:gap-8">
          <InfoRow
            icon={<Users size={18} />}
            label="Guardian Name"
            value={profile.guardian_name ?? "Not provided"}
          />

          <InfoRow
            icon={<Phone size={18} />}
            label="Guardian Phone"
            value={profile.guardian_phone ?? "Not provided"}
          />
        </div>
      </Section>

      {/* Notice */}

      <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
        <p className="text-sm font-medium text-gray-700">
          Need to update something?
        </p>

        <p className="mt-1 text-sm text-gray-500">
          Profile information is managed by the sports complex administrator.
          Contact the administration if any information is incorrect.
        </p>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Section
|--------------------------------------------------------------------------
*/

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
    <section className="rounded-xl border border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-5 py-4">
        <h2 className="font-semibold text-gray-900">{title}</h2>

        <p className="mt-1 text-sm text-gray-500">{description}</p>
      </div>

      <div className="divide-y divide-gray-100 px-5">{children}</div>
    </section>
  );
}

/*
|--------------------------------------------------------------------------
| Info Row
|--------------------------------------------------------------------------
*/

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
    <div className="flex items-start gap-4 py-4">
      <div className="mt-0.5 text-gray-400">{icon}</div>

      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
          {label}
        </p>

        <p className="mt-1 break-words text-sm font-medium text-gray-800">
          {value}
        </p>
      </div>
    </div>
  );
}

/*
|--------------------------------------------------------------------------
| Status
|--------------------------------------------------------------------------
*/

function StatusBadge({ status }: { status: "active" | "inactive" }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
        status === "active"
          ? "bg-green-50 text-green-700"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {status}
    </span>
  );
}

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

function formatDate(value: string) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function capitalize(value: string) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getInitials(value: string) {
  const parts = value.trim().split(/\s+/);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default StudentProfilePage;
