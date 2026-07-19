"use client";

import { useState } from "react";
import { Download, FileText, Package, Calendar, Activity, Scissors, Home, CreditCard } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase/config";
import { collection, getCountFromServer } from "firebase/firestore";

const fetchMetrics = async () => {
  const opdCount = (await getCountFromServer(collection(db, "opd_records"))).data().count;
  const groomingCount = (await getCountFromServer(collection(db, "grooming_queues"))).data().count;
  const hotelCount = (await getCountFromServer(collection(db, "hotel_bookings"))).data().count;
  return { opdCount, groomingCount, hotelCount };
};

export default function ReportsPage() {
  const [reportPeriod, setReportPeriod] = useState("ทั้งหมด");

  const { data: metrics, isLoading } = useQuery({
    queryKey: ["reportMetrics"],
    queryFn: fetchMetrics
  });

  const opdAmount = metrics?.opdCount || 0;
  const groomingAmount = metrics?.groomingCount || 0;
  const hotelAmount = metrics?.hotelCount || 0;
  
  const totalCases = opdAmount + groomingAmount + hotelAmount;

  const casesData = [
    { label: "OPD", amount: opdAmount, color: "bg-blue-500", percent: totalCases ? (opdAmount / totalCases) * 100 : 0 },
    { label: "Grooming", amount: groomingAmount, color: "bg-purple-500", percent: totalCases ? (groomingAmount / totalCases) * 100 : 0 },
    { label: "Cat Hotel", amount: hotelAmount, color: "bg-orange-500", percent: totalCases ? (hotelAmount / totalCases) * 100 : 0 },
  ];

  // MVP: Hardcoded stock low
  const stockLow = [
    { name: "NexGard Spectra (S)", qty: 5 },
    { name: "Royal Canin Fit (2kg)", qty: 2 },
    { name: "น้ำเกลือ NSS 1000ml", qty: 10 },
  ];

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
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["ทั้งหมด", "วันนี้", "สัปดาห์นี้", "เดือนนี้"].map((period) => (
            <button 
              key={period}
              onClick={() => setReportPeriod(period)}
              className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                reportPeriod === period ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        
        {/* KPI Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar size={16} className="text-blue-500" />
              <span className="text-xs font-bold">จำนวนเคสรวม</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {isLoading ? "..." : totalCases} <span className="text-sm font-normal text-gray-500">เคส</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Activity size={16} className="text-mint-500" />
              <span className="text-xs font-bold">OPD</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? "..." : opdAmount} <span className="text-sm font-normal text-gray-500">เคส</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Scissors size={16} className="text-purple-500" />
              <span className="text-xs font-bold">อาบน้ำตัดขน</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? "..." : groomingAmount} <span className="text-sm font-normal text-gray-500">คิว</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Home size={16} className="text-orange-500" />
              <span className="text-xs font-bold">โรงแรมสัตว์เลี้ยง</span>
            </div>
            <div className="text-xl font-bold text-gray-900">
              {isLoading ? "..." : hotelAmount} <span className="text-sm font-normal text-gray-500">ตัว</span>
            </div>
          </div>
        </div>

        {/* Loyverse POS Notice */}
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 items-start">
          <div className="bg-blue-100 p-2 rounded-full shrink-0">
            <CreditCard size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-blue-900 mb-1">การจัดการรายได้</h3>
            <p className="text-xs text-blue-700 leading-relaxed font-bold">
              ยอดขายและการรับชำระเงินสามารถดูรายงานเชิงลึกและจัดการผ่านระบบ <strong>Loyverse POS</strong> ได้โดยตรง 
            </p>
          </div>
        </div>

        {/* Cases by Module */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-bold text-gray-900">สัดส่วนจำนวนเคสแต่ละแผนก</h2>
          
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

        {/* Stock Alert */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-900 font-bold">
              <Package size={18} className="text-red-500" />
              <h2>สินค้า/ยา ใกล้หมด</h2>
            </div>
            <button className="text-xs font-bold text-mint-600">ดูทั้งหมด</button>
          </div>
          
          <div className="space-y-3">
            {stockLow.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm font-bold text-gray-800">{item.name}</span>
                <span className="text-xs font-bold px-2 py-1 bg-red-50 text-red-600 rounded-md">เหลือ {item.qty}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
