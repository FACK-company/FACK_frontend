"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { mainApi } from "@/services";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isFulbrightEmail = (v: string) => {
    const s = v.trim().toLowerCase();
    return (
      s.includes("@") &&
      (s.endsWith("fulbright.edu.vn") || s.endsWith("student.fulbright.edu.vn"))
    );
  };

  const isStudentEmail = (v: string) =>
    v.trim().toLowerCase().endsWith("student.fulbright.edu.vn");

  const onSubmit = async () => {
    const value = email.trim();
    setFormError("");

    if (!value) {
      setEmailError("Please enter your Fulbright email.");
      return;
    }
    if (!isFulbrightEmail(value)) {
      setEmailError("Please use your Fulbright email.");
      return;
    }
    if (!password.trim()) {
      setPasswordError("Please enter your password.");
      return;
    }

    setIsSubmitting(true);
    setEmailError("");
    setPasswordError("");

    try {
      const response = await mainApi.login({
        email: value,
        password: password.trim(),
      });

      if (!response.success) {
        setFormError("Invalid credentials.");
        return;
      }

      const target = isStudentEmail(value) ? "/student/home" : "/prof/home";
      router.push(target);
    } catch {
      setFormError("Unable to sign in right now. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.pageOverlay}>
      <header className="nav">
        <a className="brand" href="/about">
          Fulbright AntiCheat Knight
        </a>
        <nav className="nav-links" aria-hidden="true"></nav>
        <button className="btn-outline">Sign in</button>
      </header>

      <main className="wrap">
        <section className={`card ${styles.loginCard}`}>
          <div className={`right ${styles.loginRight}`}>
            <h3 className={styles.loginTitle}>Sign in using Fulbright Email</h3>
            <div className="form">
              <div className="field-group">
                <input
                  className="field"
                  type="text"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEmail(value);
                    const trimmed = value.trim();
                    if (!trimmed) {
                      setEmailError("");
                    } else if (!isFulbrightEmail(trimmed)) {
                      setEmailError("Please use your Fulbright email.");
                    } else {
                      setEmailError("");
                    }
                  }}
                />
                <div className="error-text">{emailError}</div>
              </div>

              <div className="field-group">
                <input
                  className="field"
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (e.target.value.trim()) {
                      setPasswordError("");
                    }
                  }}
                />
                <div className="error-text">{passwordError}</div>
              </div>

              <button
                className={`primary-btn ${styles.signInBtn}`}
                type="button"
                onClick={onSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>

              <div className="error-text">{formError}</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
