"use client";

import { useState } from "react";
import { mainApi } from "@/services";
import styles from "./page.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState("");

  const isFulbrightEmail = (v: string) => {
    const s = v.trim().toLowerCase();
    return s.includes("@") &&
      (s.endsWith("fulbright.edu.vn") || s.endsWith("student.fulbright.edu.vn"));
  };

  const onSubmit = async () => {
    const value = email.trim();
    if (!value) {
      setEmailError("Please enter your email.");
      return;
    }
    setEmailError("");
    setIsSubmitting(true);
    try {
      await mainApi.forgotPassword(value);
    } catch {
      // Always show success — do not leak whether email exists
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

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
            {submitted ? (
              <div className={styles.successBox}>
                <div className={styles.successIcon}>✉️</div>
                <h3 className={styles.title}>Check your inbox</h3>
                <p className={styles.description}>
                  If that email address is registered, we&apos;ve sent a reset
                  link. Please check your inbox (and spam folder). The link
                  expires in&nbsp;<strong>15 minutes</strong>.
                </p>
                <a className={`primary-btn ${styles.backBtn}`} href="/login">
                  Back to Sign in
                </a>
              </div>
            ) : (
              <>
                <h3 className={styles.title}>Forgot your password?</h3>
                <p className={styles.description}>
                  Enter your Fulbright email and we&apos;ll send you a reset
                  link.
                </p>

                <div className="form">
                  <div className="field-group">
                    <input
                      id="forgot-email"
                      className="field"
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailError("");
                      }}
                      onKeyDown={(e) => e.key === "Enter" && onSubmit()}
                    />
                    {emailError && (
                      <div className="error-text">{emailError}</div>
                    )}
                  </div>

                  <button
                    id="forgot-submit"
                    className={`primary-btn ${styles.submitBtn}`}
                    type="button"
                    onClick={onSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : "Send reset link"}
                  </button>

                  <div className={styles.backLink}>
                    <a href="/login">← Back to Sign in</a>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
