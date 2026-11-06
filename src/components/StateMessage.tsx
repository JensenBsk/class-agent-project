import type { ReactNode } from "react";

export type StateVariant = "loading" | "error" | "empty" | "success";

interface StateMessageProps {
  variant: StateVariant;
  title: string;
  children?: ReactNode;
  /** Optional button or link, e.g. "Try again" or "Create your profile". */
  action?: ReactNode;
}

const ICONS: Record<StateVariant, string> = {
  loading: "…",
  error: "!",
  empty: "○",
  success: "✓",
};

/**
 * One component for every loading, error, empty and success state, so they all
 * look and sound the same. Errors use role="alert" so screen readers announce
 * them right away; the others use role="status".
 */
export function StateMessage({ variant, title, children, action }: StateMessageProps) {
  return (
    <div
      className={`state state--${variant}`}
      role={variant === "error" ? "alert" : "status"}
      aria-busy={variant === "loading" ? true : undefined}
    >
      <span className="state__icon" aria-hidden="true">
        {variant === "loading" ? <span className="spinner" /> : ICONS[variant]}
      </span>
      <div className="state__body">
        <p className="state__title">{title}</p>
        {children ? <div className="state__text">{children}</div> : null}
        {action ? <div className="state__action">{action}</div> : null}
      </div>
    </div>
  );
}
