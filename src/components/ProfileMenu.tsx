"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { clearUserMetadata, mainApi } from "@/services";
import styles from "./ProfileMenu.module.css";

type ProfileMenuProps = {
  username: string;
};

export default function ProfileMenu({ username }: ProfileMenuProps) {
  const [open, setOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await mainApi.logout();
    } finally {
      clearUserMetadata();
      router.replace("/login");
    }
  };

  return (
    <div className={styles.wrapper} ref={menuRef}>
      <button className={styles.trigger} type="button" onClick={() => setOpen((v) => !v)}>
        <span className="user-name">{username}</span>
        <span className="avatar" aria-hidden="true"></span>
      </button>
      {open && (
        <div className={styles.dropdown}>
          <div className={styles.statusRow}>
            <span className={styles.statusDot} aria-hidden="true"></span>
            <span>Logged in</span>
          </div>
          <button
            className={styles.logoutBtn}
            type="button"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? "Logging out..." : "Logout"}
          </button>
        </div>
      )}
    </div>
  );
}
