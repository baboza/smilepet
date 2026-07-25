"use client";

import { useState } from "react";
import { Download, FileText, Package, Calendar, Activity, Scissors, Home, CreditCard, TrendingUp, Users, DollarSign, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { startOfDay, startOfWeek, startOfMonth, isAfter } from "date-fns";

const fetchLoyverseInventory = async () => {
  try {
    const res = await fetch("/api/loyverse/inventory");
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || data.inventory_levels || [];
  } catch {
    return [];
  }
};

const fetchLoyverseRevenue = async (period: string) => {
  let min = "";
  let max = "";
  
  if (period !== "ทั้งหมด") {
    let cutoffDate = new Date(0);
    const now = new Date();
    if (period === "วันนี้") cutoffDate = startOfDay(now);
    if (period === "สัปดาห์นี้") cutoffDate = startOfWeek(now, { weekStartsOn: 1 });
    if (period === "เดือนนี้") cutoffDate = startOfMonth(now);
    
    min = cutoffDate.toISOString().split('.')[0] + 'Z';
    max = now.toISOString().split('.')[0] + 'Z';
  }
  
  try {
    const query = min && max ? `?min=${min}&max=${max}` : "";
    const res = await fetch(`/api/loyverse/receipts${query}`);
    if (!res.ok) return { totalRevenue: 0, receipts: [] };
    return await res.json();
  } catch {
    return { totalRevenue: 0, receipts: [] };
  }
};

const fetchReportData = async () => {
  const [opdSnap, groomSnap, hotelSnap, petsSnap, receiptsSnap] = await Promise.all([
    getDocs(collection(db, "opd_records")),
    getDocs(collection(db, "grooming_queues")),
    getDocs(collection(db, "hotel_bookings")),
    getDocs(collection(db, "pets")),
    getDocs(collection(db, "linked_receipts"))
  ]);

  return {
    opd: opdSnap.docs.map(d => d.data()),
    grooming: groomSnap.docs.map(d => d.data()),
    hotel: hotelSnap.docs.map(d => d.data()),
    pets: petsSnap.docs.map(d => d.data()),
    receipts: receiptsSnap.docs.map(d => d.data()),
  };
};

export default function ReportsPage() {
  const [reportPeriod, setReportPeriod] = useState("วันนี้");

  const { data: allData, isLoading } = useQuery({
    queryKey: ["reportData"],
    queryFn: fetchReportData
  });

  const { data: inventoryData, isLoading: invLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: fetchLoyverseInventory
  });

  const { data: revenueData, isLoading: revLoading } = useQuery({
    queryKey: ["loyverseRevenue", reportPeriod],
    queryFn: () => fetchLoyverseRevenue(reportPeriod)
  });

  // Calculate cut-off date based on period
  let cutoffDate = new Date(0); // All time
  const now = new Date();
  if (reportPeriod === "วันนี้") cutoffDate = startOfDay(now);
  if (reportPeriod === "สัปดาห์นี้") cutoffDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
  if (reportPeriod === "เดือนนี้") cutoffDate = startOfMonth(now);

  // Filter helper
  const isWithinPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    return isAfter(d, cutoffDate) || d.getTime() === cutoffDate.getTime();
  };

  // 1. Calculate KPIs
  const opdAmount = allData?.opd.filter(d => isWithinPeriod(d.createdAt || d.date)).length || 0;
  const groomingAmount = allData?.grooming.filter(d => isWithinPeriod(d.createdAt || d.bookingDate)).length || 0;
  const hotelAmount = allData?.hotel.filter(d => isWithinPeriod(d.createdAt || d.checkIn)).length || 0;
  const totalCases = opdAmount + groomingAmount + hotelAmount;

  const newPetsCount = allData?.pets.filter(d => isWithinPeriod(d.createdAt)).length || 0;
  
  const totalRevenue = revenueData?.totalRevenue || 0;
  const filteredReceipts = revenueData?.receipts || [];

  // 2. Cases Data
  const casesData = [
    { label: "OPD", amount: opdAmount, color: "bg-blue-500", percent: totalCases ? (opdAmount / totalCases) * 100 : 0 },
    { label: "Grooming", amount: groomingAmount, color: "bg-purple-500", percent: totalCases ? (groomingAmount / totalCases) * 100 : 0 },
    { label: "Cat Hotel", amount: hotelAmount, color: "bg-orange-500", percent: totalCases ? (hotelAmount / totalCases) * 100 : 0 },
  ];

  // 3. Pet Proportion
  const dogsCount = allData?.pets.filter(d => isWithinPeriod(d.createdAt) && d.species === "สุนัข").length || 0;
  const catsCount = allData?.pets.filter(d => isWithinPeriod(d.createdAt) && d.species === "แมว").length || 0;
  const otherCount = newPetsCount - dogsCount - catsCount;

  // 4. Top Selling Items
  const itemCounts: Record<string, number> = {};
  filteredReceipts.forEach((r: any) => {
    if (r.line_items) {
      r.line_items.forEach((item: any) => {
        itemCounts[item.item_name] = (itemCounts[item.item_name] || 0) + (item.quantity || 1);
      });
    }
  });
  const topSelling = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty }));

  // 5. Low Stock
  const lowStockThreshold = 10;
  const lowStockItems = (inventoryData || [])
    .filter((item: any) => item.in_stock !== null && item.in_stock <= lowStockThreshold)
    .sort((a: any, b: any) => a.in_stock - b.in_stock)
    .slice(0, 5);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      
      {/* Top App Bar */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">ระบบรายงาน (Reports)</h1>
          <div className="flex gap-2">
            <button className="flex items-center justify-center w-10 h-10 bg-gray-50 text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
              <Download size={20} />
            </button>
            <button className="flex items-center justify-center w-10 h-10 bg-mint-50 text-mint-600 rounded-full hover:bg-mint-100 transition-colors">
              <FileText size={20} />
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
          {["วันนี้", "สัปดาห์นี้", "เดือนนี้", "ทั้งหมด"].map((period) => (
            <button 
              key={period}
              onClick={() => setReportPeriod(period)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                reportPeriod === period ? "bg-gray-900 text-white shadow-md" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-5">
        
        {/* Main Revenue KPI */}
        <div className="bg-gradient-to-br from-mint-500 to-mint-600 rounded-2xl p-5 text-white shadow-sm">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <DollarSign size={20} />
            <h2 className="text-sm font-bold">ยอดขายรวมทั้งหมด (Loyverse)</h2>
          </div>
          <div className="text-3xl font-black mb-1">
            {revLoading ? "..." : `฿ ${new Intl.NumberFormat('th-TH').format(totalRevenue)}`}
          </div>
          <p className="text-xs opacity-80">ช่วงเวลา: {reportPeriod}</p>
        </div>

        {/* Sub KPIs */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Users size={16} className="text-blue-500" />
              <span className="text-xs font-bold">ผู้ป่วยใหม่</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {isLoading ? "..." : newPetsCount} <span className="text-sm font-normal text-gray-500">ตัว</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar size={16} className="text-purple-500" />
              <span className="text-xs font-bold">จำนวนเคสรวม</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {isLoading ? "..." : totalCases} <span className="text-sm font-normal text-gray-500">เคส</span>
            </div>
          </div>
        </div>

        {/* Service Cases Stats */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <Activity size={18} className="text-gray-500" /> สัดส่วนจำนวนเคสแต่ละแผนก
          </h2>
          
          <div className="space-y-4 pt-2">
            {casesData.map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-gray-800">{item.label}</span>
                  <span className="font-bold text-gray-900">{isLoading ? "..." : item.amount} เคส</span>
                </div>
                <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-1000`} 
                    style={{ width: `${item.percent}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pet Type Stats */}
        {newPetsCount > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 mb-4">สัตว์ป่วยใหม่ ({newPetsCount} ตัว)</h2>
            <div className="flex items-center justify-between text-center divide-x divide-gray-100">
              <div className="flex-1">
                <div className="text-2xl mb-1">🐶</div>
                <div className="font-bold text-gray-900">{dogsCount}</div>
                <div className="text-xs text-gray-500">สุนัข</div>
              </div>
              <div className="flex-1">
                <div className="text-2xl mb-1">🐱</div>
                <div className="font-bold text-gray-900">{catsCount}</div>
                <div className="text-xs text-gray-500">แมว</div>
              </div>
              {otherCount > 0 && (
                <div className="flex-1">
                  <div className="text-2xl mb-1">🐰</div>
                  <div className="font-bold text-gray-900">{otherCount}</div>
                  <div className="text-xs text-gray-500">อื่นๆ</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Selling Items */}
        {topSelling.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-green-500" /> สินค้า/ยา ยอดฮิต
            </h2>
            <div className="space-y-3">
              {topSelling.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center text-sm border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                  <span className="text-gray-700 truncate pr-2 flex-1">{item.name}</span>
                  <span className="font-bold text-gray-900 shrink-0">{item.qty} ชิ้น</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Low Stock Warning */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-red-100">
          <div className="flex items-center gap-2 mb-4 text-red-600">
            <AlertCircle size={20} />
            <h2 className="font-bold">สินค้าใกล้หมด (ต่ำกว่า {lowStockThreshold})</h2>
          </div>
          
          {invLoading ? (
            <p className="text-sm text-gray-500">กำลังตรวจสอบ...</p>
          ) : lowStockItems.length > 0 ? (
            <div className="space-y-3">
              {lowStockItems.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between bg-red-50 p-3 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-red-100 shadow-sm shrink-0">
                      <Package size={18} className="text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.item_name}</p>
                      <p className="text-xs text-gray-500">คงเหลือ: <span className="font-bold text-red-600">{item.in_stock}</span></p>
                    </div>
                  </div>
                  <button className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-full whitespace-nowrap">
                    สั่งซื้อ
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 bg-gray-50 p-3 rounded-xl text-center">มีสต็อกเพียงพอทุกรายการ</p>
          )}
        </div>

      </div>
    </div>
  );
}
