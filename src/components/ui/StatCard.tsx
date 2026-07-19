"use client";

import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  colorScheme: "blue" | "mint" | "orange" | "purple" | "pink" | "red";
  onClick?: () => void;
}

const colorMap = {
  blue: "bg-blue-50 text-blue-600",
  mint: "bg-mint-50 text-mint-600",
  orange: "bg-orange-50 text-orange-600",
  purple: "bg-purple-50 text-purple-600",
  pink: "bg-pink-50 text-pink-600",
  red: "bg-red-50 text-red-600",
};

export function StatCard({ title, value, icon: Icon, colorScheme, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`relative overflow-hidden bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-start gap-3 transition-all duration-300 ${
        onClick ? "hover:shadow-md hover:border-gray-200 active:scale-[0.98] cursor-pointer" : "cursor-default"
      }`}
    >
      <div className={`p-3 rounded-xl ${colorMap[colorScheme]}`}>
        <Icon size={22} strokeWidth={2.5} />
      </div>
      <div className="flex flex-col items-start">
        <span className="text-2xl font-bold text-gray-900">{value}</span>
        <span className="text-xs font-medium text-gray-500 mt-1">{title}</span>
      </div>
    </button>
  );
}
