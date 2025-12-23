"use client";

import type React from "react";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "./Header";
import Footer from "./Footer";
import {
  Phone,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Shield,
  User,
  Mail,
  BookOpen,
  GraduationCap,
} from "lucide-react";

interface AuthModalProps {
  onSuccess: (user: any) => void;
}

export default function AuthModal({ onSuccess }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(false);
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // ---------------------------
  // validators & handlers (unchanged)
  // ---------------------------
  const validateRegistration = () => {
    if (name.trim().length < 2) return "Name must be at least 2 characters.";
    if (name.trim().length > 50) return "Name must be less than 50 characters.";
    if (!/^[a-zA-Z\s]+$/.test(name.trim()))
      return "Name can only contain letters and spaces.";
    if (!/^\d{10}$/.test(mobile))
      return "Mobile number must be exactly 10 digits.";
    if (!/^[6-9]\d{9}$/.test(mobile))
      return "Mobile number must start with 6, 7, 8, or 9.";
    return null;
  };

  const validateLogin = () => {
    if (!/^\d{10}$/.test(mobile))
      return "Mobile number must be exactly 10 digits.";
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateRegistration();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), mobile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      localStorage.setItem("user", JSON.stringify(data.user));
      onSuccess(data.user);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateLogin();
    if (err) {
      setError(err);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("user", JSON.stringify(data.user));
      onSuccess(data.user);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    if (isLogin) {
      handleLogin(e);
    } else {
      handleRegister(e);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setName("");
    setMobile("");
  };

  return (
    <>
      <Header />

      {/* Textbook-style background */}
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-4">
        <div className="container mx-auto max-w-6xl">
          <div className="min-h-screen flex items-center justify-center">
            <div className="w-full max-w-md mx-auto">
              <Card className="bg-white/95 backdrop-blur-sm border-2 border-amber-200 shadow-2xl rounded-xl overflow-hidden">

                {/* Textbook-style header with binding */}
                <div className="h-2 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-800"></div>

                <CardHeader className="bg-gradient-to-br from-amber-50 to-orange-50 p-6 sm:p-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                      {isLogin ? (
                        <BookOpen className="w-8 h-8 text-white" />
                      ) : (
                        <GraduationCap className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <CardTitle className="text-2xl sm:text-3xl font-bold text-amber-900 mb-2">
                      {isLogin ? "Welcome Back" : "Join Our Test Series"}
                    </CardTitle>
                    <p className="text-amber-700 font-medium text-base">
                      {isLogin
                        ? "Continue your learning journey"
                        : "Start your free government exam preparation"
                      }
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="p-6 sm:p-8 space-y-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {!isLogin && (
                      <div className="space-y-3">
                        <Label
                          htmlFor="name"
                          className="text-sm font-bold text-amber-800 uppercase tracking-wide"
                        >
                          Full Name
                        </Label>
                        <div className="relative group">
                          <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                            <User className="w-5 h-5 text-amber-600 group-focus-within:text-orange-600 transition-colors duration-300" />
                          </div>
                          <Input
                            id="name"
                            type="text"
                            placeholder="Enter your full name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-12 pr-4 py-3 bg-white border-2 border-amber-200 text-amber-900 placeholder-amber-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all duration-300 rounded-lg"
                            required={!isLogin}
                          />
                          <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 to-orange-50/50 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <Label
                        htmlFor="mobile"
                        className="text-sm font-bold text-amber-800 uppercase tracking-wide"
                      >
                        Mobile Number
                      </Label>
                      <div className="relative group">
                        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
                          <Phone className="w-5 h-5 text-amber-600 group-focus-within:text-orange-600 transition-colors duration-300" />
                        </div>
                        <Input
                          id="mobile"
                          type="tel"
                          placeholder="Enter your 10-digit mobile number"
                          value={mobile}
                          onChange={(e) => setMobile(e.target.value)}
                          className="pl-12 pr-4 py-3 bg-white border-2 border-amber-200 text-amber-900 placeholder-amber-400 focus:border-orange-400 focus:ring-2 focus:ring-orange-200 transition-all duration-300 rounded-lg"
                          required
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-50/50 to-orange-50/50 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 rounded-lg pointer-events-none" />
                      </div>
                    </div>

                    {error && (
                      <Alert className="border-2 border-red-200 bg-red-50/80 backdrop-blur-sm">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        <AlertDescription className="text-red-700 font-semibold ml-2">
                          {error}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-bold py-4 text-lg transition-all duration-300 hover:shadow-lg hover:shadow-amber-400/30 rounded-lg"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-3">
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          {isLogin ? "Signing In..." : "Creating Account..."}
                        </span>
                      ) : (
                        <span className="flex items-center justify-center gap-3">
                          <Shield className="w-5 h-5" />
                          {isLogin ? "Continue Test Series" : "Start Free Learning"}
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                        </span>
                      )}
                    </Button>
                  </form>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-amber-200" />
                    </div>
                    <div className="relative flex justify-center text-sm uppercase">
                      <span className="bg-white px-4 text-amber-700 font-medium">
                        OR
                      </span>
                    </div>
                  </div>

                  <Button
                    onClick={toggleMode}
                    variant="outline"
                    className="w-full border-2 border-amber-300 text-amber-700 bg-white hover:bg-amber-50 font-semibold py-3 transition-all duration-300 hover:shadow-lg hover:shadow-amber-300/20 rounded-lg"
                  >
                    <span className="flex items-center justify-center gap-3">
                      {isLogin ? "Create New Account" : "Already have an account? Login"}
                    </span>
                  </Button>

                  {/* Success indicator when form is valid */}
                  {((isLogin && mobile.length >= 10) ||
                    (!isLogin &&
                      name.trim().length >= 2 &&
                      mobile.length >= 10)) && (
                    <div className="flex items-center justify-center gap-2 text-green-600 bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-semibold">
                        Ready to proceed
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
