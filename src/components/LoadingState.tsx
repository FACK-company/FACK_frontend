"use client";

type LoadingStateProps = {
  text?: string;
  className?: string;
  variant?: "inline" | "pill";
};

export default function LoadingState({
  text = "Loading...",
  className,
  variant = "pill",
}: LoadingStateProps) {
  const baseClass = variant === "inline" ? "loading-inline" : "loading-state";
  const classes = className ? `${baseClass} ${className}` : baseClass;

  return (
    <div className={classes} role="status" aria-live="polite" aria-busy="true">
      <span className="spinner" aria-hidden="true"></span>
      <span>{text}</span>
    </div>
  );
}
