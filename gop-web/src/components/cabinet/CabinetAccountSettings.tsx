"use client";

import Image from "next/image";
import { Eye } from "lucide-react";
import type { FormEvent } from "react";

import CtaButton from "@/components/ui/CtaButton";
import { CabinetHeading } from "./CabinetShell";
import type { CabinetUser } from "./types";

function Field({
  label,
  type = "text",
  name,
  defaultValue,
  placeholder,
}: {
  label: string;
  type?: "text" | "email" | "password";
  name: string;
  defaultValue?: string;
  placeholder?: string;
}) {
  return (
    <label className="relative flex min-w-0 flex-1 text-[#f7f7f7]">
      <span className="pointer-events-none absolute left-4 top-1 z-10 text-[11px] leading-4 text-white/75">
        {label}
      </span>
      <span className="relative w-full">
        <input
          type={type}
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          aria-label={label}
          className="h-11 w-full rounded-[12px] border border-white/[0.04] bg-white/[0.04] px-4 pb-1 pt-[17px] text-[14px] leading-5 text-[#f7f7f7] outline-none placeholder:text-white/35 focus:border-white/30 focus:ring-2 focus:ring-gop-gold/70"
        />
        {type === "password" ? (
          <Eye
            aria-hidden
            size={17}
            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-white/45"
          />
        ) : null}
      </span>
    </label>
  );
}

function FormActions({ danger = false }: { danger?: boolean }) {
  return (
    <div className="mt-6 flex justify-end gap-2">
      <CtaButton type="reset" variant="primary" size="sm" className="!h-8 !px-3">
        Cancel
      </CtaButton>
      {danger ? (
        <button
          type="submit"
          className="inline-flex h-8 items-center justify-center rounded-full border border-white/40 bg-[#ff4d5a] px-3 text-[14px] font-medium text-[#ffe5e7] shadow-[0_0_0_1px_#ff4d5a] transition-[filter,transform] hover:brightness-105 active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4d5a]"
        >
          Delete account
        </button>
      ) : (
        <CtaButton type="submit" variant="gold" size="sm" className="!h-8 !px-3">
          Save changes
        </CtaButton>
      )}
    </div>
  );
}

const preventSubmit = (event: FormEvent<HTMLFormElement>) => event.preventDefault();

export default function CabinetAccountSettings({ user }: { user: CabinetUser }) {
  return (
    <>
      <CabinetHeading
        title="Account Settings"
        subtitle="Configure your user identity, email, and password securely."
      />

      <div className="flex max-w-[680px] flex-col gap-12">
        <form onSubmit={preventSubmit}>
          <h2 className="m-0 text-[18px] font-medium leading-6 text-[#f7f7f7]">Personal Details</h2>
          <div className="mt-5 flex items-center gap-4">
            <Image
              src="/images/cabinet/account-avatar.png"
              alt=""
              width={72}
              height={72}
              className="size-[72px] rounded-full object-cover ring-1 ring-white/10"
            />
            <span className="text-[13px] text-gop-menu-item-2">Profile picture</span>
          </div>
          <div className="mt-6 flex gap-3 max-[560px]:flex-col">
            <Field label="First name *" name="firstName" defaultValue={user.firstName} />
            <Field label="Last name *" name="lastName" defaultValue={user.lastName} />
          </div>
          <div className="mt-3">
            <Field label="Email address *" name="email" type="email" defaultValue={user.email} />
          </div>
          <FormActions />
        </form>

        <form onSubmit={preventSubmit}>
          <h2 className="m-0 text-[18px] font-medium leading-6 text-[#f7f7f7]">Change Password</h2>
          <div className="mt-5 flex flex-col gap-3">
            <Field label="Current password *" name="currentPassword" type="password" placeholder="••••••••" />
            <div className="flex gap-3 max-[560px]:flex-col">
              <Field label="New password *" name="newPassword" type="password" placeholder="••••••••" />
              <Field label="Confirm new password *" name="confirmPassword" type="password" placeholder="••••••••" />
            </div>
          </div>
          <p className="m-0 mt-2 text-[12px] leading-4 text-gop-menu-item-2">
            Password must be at least 8 characters, with letters and numbers
          </p>
          <FormActions />
        </form>

        <form onSubmit={preventSubmit} className="rounded-[20px] border border-[#ff4d5a]/35 bg-[#ff4d5a]/[0.06] p-5">
          <h2 className="m-0 text-[18px] font-medium leading-6 text-[#ffb8bd]">Danger Zone</h2>
          <p className="m-0 mt-1 text-[13px] leading-5 text-gop-menu-item-2">
            Deleting your account permanently removes your profile and saved data.
          </p>
          <div className="mt-5">
            <Field label="Current password *" name="deletePassword" type="password" placeholder="••••••••" />
          </div>
          <FormActions danger />
        </form>
      </div>
    </>
  );
}
