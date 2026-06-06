import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "../lib/firebase"; // Ensure this path matches where you saved firebase.ts
import logo from "../assets/favicon.png";

const Login = () => {
  const navigate = useNavigate();

  // State for Firebase Auth
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // State for Forgot Password Modal
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Set persistence to session only
      await setPersistence(auth, browserSessionPersistence);
      // The Real Firebase Login Call
      await signInWithEmailAndPassword(auth, email, password);

      // On success, the AuthListener in App.tsx will detect the user change
      // But we can also force navigation here for immediate feedback
      navigate("/");
    } catch (err: any) {
      console.error("Login Error:", err);
      // Map Firebase error codes to user-friendly messages
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password.");
      } else if (err.code === "auth/too-many-requests") {
        setError("Too many failed attempts. Please try again later.");
      } else {
        setError("Failed to sign in. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError("");
    setResetSuccess("");
    setResetLoading(true);
    try {
      await sendPasswordResetEmail(auth, resetEmail);
      setResetSuccess("Password reset email sent. Please check your inbox.");
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setResetError("No user found with this email.");
      } else if (err.code === "auth/invalid-email") {
        setResetError("Invalid email address.");
      } else {
        setResetError("Failed to send reset email. Try again.");
      }
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F5F9] via-[#F8FAFC] to-white text-[#1E293B] relative overflow-hidden">
      {/* Enhanced background gradient blobs */}
      <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#2563EB] to-[#06B6D4]/5 filter blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#06B6D4]/8 to-transparent filter blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-[#2563EB]/5 filter blur-3xl" />
      </div>

      <header className="relative z-10 bg-[#2563EB]/95 backdrop-blur-xl shadow-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-white/20 rounded-lg blur-md"></div>
              <img
                src={logo}
                alt="RETINAWEB Logo"
                className="w-10 h-10 object-contain rounded-lg relative z-10"
              />
            </div>
            <span
              className="text-xl font-bold tracking-tight select-none text-white drop-shadow-sm"
              style={{
                fontFamily: "'Inter', 'Roboto', 'Segoe UI', sans-serif",
              }}
            >
              RETINAWEB
            </span>
          </div>
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-80px)] items-center justify-center px-6 py-16 relative z-10">
        <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Information */}
          <div className="order-2 lg:order-1 flex flex-col gap-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-10 shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-300">
              <h2 className="text-3xl font-bold leading-tight text-[#1E293B] mb-4 bg-gradient-to-r from-[#1E293B] to-[#2563EB] bg-clip-text text-transparent">
                Secure, fast retinal analysis
              </h2>
              <p className="text-slate-600 leading-relaxed">
                Upload fundus images and compare model predictions with
                interactive visualizations and confidence insights.
              </p>

              <ul className="mt-8 space-y-4 text-sm text-slate-700">
                <li className="flex items-start gap-4 group">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#06B6D4]/20 to-[#06B6D4]/10 text-[#06B6D4] flex-shrink-0 mt-0.5 shadow-sm group-hover:shadow-md transition-all">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="group-hover:text-[#1E293B] transition-colors">
                    Real-time model comparison across multiple architectures
                  </span>
                </li>
                <li className="flex items-start gap-4 group">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#06B6D4]/20 to-[#06B6D4]/10 text-[#06B6D4] flex-shrink-0 mt-0.5 shadow-sm group-hover:shadow-md transition-all">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="group-hover:text-[#1E293B] transition-colors">
                    Attention heatmaps and consensus analysis charts
                  </span>
                </li>
                <li className="flex items-start gap-4 group">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#06B6D4]/20 to-[#06B6D4]/10 text-[#06B6D4] flex-shrink-0 mt-0.5 shadow-sm group-hover:shadow-md transition-all">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                  <span className="group-hover:text-[#1E293B] transition-colors">
                    Exportable reports for clinical documentation
                  </span>
                </li>
              </ul>
            </div>

            <div className="text-sm text-slate-500 px-2 bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-slate-200/50">
              <p className="leading-relaxed">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-xs font-bold mr-2">
                  i
                </span>
                RETINAWEB is a research tool for educational and experimental
                purposes only. This platform is not a medical device and should
                not be used for clinical diagnosis.
              </p>
            </div>
          </div>

          {/* Right: Login Form */}
          <div className="order-1 lg:order-2">
            <div className="bg-white/90 backdrop-blur-2xl rounded-2xl p-10 shadow-2xl border border-white/60 hover:shadow-3xl transition-all duration-300">
              <h3 className="text-2xl font-bold mb-2 text-[#1E293B]">
                Sign in to your account
              </h3>
              <p className="text-sm text-slate-600 mb-8">
                Secure access for clinicians and researchers.
              </p>

              {/* ERROR ALERT */}
              {error && (
                <div className="mb-6 p-4 bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-xl flex items-start gap-3 shadow-sm">
                  <svg
                    className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="doctor@hospital.com"
                    className="w-full rounded-xl px-4 py-3.5 bg-white/70 backdrop-blur-sm border border-slate-300 placeholder:text-slate-400 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent focus:bg-white transition-all shadow-sm hover:shadow-md"
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1E293B] mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl px-4 py-3.5 bg-white/70 backdrop-blur-sm border border-slate-300 placeholder:text-slate-400 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent focus:bg-white transition-all shadow-sm hover:shadow-md"
                    autoComplete="current-password"
                    required
                  />
                </div>

                <div className="flex items-center justify-between text-sm">
                  <button
                    type="button"
                    className="text-[#2563EB] hover:text-[#1E40AF] font-medium transition-colors hover:underline decoration-2 underline-offset-2"
                    onClick={() => {
                      setShowResetModal(true);
                      setResetEmail("");
                      setResetError("");
                      setResetSuccess("");
                    }}
                  >
                    Forgot password?
                  </button>
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl px-5 py-3.5 bg-gradient-to-r from-[#2563EB] to-[#1E40AF] text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-3">
                        <svg
                          className="animate-spin h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Signing in...
                      </span>
                    ) : (
                      "Sign In"
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-8 text-center text-sm text-slate-600">
                <span>
                  Don't have an account?{" "}
                  <button
                    className="text-[#2563EB] hover:text-[#1E40AF] font-semibold transition-colors hover:underline decoration-2 underline-offset-2"
                    onClick={() => navigate("/signup")}
                  >
                    Sign up
                  </button>
                </span>
              </div>
            </div>

            {/* Footer note */}
            <div className="mt-6 text-center text-xs text-slate-500 bg-white/50 backdrop-blur-sm rounded-lg py-3 px-4">
              <span>
                © {new Date().getFullYear()} RetinaWeb • Research Tool Only
              </span>
            </div>
          </div>
        </div>

        {/* Forgot Password Modal */}
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-md">
            <div className="bg-white/95 backdrop-blur-2xl rounded-2xl p-8 shadow-2xl border border-white/60 w-full max-w-md relative mx-4 animate-in fade-in zoom-in duration-200">
              <button
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors hover:bg-slate-100 rounded-lg p-1"
                onClick={() => setShowResetModal(false)}
                aria-label="Close"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              <h4 className="text-xl font-bold mb-2 text-[#1E293B]">
                Reset Password
              </h4>
              <p className="text-sm text-slate-600 mb-6">
                Enter your email address and we'll send you a link to reset your
                password.
              </p>
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="your.email@hospital.com"
                  className="w-full rounded-xl px-4 py-3.5 bg-white/70 backdrop-blur-sm border border-slate-300 placeholder:text-slate-400 text-[#1E293B] focus:outline-none focus:ring-2 focus:ring-[#2563EB] focus:border-transparent focus:bg-white transition-all shadow-sm hover:shadow-md"
                  required
                  autoFocus
                />
                {resetError && (
                  <div className="p-3 bg-red-50/90 backdrop-blur-sm border border-red-200 rounded-lg shadow-sm">
                    <p className="text-sm text-red-700">{resetError}</p>
                  </div>
                )}
                {resetSuccess && (
                  <div className="p-3 bg-emerald-50/90 backdrop-blur-sm border border-emerald-200 rounded-lg shadow-sm">
                    <p className="text-sm text-emerald-700">{resetSuccess}</p>
                  </div>
                )}
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full rounded-xl px-5 py-3 bg-gradient-to-r from-[#2563EB] to-[#1E40AF] text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {resetLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Login;
