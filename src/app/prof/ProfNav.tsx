import ProfileMenu from "@/components/ProfileMenu";
import BackButton from "@/components/BackButton";

type ProfNavProps = {
  username: string;
  active?: "home" | "recordings";
};

export default function ProfNav({ username, active }: ProfNavProps) {
  return (
    <header className="nav">
      <div className="nav-left">
        <BackButton />
        <a className="brand" href="/prof/home">
          Fulbright AntiCheat Knight
        </a>
      </div>
      <nav className="nav-links">
        <a className={active === "home" ? "active" : undefined} href="/prof/home">
          Home
        </a>
        {/* <a className={active === "recordings" ? "active" : undefined} href="/prof/recordings">
          Recordings
        </a> */}
      </nav>
      <ProfileMenu username={username} />
    </header>
  );
}
