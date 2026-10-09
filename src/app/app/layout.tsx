import { Sidebar } from "@/components/app/Sidebar";
import { Topbar } from "@/components/app/Topbar";
import { CommandPalette } from "@/components/app/CommandPalette";
import { SettingsModal } from "@/components/app/SettingsModal";
import { AppShell } from "@/components/app/AppShell";

// The workspace is driven by client-side state (localStorage-persisted store); never prerender it.
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen print:h-auto overflow-hidden print:overflow-visible bg-app-bg text-app-text">
      <div className="print:hidden"><Sidebar /></div>
      <div className="flex min-w-0 flex-1 flex-col print:h-auto print:block">
        <div className="print:hidden"><Topbar /></div>
        <AppShell>{children}</AppShell>
      </div>
      <CommandPalette />
      <SettingsModal />
    </div>
  );
}
