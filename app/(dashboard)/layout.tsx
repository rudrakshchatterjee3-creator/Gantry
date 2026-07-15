import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { FanAssistant } from "@/components/assistant/FanAssistant";
import { CriticalAlertWatcher } from "@/components/alerts/CriticalAlertWatcher";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-surface text-slate-200">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
      <FanAssistant />
      <CriticalAlertWatcher />
    </div>
  );
}
