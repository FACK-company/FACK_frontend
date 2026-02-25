import ProfileMenu from "@/components/ProfileMenu";

type StudentNavProps = {
  username: string;
};

export default function StudentNav({ username }: StudentNavProps) {
  return (
    <header className="nav">
      <a className="brand" href="/student/home">
        Fulbright AntiCheat Knight
      </a>
      <nav className="nav-links" aria-hidden="true"></nav>
      <ProfileMenu username={username} />
    </header>
  );
}

