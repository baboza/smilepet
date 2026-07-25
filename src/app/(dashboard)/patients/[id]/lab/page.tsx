"use client";

import { useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Upload, File, Image as ImageIcon, CheckCircle2, Loader2, Microscope } from "lucide-react";
import Link from "next/link";
import { db, storage } from "@/lib/firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useQuery } from "@tanstack/react-query";
import { doc, getDoc } from "firebase/firestore";

export default function LabUploadPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const petId = searchParams.get("petId");
  const unwrappedParams = use(params);
  const ownerId = unwrappedParams.id;

  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const { data: pet } = useQuery({
    queryKey: ["petBasic", petId],
    queryFn: async () => {
      if (!petId) return null;
      const d = await getDoc(doc(db, "pets", petId));
      return d.exists() ? d.data() : null;
    },
    enabled: !!petId
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !petId) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const storageRef = ref(storage, `lab_results/${ownerId}/${petId}/${fileName}`);

      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on('state_changed', 
        (snapshot) => {
          const p = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setProgress(p);
        }, 
        (error) => {
          console.error("Upload error:", error);
          setUploading(false);
          alert("เกิดข้อผิดพลาดในการอัปโหลดไฟล์");
        }, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          await addDoc(collection(db, "lab_records"), {
            petId,
            ownerId,
            title,
            fileUrl: downloadURL,
            fileType: file.type.startsWith("image/") ? "image" : "document",
            fileName: file.name,
            createdAt: new Date().toISOString()
          });

          setUploading(false);
          router.push(`/patients/${ownerId}?success=lab`);
        }
      );
    } catch (error) {
      console.error(error);
      setUploading(false);
      alert("เกิดข้อผิดพลาด");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-20">
      <div className="bg-white px-4 py-4 shadow-sm sticky top-0 z-30 flex items-center gap-3">
        <Link href={`/patients/${ownerId}`} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-lg font-bold text-gray-900 leading-tight">เพิ่มผลแล็บ / X-Ray</h1>
          {pet && <p className="text-xs text-indigo-600 font-bold">สัตว์ป่วย: {pet.name}</p>}
        </div>
      </div>

      <div className="p-4">
        <form onSubmit={handleUpload} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">หัวข้อผลตรวจ <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
              placeholder="เช่น ผลเลือดก่อนผ่าตัด, ฟิล์มเอกซเรย์ขา"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">ไฟล์ (รูปภาพหรือ PDF) <span className="text-red-500">*</span></label>
            
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer relative">
              <div className="space-y-2 text-center">
                {file ? (
                  <div className="flex flex-col items-center">
                    {file.type.startsWith("image/") ? (
                      <ImageIcon className="mx-auto h-12 w-12 text-indigo-500" />
                    ) : (
                      <File className="mx-auto h-12 w-12 text-indigo-500" />
                    )}
                    <div className="text-sm font-bold text-indigo-600 mt-2">{file.name}</div>
                    <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <div className="flex text-sm text-gray-600">
                      <span className="relative cursor-pointer bg-white rounded-md font-bold text-indigo-600 hover:text-indigo-500 focus-within:outline-none px-2 py-1">
                        <span>คลิกเพื่อเลือกไฟล์</span>
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF ไม่เกิน 10MB</p>
                  </>
                )}
              </div>
              <input
                type="file"
                required
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*,application/pdf"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={uploading || !file || !title}
              className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all shadow-sm ${
                uploading || !file || !title
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]"
              }`}
            >
              {uploading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  กำลังอัปโหลด... {Math.round(progress)}%
                </>
              ) : (
                <>
                  <Microscope size={20} />
                  บันทึกผลแล็บ
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
