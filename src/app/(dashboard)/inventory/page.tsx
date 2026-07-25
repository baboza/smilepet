"use client";

import { useState } from "react";
import { Search, Package, ArrowLeft, Tag } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

const fetchInventory = async () => {
  const res = await fetch("/api/loyverse/inventory");
  if (!res.ok) throw new Error("Failed to fetch inventory");
  const data = await res.json();
  return data.items || [];
};

export default function InventoryPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const { data: items, isLoading, isError } = useQuery({
    queryKey: ["loyverseInventory"],
    queryFn: fetchInventory,
  });

  const filteredItems = items?.filter((item: any) => 
    item.item_name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Top App Bar */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 space-y-4">
        <div className="flex items-center gap-3">
          <Link href="/more" className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">คลังยาและสินค้า</h1>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-xl leading-5 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500 transition-colors sm:text-sm"
            placeholder="ค้นหาชื่อยา, สินค้า, หรือค่าบริการ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Inventory List */}
      <div className="p-4 space-y-3">
        {isLoading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white p-4 rounded-2xl h-24 animate-pulse border border-gray-100"></div>
          ))
        ) : isError ? (
          <div className="text-center py-10">
            <p className="text-red-500 font-bold mb-2">เกิดข้อผิดพลาดในการดึงข้อมูลจาก Loyverse</p>
            <p className="text-sm text-gray-500">กรุณาตรวจสอบ Token และการเชื่อมต่อ</p>
          </div>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item: any) => {
            // Find default price (or first variant price)
            const price = item.variants && item.variants.length > 0 
              ? item.variants[0].default_price 
              : 0;

            return (
              <div
                key={item.id}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4"
              >
                <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0">
                  <Package size={24} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-gray-900 truncate">{item.item_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                      <Tag size={12} />
                      {item.track_stock ? "ตัดสต็อก" : "บริการ/ไม่นับสต็อก"}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-lg font-black text-purple-600">฿ {new Intl.NumberFormat('th-TH').format(price || 0)}</p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-10">
            <p className="text-gray-500 font-bold mb-2">ไม่พบรายการสินค้า</p>
          </div>
        )}
      </div>
    </div>
  );
}
