"use client";

import { useState, useEffect } from "react";
import StatsPanel from "@/components/StatsPanel";
import AdminsPanel from "@/components/AdminsPanel";
import BulkImportPanel from "@/components/BulkImportPanel";
import ComplaintsPanel from "@/components/ComplaintsPanel";
import WarningsPanel from "@/components/WarningsPanel";
import AdminWarningsPanel from "@/components/AdminWarningsPanel";
import UsersPanel from "@/components/UsersPanel";
import SalaryPanel from "@/components/SalaryPanel";
import { BarChart3, Users, Upload, FileText, ShieldAlert, UserCheck, UserCog, LogOut, DollarSign } from "lucide-react";

type Tab = "stats" | "admins" | "bulk" | "complaints" | "warnings" | "admin-warnings" | "salary" | "users";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<Tab>("stats");
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.role === "owner") setIsOwner(true);
      })
      .catch(() => {});
  }, []);

  const allTabs: { key: Tab; label: string; icon: React.ReactNode; ownerOnly?: boolean }[] = [
    { key: "stats", label: "Статистика", icon: <BarChart3 size={18} /> },
    { key: "admins", label: "Администраторы", icon: <Users size={18} /> },
    { key: "bulk", label: "Загрузить ЖБ", icon: <Upload size={18} /> },
    { key: "complaints", label: "Список ЖБ", icon: <FileText size={18} /> },
    { key: "warnings", label: "Предупреждения", icon: <ShieldAlert size={18} /> },
    { key: "admin-warnings", label: "Предупреждения админов", icon: <UserCheck size={18} /> },
    { key: "salary", label: "Зарплата", icon: <DollarSign size={18} /> },
    { key: "users", label: "Пользователи", icon: <UserCog size={18} />, ownerOnly: true },
  ];

  const tabs = allTabs.filter((t) => !t.ownerOnly || isOwner);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="bg-gray-900 border-b border-purple-900/40 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-violet-800 flex items-center justify-center glow-pulse">
              <BarChart3 size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Admin<span className="text-purple-400">Track</span>
              </h1>
              <p className="text-xs text-gray-400">Система учёта жалоб</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-900/20 transition-all duration-200"
          >
            <LogOut size={16} />
            Выйти
          </button>
        </div>
      </header>

      <nav className="bg-gray-900/60 border-b border-gray-800 sticky top-0 z-30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 py-2 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeTab === t.key
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-900/40"
                    : "text-gray-400 hover:text-white hover:bg-gray-800"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === "stats" && <StatsPanel />}
        {activeTab === "admins" && <AdminsPanel />}
        {activeTab === "bulk" && <BulkImportPanel />}
        {activeTab === "complaints" && <ComplaintsPanel />}
        {activeTab === "warnings" && <WarningsPanel />}
        {activeTab === "admin-warnings" && <AdminWarningsPanel />}
        {activeTab === "salary" && <SalaryPanel />}
        {activeTab === "users" && isOwner && <UsersPanel />}
      </main>
    </div>
  );
}