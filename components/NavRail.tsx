"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "▣" },
  { href: "/obras", label: "Obras", icon: "◧" },
  { href: "/funcionarios", label: "Funcionários", icon: "☰" },
  { href: "/lancamento", label: "Lançamento diário", icon: "✓" },
  { href: "/relatorios/quinzenal", label: "Relatório quinzenal", icon: "Σ" },
  { href: "/rdo", label: "RDO", icon: "▤" },
  { href: "/rdo/relatorio", label: "Relatório de RDO", icon: "▦" },
  { href: "/configuracoes", label: "Configurações", icon: "⚙" },
];

export function NavRail({ adminUsername }: { adminUsername: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="bg-rail text-[#dce6f2] w-[220px] shrink-0 p-4 flex flex-col gap-6 sticky top-0 h-screen">
      <div className="flex flex-col gap-1 px-2">
        <div className="w-8 h-8 bg-white rounded flex items-center justify-center text-accent font-extrabold text-sm mb-2">
          CO
        </div>
        <div className="font-extrabold text-sm text-white">Controle de Obra</div>
        <div className="text-[11px] uppercase tracking-wide text-[#8ca6c7]">Synce88</div>
      </div>

      <div className="flex flex-col gap-0.5">
        {(() => {
          const activeHref = NAV_ITEMS.filter((item) =>
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
          ).sort((a, b) => b.href.length - a.href.length)[0]?.href;

          return NAV_ITEMS.map((item) => {
            const active = item.href === activeHref;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-semibold ${
                  active ? "bg-accent text-white" : "text-[#b6c8de] hover:bg-rail-hover hover:text-white"
                }`}
              >
                <span className="w-4 text-center font-mono text-xs opacity-90">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          });
        })()}
      </div>

      <div className="mt-auto border-t border-[#1d3f68] pt-3 text-xs text-[#8ca6c7]">
        <strong className="block text-white text-sm mb-2">{adminUsername}</strong>
        <button onClick={handleLogout} className="text-xs text-[#8ca6c7] hover:text-white underline">
          Sair
        </button>
      </div>
    </nav>
  );
}
