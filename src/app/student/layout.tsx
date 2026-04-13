import StudentLayoutClient from "./studentLayoutClient";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <StudentLayoutClient>{children}</StudentLayoutClient>;
}
