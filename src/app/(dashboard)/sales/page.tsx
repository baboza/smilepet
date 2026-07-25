"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, DollarSign, Receipt, ShoppingBag, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, doc, setDoc } from "firebase/firestore";

const fetchReceipts = async () => {
  const res = await fetch("/api/loyverse/receipts");
  if (!res.ok) throw new Error("Failed to fetch receipts");
  const data = await res.json();
  return data; // { totalRevenue, receipts }
};

const fetchPets = async () => {
  const snap = await getDocs(collection(db, "pets"));
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
};

const fetchLinkedReceipts = async () => {
  const snap = await getDocs(collection(db, "linked_receipts"));
  return snap.docs.reduce((acc, doc) => {
    acc[doc.id] = doc.data();
    return acc;
  }, {} as Record<string, any>);
};

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
        total_money: receipt.total_money,
      });
      refetchLinked();
    } catch (e) {
      console.error("Error linking pet:", e);
      alert("เกิดข้อผิดพลาดในการบันทึก");
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
                            <div className="flex justify-between items-center bg-blue-50 px-3 py-1.5 rounded-lg">
                              <span className="text-sm font-bold text-blue-700">ผูกกับ: {linkedData.petName}</span>
                              <button 
                                onClick={() => {
                                  // Optional: Add logic to unlink if needed
                                }}
                                className="text-xs text-blue-500 underline"
                              >
                                {linkedData.ownerName && `(เจ้าของ: ${linkedData.ownerName})`}
                              </button>
                            </div>
                          ) : (
                            <select 
                              className="w-full text-sm border-gray-200 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                              onChange={(e) => handleLinkPet(receipt, e.target.value)}
                              defaultValue=""
                            >
                              <option value="" disabled>ผูกกับสัตว์ป่วย (เลือกลูกค้า)</option>
                              {pets?.map((pet) => (
                                <option key={pet.id} value={pet.id}>
                                  {pet.name} {pet.ownerName ? `(${pet.ownerName})` : ""}
                                </option>
                              ))}
                            </select>
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
