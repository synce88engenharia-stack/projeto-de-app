import { NavRail } from "@/components/NavRail";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-paper">
      <NavRail adminUsername={process.env.ADMIN_USERNAME ?? "admin"} />
      <main className="flex-1 p-8 max-w-[1180px]">{children}</main>
    </div>
  );
}
