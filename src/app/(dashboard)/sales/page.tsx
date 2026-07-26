"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, DollarSign, Receipt, ShoppingBag, Link as LinkIcon, Search, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, setDoc, deleteDoc } from "firebase/firestore";

const fetchReceipts = async () => {
  const res = await fetch("/api/loyverse/receipts");
  if (!res.ok) throw new Error("Failed to fetch receipts");
  const data = await res.json();
  return data; // { totalRevenue, receipts }
};

const fetchPets = async () => {
  const [petsSnap, ownersSnap] = await Promise.all([
    getDocs(collection(db, "pets")),
    getDocs(collection(db, "owners"))
  ]);
  
  const owners = ownersSnap.docs.reduce((acc, doc) => {
    acc[doc.id] = doc.data().name;
    return acc;
  }, {} as Record<string, string>);

  return petsSnap.docs.map(doc => {
    const data = doc.data() as any;
    return { 
      id: doc.id, 
      ...data,
      ownerName: owners[data.ownerId] || "ไม่ระบุ"
    };
  });
};

const fetchLinkedReceipts = async () => {
  const snap = await getDocs(collection(db, "linked_receipts"));
  return snap.docs.reduce((acc, doc) => {
    acc[doc.id] = doc.data();
    return acc;
  }, {} as Record<string, any>);
};

