"use client";

import { useState } from "react";
import { Download, FileText, Package, Calendar, Activity, Scissors, Home, CreditCard, TrendingUp, Users, DollarSign, AlertCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase/config";
import { collection, getDocs } from "firebase/firestore";
import { startOfDay, startOfWeek, startOfMonth, isAfter } from "date-fns";
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const fetchLoyverseEmployees = async () => {
  try {
    const res = await fetch("/api/loyverse/employees");
    if (!res.ok) return [];
    const data = await res.json();
    return data.employees || [];
  } catch {
    return [];
  }
};const fetchLoyverseRevenue = async (period: string) => {
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

  const { data: employeesData } = useQuery({
    queryKey: ["loyverseEmployees"],
    queryFn: fetchLoyverseEmployees
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

  // 4. Advanced Analytics (Loyverse)
  let totalDiscounts = 0;
  let totalTickets = filteredReceipts.length;
  
  const paymentMethods: Record<string, number> = {};
  const staffSales: Record<string, number> = {};
  const hourlyTrends: Record<string, number> = {};
  const itemCounts: Record<string, { qty: number, revenue: number }> = {};

  filteredReceipts.forEach((r: any) => {
    totalDiscounts += Math.abs(r.total_discount || 0); // Convert to absolute just in case
    
    if (r.payments && Array.isArray(r.payments)) {
      r.payments.forEach((p: any) => {
        const name = p.name || "อื่นๆ";
        paymentMethods[name] = (paymentMethods[name] || 0) + (p.money_amount || 0);
      });
    }

    const empId = r.employee_id;
    if (empId) {
      staffSales[empId] = (staffSales[empId] || 0) + (r.total_money || 0);
    }

    if (r.created_at) {
      const date = new Date(r.created_at);
      const hour = date.getHours().toString().padStart(2, '0') + ":00";
      hourlyTrends[hour] = (hourlyTrends[hour] || 0) + 1;
    }

    if (r.line_items) {
      r.line_items.forEach((item: any) => {
        const name = item.item_name || "ไม่ระบุ";
        if (!itemCounts[name]) itemCounts[name] = { qty: 0, revenue: 0 };
        itemCounts[name].qty += (item.quantity || 1);
        itemCounts[name].revenue += (item.total_money || 0);
      });
    }
  });

  const avgTicket = totalTickets > 0 ? totalRevenue / totalTickets : 0;
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

  const paymentData = Object.entries(paymentMethods)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  const staffData = Object.entries(staffSales)
    .map(([id, sales]) => {
      const emp = employeesData?.find((e: any) => e.id === id);
      return { name: emp ? emp.name : "พนักงาน", sales };
    })
    .sort((a, b) => b.sales - a.sales);

  const hourlyData = Object.entries(hourlyTrends)
    .map(([time, cases]) => ({ time, cases }))
    .sort((a, b) => a.time.localeCompare(b.time));

  const topItemsData = Object.entries(itemCounts)
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 5)
    .map(([name, data]) => ({ name, revenue: data.revenue, qty: data.qty }));


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
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-gray-500 mb-1">ยอดซื้อเฉลี่ย/บิล</div>
              <div className="text-xl font-bold text-gray-900">฿ {avgTicket.toFixed(0)}</div>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
              <CreditCard size={18} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-gray-500 mb-1">จำนวนบิลทั้งหมด</div>
              <div className="text-xl font-bold text-gray-900">{totalTickets} <span className="text-sm font-normal text-gray-500">บิล</span></div>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-500">
              <FileText size={18} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-gray-500 mb-1">จำนวนเคสบริการรวม</div>
              <div className="text-xl font-bold text-gray-900">{totalCases} <span className="text-sm font-normal text-gray-500">เคส</span></div>
            </div>
            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
              <Activity size={18} />
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-gray-500 mb-1">ผู้ป่วยใหม่</div>
              <div className="text-xl font-bold text-gray-900">{newPetsCount} <span className="text-sm font-normal text-gray-500">ตัว</span></div>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-500">
              <Users size={18} />
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

        {/* Advanced Charts Section */}
        
        {/* Payment Methods */}
        {paymentData.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <CreditCard size={18} className="text-blue-500" /> สัดส่วนช่องทางชำระเงิน
            </h2>
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {paymentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: any) => `฿ ${Number(value).toLocaleString()}`} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Hourly Trends */}
        {hourlyData.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Activity size={18} className="text-purple-500" /> ช่วงเวลาที่มีลูกค้าเยอะที่สุด (บิล/ชม.)
            </h2>
            <div className="h-60 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Line type="monotone" dataKey="cases" stroke="#a855f7" strokeWidth={3} dot={{ r: 4, fill: "#a855f7", strokeWidth: 2, stroke: "#fff" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Staff KPI */}
        {staffData.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <Users size={18} className="text-orange-500" /> ยอดขายตามพนักงาน (Staff KPI)
            </h2>
            <div className="h-64 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={staffData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151' }} width={80} />
                  <Tooltip formatter={(value: any) => `฿ ${Number(value).toLocaleString()}`} cursor={{ fill: '#f3f4f6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="sales" fill="#f59e0b" radius={[0, 4, 4, 0]}>
                    {staffData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Top Selling Items */}
        {topItemsData.length > 0 && (
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="font-bold text-gray-900 flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-green-500" /> สินค้า/ยา ยอดฮิต 5 อันดับแรก
            </h2>
            <div className="h-64 w-full -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topItemsData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#374151' }} width={100} />
                  <Tooltip 
                    formatter={(value: any, name: any) => name === 'revenue' ? [`฿ ${Number(value).toLocaleString()}`, 'ยอดขาย'] : [`${value} ชิ้น`, 'จำนวน']}
                    cursor={{ fill: '#f3f4f6' }} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}


      </div>
    </div>
  );
}
