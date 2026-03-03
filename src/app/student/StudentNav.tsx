import ProfileMenu from "@/components/ProfileMenu";
import BackButton from "@/components/BackButton";

type StudentNavProps = {
  username: string;
};

export default function StudentNav({ username }: StudentNavProps) {
  return (
    <header className="nav">
      <div className="nav-left">
        <BackButton />
        <a className="brand" href="/student/home">
          Fulbright AntiCheat Knight
        </a>
      </div>
      <nav className="nav-links" aria-hidden="true"></nav>
      <ProfileMenu username={username} />
    </header>
  );
}
