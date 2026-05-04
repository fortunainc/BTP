"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { useClerk } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Shield
} from "lucide-react";

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { signOut } = useClerk();
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (!user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 flex items-center justify-center">
          <Shield className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-medium text-slate-200">{user.handle}</span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-slate-800 border border-slate-700 shadow-lg z-50">
          <div className="p-3 border-b border-slate-700">
            <p className="text-sm font-medium text-slate-200">{user.handle}</p>
            <p className="text-xs text-slate-400 capitalize">{user.userRole}</p>
          </div>
          <div className="p-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-md transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </Link>
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-md transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-slate-700 rounded-md transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}