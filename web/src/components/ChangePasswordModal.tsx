import { Eye, EyeOff, KeyRound, X } from "lucide-react";

import { useEffect, useState } from "react";

import { useForm } from "react-hook-form";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearChangePasswordState } from "../features/auth/authSlice";
import { changePassword } from "../features/auth/authThunks";

type ChangePasswordModalProps = {
  open: boolean;
  onClose: () => void;
};

type ChangePasswordForm = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

function ChangePasswordModal({ open, onClose }: ChangePasswordModalProps) {
  const dispatch = useAppDispatch();

  const { changingPassword, changePasswordError, changePasswordSuccess } =
    useAppSelector((state) => state.auth);

  const [showCurrent, setShowCurrent] = useState(false);

  const [showNew, setShowNew] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordForm>();

  const newPassword = watch("new_password");

  useEffect(() => {
    if (!open) {
      return;
    }

    dispatch(clearChangePasswordState());

    reset();

    setShowCurrent(false);
    setShowNew(false);
    setShowConfirm(false);
  }, [open, dispatch, reset]);

  if (!open) {
    return null;
  }

  const handleClose = () => {
    if (changingPassword) {
      return;
    }

    dispatch(clearChangePasswordState());

    reset();

    onClose();
  };

  const onSubmit = async (data: ChangePasswordForm) => {
    const result = await dispatch(
      changePassword({
        current_password: data.current_password,

        new_password: data.new_password,
      }),
    );

    if (changePassword.fulfilled.match(result)) {
      reset();
    }
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      {/* Backdrop */}

      <button
        type="button"
        aria-label="Close modal"
        onClick={handleClose}
        className="absolute inset-0 bg-black/40"
      />

      {/* Modal */}

      <div className="relative z-10 w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl">
        {/* Header */}

        <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">
          <div className="flex gap-3">
            <div className="rounded-lg bg-gray-100 p-2.5 text-gray-700">
              <KeyRound size={20} />
            </div>

            <div>
              <h2 className="font-semibold text-gray-900">Change Password</h2>

              <p className="mt-1 text-sm text-gray-500">
                Update your account password.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={changingPassword}
            className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed"
          >
            <X size={19} />
          </button>
        </div>

        {/* Form */}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 p-6">
          {changePasswordError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {changePasswordError}
            </div>
          )}

          {changePasswordSuccess && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {changePasswordSuccess}
            </div>
          )}

          {/* Current password */}

          <PasswordInput
            label="Current Password"
            visible={showCurrent}
            onToggle={() => setShowCurrent((value) => !value)}
            error={errors.current_password?.message}
          >
            <input
              type={showCurrent ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter current password"
              {...register("current_password", {
                required: "Current password is required",

                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },

                maxLength: {
                  value: 72,
                  message: "Password cannot exceed 72 characters",
                },
              })}
              className={inputClass}
            />
          </PasswordInput>

          {/* New password */}

          <PasswordInput
            label="New Password"
            visible={showNew}
            onToggle={() => setShowNew((value) => !value)}
            error={errors.new_password?.message}
          >
            <input
              type={showNew ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Enter new password"
              {...register("new_password", {
                required: "New password is required",

                minLength: {
                  value: 8,
                  message: "Password must be at least 8 characters",
                },

                maxLength: {
                  value: 72,
                  message: "Password cannot exceed 72 characters",
                },
              })}
              className={inputClass}
            />
          </PasswordInput>

          {/* Confirm */}

          <PasswordInput
            label="Confirm New Password"
            visible={showConfirm}
            onToggle={() => setShowConfirm((value) => !value)}
            error={errors.confirm_password?.message}
          >
            <input
              type={showConfirm ? "text" : "password"}
              autoComplete="new-password"
              placeholder="Confirm new password"
              {...register("confirm_password", {
                required: "Please confirm your new password",

                validate: (value) =>
                  value === newPassword || "Passwords do not match",
              })}
              className={inputClass}
            />
          </PasswordInput>

          {/* Actions */}

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
            <button
              type="button"
              onClick={handleClose}
              disabled={changingPassword}
              className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={changingPassword}
              className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changingPassword ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 pr-11 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-200";

function PasswordInput({
  label,
  visible,
  onToggle,
  error,
  children,
}: {
  label: string;
  visible: boolean;
  onToggle: () => void;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="relative">
        {children}

        <button
          type="button"
          onClick={onToggle}
          tabIndex={-1}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition hover:text-gray-700"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>

      {error && <p className="mt-1.5 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export default ChangePasswordModal;
