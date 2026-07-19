"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/contexts/AuthContext";
import { auth, db } from "@/lib/firebase/config";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Stethoscope } from "lucide-react";

export default function LoginPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [clinicData, setClinicData] = useState<{name: string, logo: string} | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "clinic_settings", "demo-clinic"));
        if (docSnap.exists()) {
          setClinicData({
            name: docSnap.data().clinicName,
            logo: docSnap.data().logoUrl
          });
        }
      } catch (err) {}
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || "Failed to login with Google");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <Stethoscope size={40} className="text-mint-500 mb-4 animate-bounce" />
          <p className="text-gray-500 font-bold text-sm">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 md:p-6 lg:p-8">
      <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[600px] border border-gray-100">
        
        {/* Left Side: Image / Branding (Hidden on small screens) */}
        <div className="hidden md:flex md:w-1/2 relative bg-mint-50 flex-col justify-end p-12 overflow-hidden">
          {/* Background Image with Overlay */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: "url('https://images.unsplash.com/photo-1576201836106-db1758fd1c97?ixlib=rb-4.0.3&auto=format&fit=crop&w=1400&q=80')" 
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 via-gray-900/20 to-transparent" />
          
          <div className="relative z-10 text-white mt-auto">
            <h2 className="text-4xl font-bold mb-4 leading-tight">
              ดูแลเพื่อนรักของคุณ<br/>อย่างดีที่สุด
            </h2>
            <p className="text-gray-200 font-medium text-lg max-w-sm">
              ระบบบริหารจัดการคลินิกรักษาสัตว์ที่ครอบคลุม สะดวก และรวดเร็ว
            </p>
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white relative">
          
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-mint-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none"></div>

          <div className="relative z-10 max-w-sm mx-auto w-full">
            <div className="text-center flex flex-col items-center mb-10">
              {clinicData?.logo ? (
                <div className="w-24 h-24 mb-6 rounded-2xl overflow-hidden shadow-sm border border-gray-100 bg-white flex items-center justify-center p-2">
                  <img src={clinicData.logo} alt="Clinic Logo" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-gradient-to-br from-mint-400 to-blue-500 text-white rounded-2xl flex items-center justify-center mb-6 shadow-md">
                  <Stethoscope size={36} />
                </div>
              )}
              
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                ยินดีต้อนรับกลับมา!
              </h1>
              <p className="text-sm font-medium text-gray-500">
                เข้าสู่ระบบเพื่อจัดการข้อมูล {clinicData?.name || "SmilePet Clinic"}
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm text-center font-bold mb-6 animate-in fade-in slide-in-from-top-2">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 text-gray-700 px-4 py-3.5 rounded-2xl hover:bg-gray-50 hover:border-gray-200 transition-all focus:outline-none focus:ring-4 focus:ring-mint-500/20 active:scale-[0.98] group shadow-sm"
              >
                <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                  <path d="M1 1h22v22H1z" fill="none" />
                </svg>
                <span className="font-bold text-sm">เข้าสู่ระบบด้วย Google</span>
              </button>
            </div>

            <div className="mt-12 pt-6 border-t border-gray-100 flex flex-col items-center">
              <p className="text-xs font-bold text-gray-400">
                ระบบจัดการคลินิกสัตว์ประมวลผลบนคลาวด์
              </p>
              <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-300">
                <span>Secure</span> • <span>Fast</span> • <span>Reliable</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
