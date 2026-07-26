"use client";

import React, { use, useState } from "react";
import { ArrowLeft, Edit, Phone, MapPin, CalendarPlus, Scissors, Home, Stethoscope, FileText, ChevronDown, ChevronUp, Syringe, BugOff, Microscope, Printer, Image as ImageIcon, Trash2 } from "lucide-react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, collection, query, where, getDocs, orderBy, deleteDoc } from "firebase/firestore";

const calculateAge = (birthDateStr: string) => {
  if (!birthDateStr || birthDateStr === "-") return "-";
  
  let birthDate;
  if (birthDateStr.includes("/")) {
    const [d, m, y] = birthDateStr.split("/");
    // Assume DD/MM/YYYY or similar if possible. If year > 2000, probably gregorian.
    // If it's a valid date, calculate
    if (d && m && y) {
      birthDate = new Date(`${y}-${m}-${d}`);
      if (isNaN(birthDate.getTime())) birthDate = new Date(birthDateStr);
    } else {
      birthDate = new Date(birthDateStr);
    }
  } else {
    birthDate = new Date(birthDateStr);
  }

  if (isNaN(birthDate.getTime())) return birthDateStr;

  const today = new Date();
  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  
  if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
    years--;
    months += 12;
  }
  
  if (years === 0 && months === 0) return "ไม่ถึง 1 เดือน";
  if (years === 0) return `${months} เดือน`;
  if (months === 0) return `${years} ปี`;
  return `${years} ปี ${months} เดือน`;
};

