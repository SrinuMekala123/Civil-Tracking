"use client";

import React, { useState, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, AlertCircle, KeyRound, ChevronDown, ChevronUp, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showDemoCredentials, setShowDemoCredentials] = useState(false);

  // If already logged in, redirect to root immediately
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setLocalError("Please enter your email address.");
      return;
    }
    if (!validateEmail(cleanEmail)) {
      setLocalError("Please enter a valid email address.");
      return;
    }
    if (!password) {
      setLocalError("Please enter your password.");
      return;
    }

    const success = await login(cleanEmail, password);
    if (success) {
      router.push("/");
    }
  };

  const handleFillCredentials = (demoEmail: string, demoPw: string) => {
    setEmail(demoEmail);
    setPassword(demoPw);
    setLocalError(null);
    clearError();
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-slate-950 overflow-hidden font-sans select-none px-4">
      {/* Background Glowing Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-indigo-600/10 blur-3xl animate-pulse duration-4000 pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] rounded-full bg-purple-600/10 blur-3xl animate-pulse duration-6000 pointer-events-none" />
      <div className="absolute top-1/2 left-2/3 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-pink-600/5 blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in slide-in-from-bottom-8 duration-500">
        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden">
          
          {/* Decorative Top Border Highlight */}
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

          {/* Logo / Title Area */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 transform hover:scale-105 transition-transform duration-300">
              <span className="text-white text-3xl font-extrabold tracking-tight">C</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mt-4 bg-gradient-to-r from-indigo-200 via-purple-200 to-pink-200 bg-clip-text text-transparent">
              Civil Tracking Portal
            </h1>
            <p className="text-slate-400 text-sm font-medium tracking-wide">
              Smart Tracking System
            </p>
          </div>

          {/* Error Message Panel */}
          {activeError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex gap-2.5 items-start text-red-400 text-xs animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-[13px]">Authentication Failed</p>
                <p className="mt-0.5 font-light leading-relaxed">{activeError}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-300 font-semibold text-xs tracking-wider uppercase ml-1">
                Email Address
              </Label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input
                  id="email"
                  type="text"
                  placeholder="md@brihaspathi.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (localError) setLocalError(null);
                  }}
                  disabled={isLoading}
                  className="pl-9 bg-slate-950/40 border-slate-800 text-white placeholder-slate-600 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500 rounded-xl h-11"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-300 font-semibold text-xs tracking-wider uppercase ml-1">
                Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (localError) setLocalError(null);
                  }}
                  disabled={isLoading}
                  className="pl-9 pr-10 bg-slate-950/40 border-slate-800 text-white placeholder-slate-600 focus-visible:ring-indigo-500/50 focus-visible:border-indigo-500 rounded-xl h-11"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors focus:outline-hidden"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:via-purple-500 hover:to-pink-500 text-white font-semibold py-5 rounded-xl transition-all duration-300 transform active:scale-98 shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none mt-2 h-11"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validating credentials...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In</span>
                </div>
              )}
            </Button>
          </form>

          {/* Authorized Users Section */}
          <div className="border-t border-slate-800/80 pt-4 mt-2">
            <button
              onClick={() => setShowDemoCredentials(!showDemoCredentials)}
              type="button"
              className="flex items-center justify-between w-full text-slate-400 hover:text-slate-200 text-xs font-semibold tracking-wider uppercase ml-1 focus:outline-hidden transition-colors"
            >
              <span className="flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                Authorized Users Guide
              </span>
              {showDemoCredentials ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showDemoCredentials && (
              <div className="mt-3 space-y-2 bg-slate-950/50 border border-slate-800/60 rounded-xl p-3 text-xs text-slate-400 divide-y divide-slate-800/40 animate-in slide-in-from-top-2 duration-200">
                <div className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">Super Admin account</span>
                    <button
                      onClick={() => handleFillCredentials("md@brihaspathi.com", "")}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline focus:outline-hidden"
                    >
                      Autofill Email
                    </button>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-slate-500">
                    Email: <span className="text-slate-400">md@brihaspathi.com</span>
                  </p>
                </div>
                <div className="pt-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-300">Admin account</span>
                    <button
                      onClick={() => handleFillCredentials("tejaswi@brihaspathi.com", "")}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 hover:underline focus:outline-hidden"
                    >
                      Autofill Email
                    </button>
                  </div>
                  <p className="mt-1 font-mono text-[11px] text-slate-500">
                    Email: <span className="text-slate-400">tejaswi@brihaspathi.com</span>
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
