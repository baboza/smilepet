"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, User, Phone, Loader2, Cat } from "lucide-react";
import { create } from "zustand";
import { useRouter } from "next/navigation";
import { collection, query, getDocs, or, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface SearchStore {
  isOpen: boolean;
  openSearch: () => void;
  closeSearch: () => void;
}

export const useSearchStore = create<SearchStore>((set) => ({
  isOpen: false,
  openSearch: () => set({ isOpen: true }),
  closeSearch: () => set({ isOpen: false }),
}));

export function GlobalSearchModal() {
  const { isOpen, closeSearch } = useSearchStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setSearchTerm("");
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.length >= 2) {
        performSearch(searchTerm);
      } else {
        setResults([]);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async (term: string) => {
    setIsSearching(true);
    try {
      const [ownersSnap, petsSnap] = await Promise.all([
        getDocs(collection(db, "owners")),
        getDocs(collection(db, "pets"))
      ]);

      const lowerTerm = term.toLowerCase();
      
      const ownersList = ownersSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const petsList = petsSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

      const matchedOwners = ownersList.filter(o => 
        (o.name && o.name.toLowerCase().includes(lowerTerm)) || 
        (o.phone && o.phone.includes(term))
      ).map(o => ({
        type: 'owner',
        id: o.id,
        title: o.name,
        subtitle: o.phone || 'ไม่มีเบอร์โทร',
        href: `/patients/${o.id}`
      }));

      const matchedPets = petsList.filter(p => 
        p.name && p.name.toLowerCase().includes(lowerTerm)
      ).map(p => {
        const owner = ownersList.find(o => o.id === p.ownerId);
        return {
          type: 'pet',
          id: p.id,
          title: p.name,
          subtitle: owner ? `เจ้าของ: ${owner.name}` : 'ไม่ระบุเจ้าของ',
          href: owner ? `/patients/${owner.id}` : `/patients`
        };
      });

      const combined = [...matchedOwners, ...matchedPets].slice(0, 10);
      setResults(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4 sm:px-0">
      <div 
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" 
        onClick={closeSearch}
      />
      
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center border-b border-gray-100 p-3">
          <Search className="text-gray-400 mx-2" size={20} />
          <input
            ref={inputRef}
            type="text"
            className="flex-1 bg-transparent outline-none text-lg py-2 px-2 text-gray-900 placeholder-gray-400"
            placeholder="ค้นหาชื่อลูกค้า, ชื่อสัตว์เลี้ยง, เบอร์โทร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {isSearching ? (
            <div className="p-8 flex flex-col items-center justify-center text-gray-400">
              <Loader2 className="animate-spin mb-2" size={24} />
              <p className="text-sm">กำลังค้นหา...</p>
            </div>
          ) : results.length > 0 ? (
            <ul className="space-y-1">
              {results.map((result, idx) => (
                <li key={`${result.type}-${result.id}-${idx}`}>
                  <button
                    onClick={() => {
                      router.push(result.href);
                      closeSearch();
                    }}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 rounded-xl transition-colors text-left"
                  >
                    <div className={`p-2 rounded-full ${result.type === 'owner' ? 'bg-blue-50 text-blue-500' : 'bg-orange-50 text-orange-500'}`}>
                      {result.type === 'owner' ? <User size={18} /> : <Cat size={18} />}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{result.title}</p>
                      <p className="text-xs text-gray-500">{result.subtitle}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          ) : searchTerm.length >= 2 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              ไม่พบผลการค้นหาสำหรับ "{searchTerm}"
            </div>
          ) : (
            <div className="p-8 text-center text-gray-400 text-sm">
              พิมพ์อย่างน้อย 2 ตัวอักษรเพื่อค้นหา
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
