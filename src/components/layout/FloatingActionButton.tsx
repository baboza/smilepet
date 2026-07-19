"use client";

import { useState } from "react";
import { Plus, QrCode, Stethoscope, UserPlus, X } from "lucide-react";
import Link from "next/link";

export function FloatingActionButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container */}
      <div className="md:hidden fixed bottom-20 right-4 z-50 flex flex-col items-end space-y-4">
        
        {/* Actions Menu */}
        <div 
          className={`flex flex-col items-end space-y-3 transition-all duration-300 origin-bottom ${
            isOpen ? "scale-100 opacity-100 mb-4" : "scale-0 opacity-0 h-0"
          }`}
        >
          <Link 
            href="/opd/new" 
            className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <span className="text-sm font-medium text-gray-700">สร้าง OPD ใหม่</span>
            <div className="bg-blue-100 p-2 rounded-full text-blue-600">
              <Stethoscope size={18} />
            </div>
          </Link>
          
          <Link 
            href="/patients/register" 
            className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <span className="text-sm font-medium text-gray-700">ลงทะเบียนสัตว์</span>
            <div className="bg-mint-100 p-2 rounded-full text-mint-600">
              <UserPlus size={18} />
            </div>
          </Link>

          <button 
            className="flex items-center gap-3 bg-white px-4 py-2.5 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            <span className="text-sm font-medium text-gray-700">Scan QR Code</span>
            <div className="bg-purple-100 p-2 rounded-full text-purple-600">
              <QrCode size={18} />
            </div>
          </button>
        </div>

        {/* Main Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`h-14 w-14 rounded-full shadow-lg flex items-center justify-center text-white transition-all duration-300 ${
            isOpen ? "bg-red-500 rotate-135" : "bg-mint-500 hover:bg-mint-600 active:scale-95"
          }`}
        >
          {isOpen ? <X size={28} /> : <Plus size={28} strokeWidth={2.5} />}
        </button>
      </div>
    </>
  );
}