function SearchablePetSelect({ pets, onSelect }: { pets: any[], onSelect: (id: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredPets = pets.filter(p => {
    const term = search.toLowerCase();
    return p.name.toLowerCase().includes(term) || (p.ownerName && p.ownerName.toLowerCase().includes(term));
  });

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        className="flex items-center justify-between w-full px-3 py-2 border border-gray-200 rounded-lg bg-white cursor-text focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-2 flex-1">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input 
            type="text"
            className="w-full text-sm outline-none bg-transparent text-gray-900 placeholder-gray-500"
            placeholder="ค้นหาชื่อสัตว์เลี้ยง หรือ เจ้าของ..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
          />
        </div>
        <ChevronDown size={16} className="text-gray-400 shrink-0" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {filteredPets.length > 0 ? (
            filteredPets.map(pet => (
              <div 
                key={pet.id} 
                className="p-3 border-b border-gray-50 hover:bg-blue-50 cursor-pointer transition-colors"
                onClick={() => {
                  onSelect(pet.id);
                  setIsOpen(false);
                  setSearch("");
                }}
              >
                <p className="text-sm font-bold text-gray-900">{pet.name}</p>
                <p className="text-xs text-gray-500">เจ้าของ: {pet.ownerName || "ไม่ระบุ"}</p>
              </div>
            ))
          ) : (
            <div className="p-3 text-sm text-gray-500 text-center">ไม่พบชื่อที่ค้นหา</div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SalesPage() {
  const router = useRouter();
  
  const { data, isLoading, isError } = useQuery({
    queryKey: ["loyverseReceipts"],
    queryFn: fetchReceipts,
  });

  const { data: pets } = useQuery({
    queryKey: ["pets"],
    queryFn: fetchPets,
  });

  const { data: linkedReceipts, refetch: refetchLinked } = useQuery({
    queryKey: ["linkedReceipts"],
    queryFn: fetchLinkedReceipts,
  });

  const receipts = data?.receipts || [];
  const totalRevenue = data?.totalRevenue || 0;

  const handleLinkPet = async (receipt: any, petId: string) => {
    if (!petId) return;
    try {
      const pet = pets?.find(p => p.id === petId);
      if (!pet) return;
      
      await setDoc(doc(db, "linked_receipts", receipt.receipt_number), {
        receipt_number: receipt.receipt_number,
        petId: pet.id,
        petName: pet.name,
        ownerName: pet.ownerName || "",
        linkedAt: new Date().toISOString(),
        receipt_date: receipt.created_at || new Date().toISOString(),
        total_money: receipt.total_money,
        line_items: receipt.line_items || []
      });
      refetchLinked();
    } catch (e) {
      console.error("Error linking pet:", e);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    }
  };
  const handleUnlinkPet = async (receiptNumber: string) => {
    if (window.confirm("ต้องการแก้ไขการผูกบิลนี้ใช่หรือไม่?")) {
      try {
        await deleteDoc(doc(db, "linked_receipts", receiptNumber));
        refetchLinked();
      } catch (e) {
        console.error("Error unlinking pet:", e);
        alert("เกิดข้อผิดพลาดในการแก้ไข");
      }
    }
  };
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      {/* Top App Bar */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-bold text-gray-900">ยอดขายวันนี้</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Summary Card */}
        <div className="bg-gradient-to-br from-mint-500 to-mint-600 rounded-2xl p-6 text-white shadow-md">
          <div className="flex items-center gap-2 mb-2 opacity-90">
            <DollarSign size={20} />
            <h2 className="text-sm font-bold uppercase tracking-wider">รายรับรวม (Loyverse)</h2>
          </div>
          <div className="text-3xl font-black">
            ฿ {new Intl.NumberFormat('th-TH').format(totalRevenue)}
          </div>
          <p className="text-xs mt-2 opacity-80">ยอดขายตั้งแต่วันนี้ 00:00 เป็นต้นมา</p>
        </div>

        {/* Receipts List */}
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Receipt size={20} className="text-gray-500" />
            รายการบิล ({receipts.length})
          </h3>

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-4 rounded-2xl h-24 animate-pulse border border-gray-100"></div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <p className="text-red-500 font-bold mb-2">เกิดข้อผิดพลาดในการดึงข้อมูลบิล</p>
            </div>
          ) : receipts.length > 0 ? (
            <div className="space-y-3">
              {receipts.map((receipt: any) => {
                const date = new Date(receipt.created_at);
                const timeString = date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
                const linkedData = linkedReceipts?.[receipt.receipt_number];
                
                return (
                  <div key={receipt.receipt_number} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">บิล #{receipt.receipt_number}</p>
                        <p className="text-xs text-gray-500">{timeString}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-base font-black text-mint-600">
                          ฿ {new Intl.NumberFormat('th-TH').format(receipt.total_money)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Pet Link Section */}
                    <div className="mb-3 py-2 border-t border-b border-gray-50">
                      <div className="flex items-center gap-2">
                        <LinkIcon size={14} className="text-blue-500 shrink-0" />
                        <div className="flex-1">
                          {linkedData ? (
                            <div className="flex justify-between items-center bg-blue-50 px-3 py-2 rounded-lg border border-blue-100">
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-blue-800">น้อง: {linkedData.petName}</span>
                                <span className="text-xs text-blue-600">เจ้าของ: {linkedData.ownerName || "ไม่ระบุ"}</span>
                              </div>
                              <button 
                                onClick={() => handleUnlinkPet(receipt.receipt_number)}
                                className="text-xs font-bold bg-white text-blue-600 px-3 py-1.5 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors shadow-sm"
                              >
                                แก้ไข
                              </button>
                            </div>
                          ) : (
                            <SearchablePetSelect 
                              pets={pets || []} 
                              onSelect={(petId) => handleLinkPet(receipt, petId)} 
                            />
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {receipt.line_items && receipt.line_items.length > 0 && (
                      <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                        {receipt.line_items.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-start text-sm">
                            <div className="flex items-start gap-2 flex-1">
                              <ShoppingBag size={14} className="text-gray-400 mt-0.5 shrink-0" />
                              <span className="text-gray-700">{item.item_name} <span className="text-gray-400 text-xs">x{item.quantity}</span></span>
                            </div>
                            <span className="text-gray-900 font-medium shrink-0 ml-2">
                              ฿ {new Intl.NumberFormat('th-TH').format(item.total_money)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-500 font-bold mb-2">ยังไม่มีบิลในวันนี้</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
