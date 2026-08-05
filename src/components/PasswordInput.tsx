"use client";

import {
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
        <path
          d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A10.5 10.5 0 0112 5c5.5 0 9.5 4.5 10.5 7-.4 1-1.2 2.4-2.5 3.7M6.1 6.1C4.2 7.5 2.9 9.3 2 12c1 2.5 5 7 10 7 1.4 0 2.7-.3 3.9-.8"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" aria-hidden>
      <path
        d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  className?: string;
  wrapperClassName?: string;
  label?: ReactNode;
};

export function PasswordInput({
  className = "",
  wrapperClassName = "",
  label,
  id,
  ...props
}: Props) {
  const [visible, setVisible] = useState(false);
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <div className={wrapperClassName}>
      {label ? (
        <label htmlFor={inputId} className="mb-1.5 block">
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          {...props}
          id={inputId}
          type={visible ? "text" : "password"}
          className={`${className} pr-11`}
          autoComplete={props.autoComplete || "current-password"}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-md p-1 text-[#6B6B6B] transition hover:text-[#C8A96A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C8A96A]/50"
          aria-label={visible ? "Ocultar senha" : "Visualizar senha"}
          title={visible ? "Ocultar senha" : "Visualizar senha"}
          tabIndex={0}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </div>
  );
}
