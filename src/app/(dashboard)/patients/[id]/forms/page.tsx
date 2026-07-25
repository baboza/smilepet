"use client";

import { useState, use, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Printer, PenTool, CheckCircle2, FileText, Download } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/firebase/config";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";
import SignatureCanvas from 'react-signature-canvas';

export default function SmartFormsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = searchParams.get("petId");
  const unwrappedParams = use(params);
  const ownerId = unwrappedParams.id;

  const sigCanvas = useRef<SignatureCanvas>(null);

  const [formType, setFormType] = useState<"boarding" | "surgery" | null>(null);
  const [signature, setSignature] = useState<string | null>(null);
  const [isAccepted, setIsAccepted] = useState(false);

  // Surgery Specifics
  const [surgeryName, setSurgeryName] = useState("");
  
  // Boarding Specifics
  const [boardingDays, setBoardingDays] = useState("1");
  const [foodType, setFoodType] = useState("");

  const { data: owner } = useQuery({
    queryKey: ["ownerBasic", ownerId],
    queryFn: async () => {
      const d = await getDoc(doc(db, "owners", ownerId));
      return d.exists() ? d.data() : null;
    }
  });

  const { data: pet } = useQuery({
    queryKey: ["petBasic", petId],
    queryFn: async () => {
      if (!petId) return null;
      const d = await getDoc(doc(db, "pets", petId));
      return d.exists() ? d.data() : null;
    },
    enabled: !!petId
  });

  const handleClearSignature = () => {
    sigCanvas.current?.clear();
    setSignature(null);
  };

  const handleSaveSignature = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
      setSignature(sigCanvas.current.getTrimmedCanvas().toDataURL('image/png'));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!pet || !owner) return <div className="p-10 text-center text-gray-500">กำลังโหลด...</div>;

  const today = new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20 print:bg-white print:pb-0">
      
      {/* Non-Printable Header */}
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <Link href={`/patients/${ownerId}`} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-gray-900 leading-tight">สร้างแบบฟอร์ม</h1>
            <p className="text-xs text-rose-600 font-bold">สัตว์ป่วย: {pet.name}</p>
          </div>
        </div>
        {formType && (
          <button 
            onClick={handlePrint}
            disabled={!signature || !isAccepted}
            className="flex items-center gap-2 bg-rose-600 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Printer size={16} /> พิมพ์ฟอร์ม
          </button>
        )}
      </div>

      <div className="p-4 print:p-0">
        
        {/* Form Selector */}
        {!formType ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div 
              onClick={() => setFormType("surgery")}
              className="bg-white p-6 rounded-2xl border-2 border-transparent hover:border-rose-500 shadow-sm cursor-pointer transition-all hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">ใบยินยอมวางยา/ผ่าตัด</h3>
              <p className="text-sm text-gray-500">สำหรับทำศัลยกรรม วางยาสลบ ขูดหินปูน</p>
            </div>

            <div 
              onClick={() => setFormType("boarding")}
              className="bg-white p-6 rounded-2xl border-2 border-transparent hover:border-orange-500 shadow-sm cursor-pointer transition-all hover:-translate-y-1 group"
            >
              <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Home size={24} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">แบบฟอร์มฝากเลี้ยง</h3>
              <p className="text-sm text-gray-500">สัญญารับฝากดูแลสัตว์เลี้ยง (Hotel / Boarding)</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Editor Settings (Non-Printable) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm print:hidden">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-bold text-gray-900">ตั้งค่าแบบฟอร์ม</h2>
                <button onClick={() => setFormType(null)} className="text-sm text-gray-500 hover:text-gray-900">เปลี่ยนฟอร์ม</button>
              </div>

              {formType === "surgery" && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">ระบุชื่อการผ่าตัด / หัตถการ</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 rounded-xl border border-gray-200"
                    placeholder="เช่น ทำหมันตัวเมีย, ผ่าตัดนิ่ว"
                    value={surgeryName}
                    onChange={(e) => setSurgeryName(e.target.value)}
                  />
                </div>
              )}

              {formType === "boarding" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">จำนวนวันฝาก</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200"
                      value={boardingDays}
                      onChange={(e) => setBoardingDays(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">อาหารที่นำมา</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 rounded-xl border border-gray-200"
                      placeholder="เช่น Royal Canin 1 ถุง"
                      value={foodType}
                      onChange={(e) => setFoodType(e.target.value)}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Signature Area (Non-Printable) */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm print:hidden">
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><PenTool size={18}/> ลายเซ็นเจ้าของสัตว์</h2>
              
              <div className="mb-4">
                <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                  <input 
                    type="checkbox" 
                    className="mt-1 w-5 h-5 text-rose-600 rounded"
                    checked={isAccepted}
                    onChange={(e) => setIsAccepted(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700 leading-relaxed">
                    ข้าพเจ้า <span className="font-bold">{owner.name}</span> ได้อ่านและทำความเข้าใจข้อความในแบบฟอร์มด้านล่างนี้อย่างละเอียดถี่ถ้วนแล้ว และยินยอมตามเงื่อนไขทุกประการ
                  </span>
                </label>
              </div>

              {!signature ? (
                <div className="space-y-3">
                  <div className="border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 overflow-hidden">
                    <SignatureCanvas 
                      ref={sigCanvas}
                      canvasProps={{ className: "w-full h-40" }}
                      backgroundColor="#f9fafb"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleClearSignature} className="flex-1 py-2 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200">ลบใหม่</button>
                    <button onClick={handleSaveSignature} className="flex-1 py-2 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700">ยืนยันลายเซ็น</button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-4 bg-green-50 border border-green-200 rounded-xl">
                  <CheckCircle2 size={32} className="text-green-500 mb-2" />
                  <p className="font-bold text-green-700 mb-4">บันทึกลายเซ็นเรียบร้อยแล้ว</p>
                  <img src={signature} alt="Signature" className="h-20 mb-4 bg-white px-4 py-2 border rounded-xl" />
                  <button onClick={handleClearSignature} className="text-sm text-red-600 font-bold hover:underline">เซ็นใหม่</button>
                </div>
              )}
            </div>

            {/* A4 Printable Document */}
            <div className="bg-white w-full max-w-3xl mx-auto min-h-[1050px] p-10 sm:p-16 border border-gray-200 shadow-sm print:border-none print:shadow-none print:p-0">
              
              <div className="text-center mb-8">
                <h1 className="text-2xl font-black text-gray-900 mb-1">คลินิกรักษาสัตว์ SmilePet</h1>
                <p className="text-gray-600 text-sm">{owner.address || "123 ถนนเพชรเกษม แขวงหนองค้างพลู เขตหนองแขม กรุงเทพมหานคร 10160"}</p>
                <p className="text-gray-600 text-sm">โทร: 080-123-4567</p>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-gray-900 decoration-1 underline underline-offset-4">
                  {formType === "surgery" ? "หนังสือยินยอมให้ทำการศัลยกรรม และ/หรือ วางยาสลบ" : "หนังสือสัญญารับฝากดูแลสัตว์เลี้ยง"}
                </h2>
              </div>

              <div className="flex justify-end mb-6 text-sm text-gray-800">
                <p>วันที่ <span className="font-bold">{today}</span></p>
              </div>

              <div className="space-y-4 text-sm leading-loose text-gray-800">
                <p>
                  ข้าพเจ้า <span className="font-bold border-b border-dotted border-gray-400 px-4">{owner.name}</span> 
                  เบอร์โทรศัพท์ <span className="font-bold border-b border-dotted border-gray-400 px-4">{owner.phone}</span>
                </p>
                <p>
                  ในฐานะเจ้าของสัตว์เลี้ยงชื่อ <span className="font-bold border-b border-dotted border-gray-400 px-4">{pet.name}</span> 
                  ชนิด <span className="font-bold border-b border-dotted border-gray-400 px-4">{pet.species}</span> 
                  พันธุ์ <span className="font-bold border-b border-dotted border-gray-400 px-4">{pet.breed}</span> 
                  เพศ <span className="font-bold border-b border-dotted border-gray-400 px-4">{pet.sex}</span>
                  อายุ <span className="font-bold border-b border-dotted border-gray-400 px-4">{pet.birthDate}</span>
                </p>

                {formType === "surgery" && (
                  <>
                    <p className="mt-6 indent-8">
                      ข้าพเจ้าได้รับทราบคำอธิบายจากสัตวแพทย์เกี่ยวกับขั้นตอนการตรวจรักษา การวางยาสลบ และ/หรือการทำศัลยกรรม 
                      <span className="font-bold border-b border-dotted border-gray-400 px-4 mx-2">{surgeryName || "..................................................."}</span> 
                      ตลอดจนความเสี่ยงและภาวะแทรกซ้อนที่อาจเกิดขึ้นได้ในระหว่างหรือหลังการทำหัตถการ ซึ่งรวมถึงการแพ้ยา การติดเชื้อ หรือผลกระทบต่อระบบทางเดินหายใจและหัวใจ ซึ่งในกรณีเลวร้ายที่สุดอาจถึงแก่ชีวิต
                    </p>
                    <p className="indent-8">
                      ข้าพเจ้ายินยอมให้สัตวแพทย์ทำการรักษาและทำหัตถการดังกล่าว และให้อำนาจสัตวแพทย์ในการตัดสินใจทางการแพทย์ตามความเหมาะสม หากเกิดเหตุฉุกเฉินที่จำเป็นต้องช่วยชีวิตสัตว์เลี้ยงของข้าพเจ้า โดยข้าพเจ้าจะไม่เรียกร้องค่าเสียหายหรือดำเนินคดีทางกฎหมายใดๆ ต่อสัตวแพทย์และคลินิก
                    </p>
                  </>
                )}

                {formType === "boarding" && (
                  <>
                     <p className="mt-6 indent-8">
                      ตกลงนำสัตว์เลี้ยงมาฝากเลี้ยงไว้ที่คลินิกเป็นระยะเวลา <span className="font-bold border-b border-dotted border-gray-400 px-4 mx-1">{boardingDays}</span> วัน
                      โดยนำสิ่งของหรืออาหารติดมาด้วยคือ <span className="font-bold border-b border-dotted border-gray-400 px-4 mx-1">{foodType || "-"}</span>
                    </p>
                    <p className="indent-8">
                      ข้าพเจ้ายืนยันว่าสัตว์เลี้ยงของข้าพเจ้าได้รับวัคซีนป้องกันโรคติดต่อครบถ้วนและไม่มีประวัติการเจ็บป่วยร้ายแรงหรือโรคติดต่อ ในกรณีที่สัตว์เลี้ยงมีอาการป่วย หรือเกิดเหตุฉุกเฉินระหว่างฝากเลี้ยง ข้าพเจ้ายินยอมให้ทางคลินิกทำการรักษาเบื้องต้นและรับผิดชอบค่าใช้จ่ายที่เกิดขึ้นจริงตามที่คลินิกแจ้งให้ทราบ
                    </p>
                    <p className="indent-8">
                      หากข้าพเจ้าไม่มารับสัตว์เลี้ยงคืนภายในกำหนด และไม่สามารถติดต่อได้เกิน 7 วัน ข้าพเจ้ายินยอมให้ทางคลินิกดำเนินการกับสัตว์เลี้ยงตามความเหมาะสม และสละสิทธิ์การเรียกร้องใดๆ ทั้งสิ้น
                    </p>
                  </>
                )}
              </div>

              {/* Signatures */}
              <div className="mt-20 flex justify-between px-10">
                <div className="text-center">
                  <div className="h-16 flex items-end justify-center mb-2">
                    {signature ? (
                      <img src={signature} alt="Signature" className="h-full" />
                    ) : (
                      <span>(...................................................)</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-800">เจ้าของสัตว์เลี้ยง</p>
                </div>
                <div className="text-center">
                  <div className="h-16 flex items-end justify-center mb-2">
                    <span>(...................................................)</span>
                  </div>
                  <p className="text-sm text-gray-800">สัตวแพทย์ / พนักงานรับฝาก</p>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}
