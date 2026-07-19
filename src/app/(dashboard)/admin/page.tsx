"use client";

import { useState, useEffect } from "react";
import { Settings, Users, Save, ShieldAlert, Plus, X, Camera } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { clinicSettingsSchema, ClinicSettingsFormValues } from "@/features/admin/schemas/admin";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { db } from "@/lib/firebase/config";
import { doc, getDoc, setDoc, collection, getDocs, addDoc } from "firebase/firestore";
import { uploadImage } from "@/lib/firebase/storage";
import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";

export default function AdminPage() {
  const { user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"settings" | "staff">("settings");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [logoImageFile, setLogoImageFile] = useState<File | null>(null);
  const [logoImagePreview, setLogoImagePreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const { register: registerSettings, handleSubmit: handleSubmitSettings, reset: resetSettings } = useForm<ClinicSettingsFormValues>({
    resolver: zodResolver(clinicSettingsSchema),
    defaultValues: {
      clinicName: "",
      phone: "",
      address: ""
    }
  });

  const { register: registerStaff, handleSubmit: handleSubmitStaff, reset: resetStaff, formState: { isSubmitting: isSubmittingStaff } } = useForm({
    defaultValues: {
      name: "",
      email: "",
      role: "doctor"
    }
  });

  const { data: settingsData, isLoading: loadingSettings } = useQuery({
    queryKey: ["clinicSettings"],
    queryFn: async () => {
      const docSnap = await getDoc(doc(db, "clinic_settings", "demo-clinic"));
      if (docSnap.exists()) return docSnap.data();
      return null;
    },
    enabled: !!user
  });

  const { data: staffsList = [], isLoading: loadingStaffs, refetch: refetchStaffs } = useQuery({
    queryKey: ["staffs"],
    queryFn: async () => {
      const snap = await getDocs(collection(db, "users"));
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },
    enabled: activeTab === "staff" && !!user
  });

  useEffect(() => {
    if (settingsData) {
      resetSettings({
        clinicName: settingsData.clinicName || "",
        phone: settingsData.phone || "",
        address: settingsData.address || "",
        logoUrl: settingsData.logoUrl || ""
      });
      if (settingsData.logoUrl) {
        setLogoImagePreview(settingsData.logoUrl);
      }
    }
  }, [settingsData, resetSettings]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoImageFile(file);
      setLogoImagePreview(URL.createObjectURL(file));
    }
  };

  const onSubmitSettings = async (data: ClinicSettingsFormValues) => {
    setIsSubmitting(true);
    try {
      let logoUrl = data.logoUrl || "";
      if (logoImageFile) {
        const path = `settings/logo_${Date.now()}_${logoImageFile.name}`;
        logoUrl = await uploadImage(logoImageFile, path);
      }

      await setDoc(doc(db, "clinic_settings", "demo-clinic"), {
        ...data,
        logoUrl,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      alert("บันทึกข้อมูลเรียบร้อย");
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAddStaff = async (data: any) => {
    try {
      await addDoc(collection(db, "users"), {
        ...data,
        createdAt: new Date().toISOString()
      });
      alert(`เพิ่มสิทธิ์ให้ ${data.email} แล้ว\nผู้ใช้นี้สามารถนำอีเมลไป "สมัครสมาชิก" เพื่อเข้าใช้งานระบบได้ทันที`);
      setShowAddStaffModal(false);
      resetStaff();
      refetchStaffs();
    } catch (error) {
      console.error(error);
      alert("เกิดข้อผิดพลาดในการเพิ่มพนักงาน");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-gray-500 font-bold">
        กำลังตรวจสอบสิทธิ์...
      </div>
    );
  }

  if (user?.role !== "admin" && user?.role !== "owner" && user?.role !== "superadmin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center bg-gray-50">
        <ShieldAlert size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold">ไม่มีสิทธิ์เข้าถึง</h1>
        <p className="text-gray-500 mt-2">หน้านี้สงวนไว้สำหรับผู้ดูแลระบบเท่านั้น<br/>(Your Role: {user?.role || "ไม่มีสิทธิ์"})</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      
      {/* Top App Bar */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30">
        <h1 className="text-xl font-bold text-gray-900">จัดการระบบ (Admin)</h1>
      </div>

      {/* Tabs */}
      <div className="flex bg-white px-4 pt-2 border-b border-gray-200">
        <button 
          onClick={() => setActiveTab("settings")}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === "settings" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"}`}
        >
          <Settings size={16} />
          ตั้งค่าคลินิก
        </button>
        <button 
          onClick={() => setActiveTab("staff")}
          className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2 ${activeTab === "staff" ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400"}`}
        >
          <Users size={16} />
          พนักงาน & สิทธิ์
        </button>
      </div>

      <div className="p-4">
        {activeTab === "settings" && (
          <form onSubmit={handleSubmitSettings(onSubmitSettings)} className="space-y-4">
            <section className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
              <div className="flex items-center gap-2 text-gray-900 font-bold mb-2">
                <Settings size={18} className="text-blue-500" />
                <h2>ข้อมูลทั่วไปคลินิก</h2>
              </div>
              
              {loadingSettings ? (
                <div className="space-y-4 animate-pulse">
                  <div className="h-12 bg-gray-100 rounded-xl"></div>
                  <div className="h-12 bg-gray-100 rounded-xl"></div>
                  <div className="h-24 bg-gray-100 rounded-xl"></div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col items-center justify-center mb-6">
                    <label className="block text-sm font-bold text-gray-800 mb-2 w-full text-center">โลโก้คลินิก</label>
                    <div 
                      onClick={() => logoInputRef.current?.click()}
                      className="relative w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-colors"
                    >
                      {logoImagePreview ? (
                        <img src={logoImagePreview} alt="Clinic Logo" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Camera size={32} className="text-gray-400 mb-2" />
                          <span className="text-xs text-gray-500 font-medium">เพิ่มรูปภาพ</span>
                        </>
                      )}
                    </div>
                    <input type="file" ref={logoInputRef} onChange={handleLogoChange} accept="image/*" className="hidden" />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">ชื่อคลินิก</label>
                    <input 
                      type="text" 
                      {...registerSettings("clinicName")}
                      className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">เบอร์โทรติดต่อ</label>
                    <input 
                      type="tel" 
                      {...registerSettings("phone")}
                      className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">ที่อยู่คลินิก</label>
                    <textarea 
                      {...registerSettings("address")}
                      rows={3}
                      className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
                    />
                  </div>
                  
                  <div className="pt-2 border-t border-gray-100">
                    <button 
                      type="submit" 
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white font-bold py-3.5 rounded-xl hover:bg-gray-800 active:scale-[0.98] transition-all disabled:opacity-70 shadow-sm"
                    >
                      {isSubmitting ? "กำลังบันทึก..." : <><Save size={20}/> บันทึกการตั้งค่า</>}
                    </button>
                  </div>
                </>
              )}
            </section>
          </form>
        )}

        {activeTab === "staff" && (
          <div className="space-y-4">
            <button 
              onClick={() => setShowAddStaffModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-3.5 rounded-xl hover:bg-blue-600 active:scale-[0.98] transition-all shadow-sm"
            >
              <Plus size={20} />
              เพิ่มพนักงานใหม่
            </button>

            <div className="space-y-3">
              {loadingStaffs ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="bg-white p-4 rounded-2xl h-16 animate-pulse border border-gray-100"></div>
                ))
              ) : (
                staffsList.map((staff: any) => (
                  <div key={staff.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                      <h3 className="font-bold text-gray-900">{staff.name || "ไม่มีชื่อ"}</h3>
                      <p className="text-xs text-gray-500 font-bold">{staff.email}</p>
                    </div>
                    <div className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase ${
                      staff.role === 'admin' || staff.role === 'owner' ? 'bg-orange-100 text-orange-700 border border-orange-200' : 'bg-gray-100 text-gray-700 border border-gray-200'
                    }`}>
                      {staff.role}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Add Staff Modal */}
      {showAddStaffModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-gray-900 text-lg">เพิ่มพนักงานใหม่</h3>
              <button onClick={() => setShowAddStaffModal(false)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmitStaff(onAddStaff)} className="p-5 space-y-4">
              
              <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100 font-bold">
                * หลังจากเพิ่มสิทธิ์แล้ว พนักงานจะต้องใช้ Email นี้เพื่อไปกด &quot;สมัครสมาชิก&quot; ที่หน้าล็อคอิน
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">ชื่อ-สกุล</label>
                <input 
                  type="text" 
                  {...registerStaff("name", { required: true })}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  placeholder="เช่น หมอสมชาย"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">Email</label>
                <input 
                  type="email" 
                  {...registerStaff("email", { required: true })}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                  placeholder="อีเมลที่ใช้ล็อคอิน"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-800 mb-1">ตำแหน่ง (Role)</label>
                <select 
                  {...registerStaff("role")}
                  className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="doctor">สัตวแพทย์ (Doctor)</option>
                  <option value="admin">แอดมิน (Admin)</option>
                  <option value="reception">พนักงานต้อนรับ (Reception)</option>
                </select>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={isSubmittingStaff}
                  className="w-full bg-blue-500 text-white font-bold py-3.5 rounded-xl hover:bg-blue-600 active:scale-[0.98] transition-all disabled:opacity-70"
                >
                  {isSubmittingStaff ? "กำลังเพิ่ม..." : "เพิ่มพนักงาน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
