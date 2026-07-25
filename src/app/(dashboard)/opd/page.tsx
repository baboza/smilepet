"use client";

import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, query, orderBy, limit } from "firebase/firestore";
import Link from "next/link";
import { ArrowLeft, Users, Activity, Plus } from "lucide-react";
import { format } from "date-fns";

const fetchOpdRecords = async () => {
  const [opdSnap, petsSnap, ownersSnap] = await Promise.all([
    getDocs(query(collection(db, "opd_records"), orderBy("createdAt", "desc"), limit(50))),
    getDocs(collection(db, "pets")),
    getDocs(collection(db, "owners"))
  ]);

  const petsList = petsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
  const ownersList = ownersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));

  return opdSnap.docs.map(doc => {
    const data = doc.data() as any;
    const pet = petsList.find(p => p.id === data.petId);
    const owner = ownersList.find(o => o.id === pet?.ownerId);
    
    return {
      id: doc.id,
      ...data,
      petName: pet?.name || "ไม่ระบุชื่อ",
      ownerName: owner?.name || "ไม่ระบุเจ้าของ"
    };
  });
};

export default function OPDPage() {
  const { data: opdRecords, isLoading } = useQuery({
    queryKey: ["opdRecords"],
    queryFn: fetchOpdRecords,
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      
      {/* Top App Bar */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold text-gray-900">ประวัติการรักษา (OPD)</h1>
        </div>
        <Link 
          href="/patients"
          className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-full text-sm font-bold hover:bg-blue-100 transition-colors"
        >
          <Plus size={16} /> ตรวจใหม่
        </Link>
      </div>

      <div className="p-4 space-y-4">
        {/* Helper Note */}
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
          <p className="text-sm font-bold text-blue-800">
            หน้านี้แสดงประวัติการตรวจรักษาล่าสุด 50 รายการ 
            หากต้องการเริ่มตรวจใหม่ ให้ค้นหาจากหน้า <Link href="/patients" className="underline">ทะเบียนลูกค้า</Link> ครับ
          </p>
        </div>

        {/* List */}
        <div className="space-y-3">
          {isLoading ? (
            [...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl h-24 animate-pulse border border-gray-100"></div>
            ))
          ) : opdRecords && opdRecords.length > 0 ? (
            opdRecords.map((record) => {
              let timeStr = "";
              let dateStr = record.date;
              if (record.createdAt) {
                const d = new Date(record.createdAt);
                dateStr = format(d, "dd/MM/yyyy");
                timeStr = format(d, "HH:mm");
              }

              return (
                <Link 
                  href={`/patients/${record.petId}`} 
                  key={record.id}
                  className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 block hover:shadow-md transition-shadow active:scale-[0.98]"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
                        <Activity size={16} />
                      </div>
                      <div>
                        <h3 className="font-bold text-gray-900">{record.petName || "ไม่ระบุชื่อ"}</h3>
                        <p className="text-xs text-gray-500">เจ้าของ: {record.ownerName || "ไม่ระบุ"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-gray-900">{dateStr}</p>
                      {timeStr && <p className="text-[10px] text-gray-500">{timeStr} น.</p>}
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t border-gray-50">
                    <p className="text-sm text-gray-700">
                      <span className="font-bold">วินิจฉัย:</span> {
                        record.diagnosis ? (Array.isArray(record.diagnosis) ? record.diagnosis.join(", ") : record.diagnosis) : "ไม่ระบุ"
                      } {record.diagnosisOthers ? `(${record.diagnosisOthers})` : ""}
                    </p>
                    {record.physicalExam?.weight && (
                      <p className="text-xs text-gray-500 mt-1">น้ำหนัก: {record.physicalExam.weight} kg</p>
                    )}
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <Users size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500 font-bold">ยังไม่มีประวัติการรักษา</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