const fetchOwnerProfile = async (id: string) => {
  const ownerDoc = await getDoc(doc(db, "owners", id));
  if (!ownerDoc.exists()) return null;

  const ownerData = ownerDoc.data();
  
  const petsQuery = query(collection(db, "pets"), where("ownerId", "==", id));
  const petsSnap = await getDocs(petsQuery);

  const pets = await Promise.all(petsSnap.docs.map(async (docSnap) => {
    const petId = docSnap.id;
    const data = docSnap.data();
    
    let history: any[] = [];

    const [opdSnap, aptSnap, groomSnap, hotelSnap, receiptSnap, vacSnap, parasiteSnap, labSnap] = await Promise.all([
      getDocs(query(collection(db, "opd_records"), where("petId", "==", petId))),
      getDocs(query(collection(db, "appointments"), where("petId", "==", petId))),
      getDocs(query(collection(db, "grooming_queues"), where("petId", "==", petId))),
      getDocs(query(collection(db, "hotel_bookings"), where("petId", "==", petId))),
      getDocs(query(collection(db, "linked_receipts"), where("petId", "==", petId))),
      getDocs(query(collection(db, "vaccinations"), where("petId", "==", petId))),
      getDocs(query(collection(db, "parasite_preventions"), where("petId", "==", petId))),
      getDocs(query(collection(db, "lab_records"), where("petId", "==", petId)))
    ]);

    opdSnap.docs.forEach(d => {
      const opd = d.data();
      let opdDate = opd.date;
      if (opd.createdAt) {
        const d = new Date(opd.createdAt);
        opdDate = `${d.toLocaleDateString('th-TH')} ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
      }
      history.push({
        id: d.id,
        category: "OPD",
        date: opdDate,
        title: opd.treatmentType || "ประวัติการรักษา",
        details: opd
      });
    });

    aptSnap.docs.forEach(d => {
      const apt = d.data();
      history.push({
        id: d.id,
        category: "นัดหมาย",
        date: apt.date,
        title: apt.type || "นัดหมายติดตามอาการ",
        details: apt
      });
    });

    groomSnap.docs.forEach(d => {
      const groom = d.data();
      history.push({
        id: d.id,
        category: "อาบน้ำตัดขน",
        date: groom.bookingDate,
        title: "คิวอาบน้ำตัดขน",
        details: groom
      });
    });

    hotelSnap.docs.forEach(d => {
      const hotel = d.data();
      history.push({
        id: d.id,
        category: "ฝากเลี้ยง",
        date: hotel.checkIn,
        title: `เข้าพักห้อง ${hotel.roomNumber || ""}`,
        details: hotel
      });
    });

    receiptSnap.docs.forEach(d => {
      const receipt = d.data();
      const rDate = receipt.receipt_date || receipt.linkedAt;
      let dateStr = "";
      if (rDate) {
        const dateObj = new Date(rDate);
        dateStr = `${dateObj.toLocaleDateString('th-TH')} ${dateObj.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
      }
      history.push({
        id: d.id,
        category: "ชำระเงิน",
        date: dateStr,
        title: `บิล #${receipt.receipt_number}`,
        details: receipt
      });
    });

    vacSnap.docs.forEach(d => {
      const vac = d.data();
      history.push({
        id: d.id,
        category: "วัคซีน",
        date: vac.date,
        title: vac.vaccineName,
        details: vac
      });
    });

    parasiteSnap.docs.forEach(d => {
      const para = d.data();
      let paraDate = para.date;
      if (para.createdAt) {
        const d = new Date(para.createdAt);
        paraDate = `${d.toLocaleDateString('th-TH')} ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
      }
      history.push({
        id: d.id,
        category: "กำจัดปรสิต",
        date: paraDate,
        title: "ประวัติการกำจัดปรสิต/เห็บหมัด",
        details: para
      });
    });

    labSnap.docs.forEach(d => {
      const lab = d.data();
      let labDate = lab.createdAt;
      if (lab.createdAt) {
        const d = new Date(lab.createdAt);
        labDate = `${d.toLocaleDateString('th-TH')} ${d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`;
      }
      history.push({
        id: d.id,
        category: "ผลแล็บ",
        date: labDate,
        title: lab.title || "ผลแล็บ / X-Ray",
        details: lab,
        createdAt: lab.createdAt
      });
    });

    history.sort((a, b) => {
      const timeA = a.details?.createdAt ? new Date(a.details.createdAt).getTime() : new Date(a.date || 0).getTime();
      const timeB = b.details?.createdAt ? new Date(b.details.createdAt).getTime() : new Date(b.date || 0).getTime();
      return (timeB || 0) - (timeA || 0);
    });

    let latestWeight = data.weight || "-";
    let latestWeightDate = "";
    const latestOpdWithWeight = history.find(h => h.category === "OPD" && h.details?.physicalExam?.weight);
    if (latestOpdWithWeight) {
      latestWeight = latestOpdWithWeight.details.physicalExam.weight;
      latestWeightDate = latestOpdWithWeight.date;
    }

    return {
      id: petId,
      name: data.name,
      species: data.species,
      breed: data.breed || "-",
      birthDate: data.birthDate || "-",
      color: data.color || "-",
      sex: data.sex || "-",
      sterilization: data.sterilization || "-",
      weight: latestWeight,
      weightDate: latestWeightDate,
      photoUrl: data.imageUrl || data.photoUrl || "",
      history: history
    };
  }));

  return {
    id: ownerDoc.id,
    name: ownerData.name || "ไม่มีชื่อ",
    phone: ownerData.phone || "-",
    lineId: ownerData.lineId || "-",
    address: ownerData.address || "-",
    pets: pets
  };
};

export default function OwnerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ["ownerProfile", id],
    queryFn: () => fetchOwnerProfile(id),
  });

  const [expandedPetId, setExpandedPetId] = useState<string | null>(null);
  const [selectedReceipt, setSelectedReceipt] = useState<any>(null);

  const toggleHistory = (petId: string) => {
    setExpandedPetId(expandedPetId === petId ? null : petId);
  };

  const handleDeletePet = async (petId: string, petName: string) => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลของ "${petName}"?\n*หากลบแล้วจะไม่สามารถกู้คืนได้`)) {
      try {
        await deleteDoc(doc(db, "pets", petId));
        window.location.reload();
      } catch (error) {
        console.error("Error deleting pet:", error);
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      
      {/* Top App Bar */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/patients" className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-lg font-bold text-gray-900">โปรไฟล์ลูกค้า</h1>
        </div>
        <Link href={`/patients/${id}/edit`} className="p-2 -mr-2 rounded-full hover:bg-gray-100 text-gray-600 transition-colors">
          <Edit size={18} />
        </Link>
      </div>

      {isLoading ? (
        <div className="p-4 space-y-4">
          <div className="h-32 bg-gray-200 animate-pulse rounded-2xl"></div>
          <div className="h-48 bg-gray-200 animate-pulse rounded-2xl"></div>
        </div>
      ) : profile ? (
        <div className="p-4 space-y-5">
          
          {/* Owner Info Card */}
          <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-2xl border-2 border-blue-200 shrink-0">
                {profile.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-bold text-gray-900 truncate">{profile.name}</h2>
                <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                  <Phone size={14} className="text-gray-400" /> {profile.phone}
                </div>
                {profile.lineId !== "-" && (
                  <div className="text-sm text-green-600 mt-1 font-bold">
                    LINE: {profile.lineId}
                  </div>
                )}
              </div>
            </div>
            
            <div className="pt-3 border-t border-gray-100">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <MapPin size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <p>{profile.address}</p>
              </div>
            </div>
          </section>

          {/* Pets List */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-900 text-lg">สัตว์เลี้ยง ({profile.pets.length})</h3>
              <Link 
                href="/patients/register"
                className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full"
              >
                + เพิ่มสัตว์เลี้ยง
              </Link>
            </div>
            
            <div className="space-y-3">
              {profile.pets.map((pet: any) => (
                <div key={pet.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex flex-col sm:flex-row gap-5">
                    {/* Pet Image */}
                    <div className="w-full sm:w-48 sm:shrink-0">
                      <div className="bg-orange-50 rounded-2xl flex flex-col items-center justify-center border-2 border-orange-100 overflow-hidden shadow-sm">
                        {pet.photoUrl ? (
                          <img src={pet.photoUrl} alt={pet.name} className="w-full h-auto object-contain" />
                        ) : (
                          <div className="w-full aspect-square flex items-center justify-center">
                            <span className="text-6xl">{pet.species === "แมว" ? "🐱" : "🐶"}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Pet Info */}
                    <div className="flex-1 min-w-0 pt-2 text-center sm:text-left">
                      <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <h4 className="font-bold text-gray-900 text-2xl truncate">{pet.name}</h4>
                          <div className="flex items-center gap-1">
                            <Link href={`/patients/pet/${pet.id}/edit`} className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full transition-colors">
                              <Edit size={14} />
                            </Link>
                            <button onClick={() => handleDeletePet(pet.id, pet.name)} className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-full transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <span className="text-xs font-bold bg-gray-100 text-gray-600 px-3 py-1 rounded-lg uppercase tracking-wide">
                          {pet.species}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <p><span className="font-bold text-gray-800">สายพันธุ์:</span> {pet.breed}</p>
                        <p><span className="font-bold text-gray-800">สี:</span> {pet.color}</p>
                        <p><span className="font-bold text-gray-800">เพศ:</span> {pet.sex}</p>
                        <p><span className="font-bold text-gray-800">วันเกิด:</span> {pet.birthDate} {pet.birthDate !== "-" ? `(อายุ ${calculateAge(pet.birthDate)})` : ""}</p>
                        <p className="col-span-2"><span className="font-bold text-gray-800">การทำหมัน:</span> {pet.sterilization || "ไม่ระบุ"}</p>
                      </div>
                      <div className="flex justify-center sm:justify-start gap-4 text-sm font-bold text-gray-700">
                        <span className="bg-green-50 text-green-700 px-3 py-1 rounded-lg">
                          นน: {pet.weight !== "-" ? `${pet.weight} kg${pet.weightDate ? ` (${pet.weightDate})` : ''}` : "-"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions for this pet */}
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 mt-4 pt-3 border-t border-gray-100">
                    <Link href={`/opd/new?petId=${pet.id}`} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-blue-50 transition-colors text-blue-600 group">
                      <Stethoscope size={18} className="group-active:scale-95 transition-transform" />
                      <span className="text-[10px] font-bold">OPD</span>
                    </Link>
                    <Link href={`/vaccine/new?petId=${pet.id}`} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-yellow-50 transition-colors text-yellow-600 group">
                      <Syringe size={18} className="group-active:scale-95 transition-transform" />
                      <span className="text-[10px] font-bold">วัคซีน</span>
                    </Link>
                    <Link href={`/parasite/new?petId=${pet.id}`} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-teal-50 transition-colors text-teal-600 group">
                      <BugOff size={18} className="group-active:scale-95 transition-transform" />
                      <span className="text-[10px] font-bold">ปรสิต</span>
                    </Link>
                    <Link href={`/appointments/new?petId=${pet.id}`} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-mint-50 transition-colors text-mint-600 group">
                      <CalendarPlus size={18} className="group-active:scale-95 transition-transform" />
                      <span className="text-[10px] font-bold">นัดหมาย</span>
                    </Link>
                    <Link href={`/grooming/new?petId=${pet.id}`} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-purple-50 transition-colors text-purple-600 group">
                      <Scissors size={18} className="group-active:scale-95 transition-transform" />
                      <span className="text-[10px] font-bold">อาบน้ำ</span>
                    </Link>
                    <Link href={`/hotel/new?petId=${pet.id}`} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-orange-50 transition-colors text-orange-600 group">
                      <Home size={18} className="group-active:scale-95 transition-transform" />
                      <span className="text-[10px] font-bold">ฝากเลี้ยง</span>
                    </Link>
                    <Link href={`/patients/${id}/lab?petId=${pet.id}`} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-indigo-50 transition-colors text-indigo-600 group">
                      <Microscope size={18} className="group-active:scale-95 transition-transform" />
                      <span className="text-[10px] font-bold">แล็บ/X-Ray</span>
                    </Link>
                    <Link href={`/patients/${id}/forms?petId=${pet.id}`} className="flex flex-col items-center gap-1.5 p-2 rounded-xl hover:bg-rose-50 transition-colors text-rose-600 group">
                      <Printer size={18} className="group-active:scale-95 transition-transform" />
                      <span className="text-[10px] font-bold">ฟอร์ม</span>
                    </Link>
                  </div>

                  {/* History Toggle */}
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <button 
                      onClick={() => toggleHistory(pet.id)}
                      className="w-full flex items-center justify-center gap-2 py-2 text-sm font-bold text-gray-500 hover:text-gray-800 transition-colors"
                    >
                      <FileText size={16} />
                      ประวัติทั้งหมด ({pet.history.length})
                      {expandedPetId === pet.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    {/* Unified History List */}
                    {expandedPetId === pet.id && (
                      <div className="mt-3 space-y-3 relative before:absolute before:inset-y-0 before:left-[11px] before:w-[2px] before:bg-gray-100 ml-1">
                        {pet.history.length > 0 ? (
                          pet.history.map((record: any) => (
                            <div key={record.id} className="relative pl-8">
                              {/* Timeline Dot based on category */}
                              <div className={`absolute left-0 top-1.5 w-[24px] h-[24px] rounded-full flex items-center justify-center border-4 border-white ${
                                record.category === "OPD" ? "bg-blue-500" :
                                record.category === "วัคซีน" ? "bg-yellow-500" :
                                record.category === "กำจัดปรสิต" ? "bg-teal-500" :
                                record.category === "นัดหมาย" ? "bg-mint-500" :
                                record.category === "ชำระเงิน" ? "bg-green-500" :
                                record.category === "อาบน้ำตัดขน" ? "bg-purple-500" :
                                record.category === "ผลแล็บ" ? "bg-indigo-500" :
                                "bg-orange-500"
                              }`}>
                              </div>
                              
                              <div className={`p-3 rounded-xl border border-gray-100 text-sm shadow-sm ${
                                record.category === "OPD" ? "bg-blue-50/50" :
                                record.category === "วัคซีน" ? "bg-yellow-50/50" :
                                record.category === "กำจัดปรสิต" ? "bg-teal-50/50" :
                                record.category === "นัดหมาย" ? "bg-mint-50/50" :
                                record.category === "ชำระเงิน" ? "bg-green-50/50" :
                                record.category === "อาบน้ำตัดขน" ? "bg-purple-50/50" :
                                record.category === "ผลแล็บ" ? "bg-indigo-50/50" :
                                "bg-orange-50/50"
                              }`}>
                                <div className="flex justify-between items-start mb-2 pb-2 border-b border-gray-200">
                                  <div>
                                    <span className="font-bold text-gray-900">
                                      {record.category === "ชำระเงิน" ? (
                                        <button onClick={() => setSelectedReceipt(record.details)} className="text-blue-600 hover:underline">{record.title}</button>
                                      ) : record.title}
                                    </span>
                                    <p className="text-xs text-gray-500 mt-0.5">{record.date}</p>
                                  </div>
                                  <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                                    record.category === "OPD" ? "bg-blue-100 text-blue-700" :
                                    record.category === "วัคซีน" ? "bg-yellow-100 text-yellow-700" :
                                    record.category === "กำจัดปรสิต" ? "bg-teal-100 text-teal-700" :
                                    record.category === "นัดหมาย" ? "bg-mint-100 text-mint-700" :
                                    record.category === "ชำระเงิน" ? "bg-green-100 text-green-700" :
                                    record.category === "อาบน้ำตัดขน" ? "bg-purple-100 text-purple-700" :
                                    record.category === "ผลแล็บ" ? "bg-indigo-100 text-indigo-700" :
                                    "bg-orange-100 text-orange-700"
                                  }`}>
                                    {record.category}
                                  </span>
                                </div>
                                
                                {/* Detail block by category */}
                                <div className="space-y-1 text-xs">
                                  {record.category === "OPD" && (
                                    <>
                                      {record.details.physicalExam?.weight && <p><span className="font-bold text-gray-700">น้ำหนัก:</span> {record.details.physicalExam.weight} kg</p>}
                                      {(record.details.chiefComplaint?.items?.length > 0 || record.details.chiefComplaint?.others) && (
                                        <p><span className="font-bold text-gray-700">อาการ:</span> {[...(record.details.chiefComplaint?.items || []), record.details.chiefComplaint?.others].filter(Boolean).join(", ")}</p>
                                      )}
                                      {(record.details.diagnosis?.length > 0 || record.details.diagnosisOthers) && (
                                        <p><span className="font-bold text-gray-700">วินิจฉัย:</span> {[...(record.details.diagnosis || []), record.details.diagnosisOthers].filter(Boolean).join(", ")}</p>
                                      )}
                                      {record.details.physicalExam?.bodySystem && (Object.values(record.details.physicalExam.bodySystem).some(v => v === true) || record.details.physicalExam.bodySystem.OtherDetail) && (
                                        <p><span className="font-bold text-gray-700">ความผิดปกติที่พบ:</span> {
                                          [
                                            ...Object.entries(record.details.physicalExam.bodySystem)
                                              .filter(([k, v]) => v === true && k !== 'Other' && k !== 'OtherDetail')
                                              .map(([k]) => k),
                                            record.details.physicalExam.bodySystem.OtherDetail
                                          ].filter(Boolean).join(", ")
                                        }</p>
                                      )}
                                      {record.details.treatment && Object.keys(record.details.treatment).some(k => record.details.treatment[k]) && (
                                        <p><span className="font-bold text-gray-700">การรักษา:</span> {Object.keys(record.details.treatment).filter(k => record.details.treatment[k]).join(", ")}</p>
                                      )}
                                      {record.details.notes && <p><span className="font-bold text-gray-700">รายละเอียด:</span> {record.details.notes}</p>}
                                    </>
                                  )}
                                  
                                  {record.category === "นัดหมาย" && (
                                    <>
                                      <p><span className="font-bold text-gray-700">เวลา:</span> {record.details.time || "ไม่ระบุ"}</p>
                                      {record.details.notes && <p><span className="font-bold text-gray-700">รายละเอียด:</span> {record.details.notes}</p>}
                                    </>
                                  )}

                                  {record.category === "วัคซีน" && (
                                    <>
                                      {record.details.weight && <p><span className="font-bold text-gray-700">น้ำหนัก:</span> {record.details.weight} kg</p>}
                                      {record.details.lotNumber && <p><span className="font-bold text-gray-700">Lot No:</span> {record.details.lotNumber}</p>}
                                      {record.details.notes && <p><span className="font-bold text-gray-700">หมายเหตุ:</span> {record.details.notes}</p>}
                                      {record.details.nextAppointmentDate && <p><span className="font-bold text-gray-700">นัดครั้งต่อไป:</span> {record.details.nextAppointmentDate}</p>}
                                    </>
                                  )}

                                  {record.category === "กำจัดปรสิต" && (
                                    <>
                                      {record.details.weight && <p><span className="font-bold text-gray-700">น้ำหนัก:</span> {record.details.weight} kg</p>}
                                      <p><span className="font-bold text-gray-700">ยาที่ใช้:</span> {record.details.preventionName}</p>
                                      {record.details.notes && <p><span className="font-bold text-gray-700">หมายเหตุ:</span> {record.details.notes}</p>}
                                      {record.details.nextAppointmentDate && <p><span className="font-bold text-gray-700">นัดครั้งต่อไป:</span> {record.details.nextAppointmentDate}</p>}
                                    </>
                                  )}

                                  {record.category === "ผลแล็บ" && (
                                    <div className="mt-2">
                                      <a 
                                        href={record.details.fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-indigo-200 text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                                      >
                                        {record.details.fileType === "image" ? <ImageIcon size={14} /> : <FileText size={14} />}
                                        ดูไฟล์แนบ ({record.details.fileName})
                                      </a>
                                    </div>
                                  )}

                                  {record.category === "อาบน้ำตัดขน" && (
                                    <>
                                      <p><span className="font-bold text-gray-700">สถานะ:</span> {record.details.status || "รอดำเนินการ"}</p>
                                      {record.details.notes && <p><span className="font-bold text-gray-700">หมายเหตุ:</span> {record.details.notes}</p>}
                                    </>
                                  )}

                                  {record.category === "ฝากเลี้ยง" && (
                                    <>
                                      <p><span className="font-bold text-gray-700">Check Out:</span> {record.details.checkOut}</p>
                                      {record.details.food && <p><span className="font-bold text-gray-700">อาหาร:</span> {record.details.food}</p>}
                                    </>
                                  )}

                                  {record.category === "ชำระเงิน" && (
                                    <>
                                      <p><span className="font-bold text-gray-700">ยอดชำระ:</span> ฿ {new Intl.NumberFormat('th-TH').format(record.details.total_money || 0)}</p>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-sm text-gray-400 py-2 pl-6">
                            ไม่มีประวัติการเข้ารับบริการ
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-10 text-center">
          <p className="text-gray-500 font-bold">ไม่พบข้อมูลลูกค้า</p>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedReceipt(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900 mb-4">รายการในบิล #{selectedReceipt.receipt_number}</h3>
            {selectedReceipt.line_items && selectedReceipt.line_items.length > 0 ? (
              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-2">
                {selectedReceipt.line_items.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                    <span className="text-gray-700">{item.item_name} <span className="text-gray-400 text-xs ml-1">x{item.quantity}</span></span>
                    <span className="font-bold text-gray-900">฿ {new Intl.NumberFormat('th-TH').format(item.total_money)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4 text-center py-4 bg-gray-50 rounded-xl">ไม่พบรายการสินค้า <br/><span className="text-xs">(อาจเป็นบิลที่ผูกไว้ก่อนอัปเดตระบบ)</span></p>
            )}
            <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-lg mb-4">
              <span>ยอดรวม</span>
              <span className="text-mint-600">฿ {new Intl.NumberFormat('th-TH').format(selectedReceipt.total_money || 0)}</span>
            </div>
            <button 
              onClick={() => setSelectedReceipt(null)}
              className="w-full bg-gray-100 text-gray-800 font-bold py-3 rounded-xl hover:bg-gray-200 transition-colors"
            >
              ปิด
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
