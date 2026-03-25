"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, Suspense } from "react";
import { mainApi } from "@/services";
import styles from "./page.module.css";

const MIN_LENGTH = 8;

function passwordStrength(pw: string): { label: string; color: string } {
  const len = pw.length;
  if (len === 0) return { label: "", color: "" };
  if (len < 8) return { label: "Too short", color: "#ef4444" };
  let score = 0;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score === 0) return { label: "Weak", color: "#f97316" };
  if (score === 1) return { label: "Fair", color: "#eab308" };
  if (score === 2) return { label: "Good", color: "#22c55e" };
  return { label: "Strong", color: "#16a34a" };
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = passwordStrength(newPassword);

  const onSubmit = async () => {
    setFormError("");
    if (!token) {
      setFormError("Invalid reset link. Please request a new one.");
      return;
    }
    if (newPassword.length < MIN_LENGTH) {
      setFormError(`Password must be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await mainApi.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => router.push("/login?reset=success"), 2000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setFormError(msg || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className={styles.successBox}>
        <div className={styles.successIcon}>✅</div>
        <h3 className={styles.title}>Password updated!</h3>
        <p className={styles.description}>
          Your password has been changed. Redirecting you to the login
          page…
        </p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className={styles.errorBox}>
        <h3 className={styles.title}>Invalid link</h3>
        <p className={styles.description}>
          This reset link is missing or malformed.
        </p>
        <a className={`primary-btn ${styles.submitBtn}`} href="/forgot-password">
          Request a new link
        </a>
      </div>
    );
  }

  return (
    <>
      <h3 className={styles.title}>Set a new password</h3>
      <p className={styles.description}>
        Choose a strong password. It will be stored securely and never visible
        to anyone — including the admin.
      </p>

      <div className="form">
        {/* New password */}
        <div className="field-group">
          <div className={styles.passwordWrapper}>
            <input
              id="new-password"
              className={`field ${styles.passwordField}`}
              type={showNew ? "text" : "password"}
              placeholder="New password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowNew((v) => !v)}
              aria-label={showNew ? "Hide password" : "Show password"}
            >
              {showNew ? "🙈" : "👁️"}
            </button>
          </div>
          {strength.label && (
            <div className={styles.strengthLabel} style={{ color: strength.color }}>
              Strength: {strength.label}
            </div>
          )}
          <div className={styles.hint}>
            Min. 8 characters. Include uppercase, numbers, or symbols for a stronger password.
          </div>
        </div>

        {/* Confirm password */}
        <div className="field-group">
          <div className={styles.passwordWrapper}>
            <input
              id="confirm-password"
              className={`field ${styles.passwordField}`}
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            />
            <button
              type="button"
              className={styles.eyeBtn}
              onClick={() => setShowConfirm((v) => !v)}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? "🙈" : "👁️"}
            </button>
          </div>
        </div>

        {formError && <div className="error-text">{formError}</div>}

        <button
          id="reset-submit"
          className={`primary-btn ${styles.submitBtn}`}
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving…" : "Reset password"}
        </button>

        <div className={styles.backLink}>
          <a href="/forgot-password">← Request a new link</a>
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className={styles.pageOverlay}>
      <header className="nav">
        <a className="brand" href="/about">
          Fulbright AntiCheat Knight
        </a>
        <nav className="nav-links" aria-hidden="true"></nav>
      </header>

      <main className="wrap">
        <section className={`card ${styles.card}`}>
          <div className={`right ${styles.inner}`}>
            <Suspense fallback={<p>Loading…</p>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </section>
      </main>
    </div>
  );
}
