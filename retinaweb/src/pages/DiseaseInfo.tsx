import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { diseaseData } from "../data/diseaseData";
import logo from "../assets/favicon.png";

const DiseaseInfo = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state && (location.state as any).from) || null;

  const handleBack = () => {
    if (from === "login") {
      navigate("/", { replace: true });
    } else if (from === "upload") {
      navigate("/upload", { replace: true });
    } else {
      navigate(-1);
    }
  };

  const backLabel =
    from === "login"
      ? "Back to Login"
      : from === "upload"
        ? "Back to Analysis"
        : "Back";

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F5F9] via-[#F8FAFC] to-white text-[#1E293B] relative overflow-hidden">
      {/* Enhanced background gradient blobs */}
      <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#2563EB]/10 to-[#06B6D4]/5 filter blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#06B6D4]/8 to-transparent filter blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-[#2563EB]/5 filter blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 bg-[#2563EB]/95 backdrop-blur-xl shadow-lg border-b border-white/10 sticky top-0">
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

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-all shadow-sm hover:shadow-md border border-white/20"
            >
              {backLabel}
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-[#06B6D4]/20 hover:bg-[#06B6D4]/30 text-white font-medium transition-all shadow-sm hover:shadow-md border border-white/20"
              onClick={() => navigate("/model-analytics")}
            >
              Model Analytics
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        {/* Page Title */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#1E293B] mb-3 bg-gradient-to-r from-[#1E293B] to-[#2563EB] bg-clip-text text-transparent">
            Retinal Disease Information
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Comprehensive overview of common retinal conditions detected by AI
            models
          </p>
        </div>

        {/* Disease Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {diseaseData.map((disease) => {
            const colorClass = disease.color
              ? `bg-gradient-to-r ${disease.color}`
              : "bg-gradient-to-r from-[#06B6D4] to-[#2563EB]";
            return (
              <div
                key={disease.id}
                className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/60 overflow-hidden hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col group"
              >
                {/* Color Bar */}
                <div className={`h-1.5 ${colorClass} transition-all`}></div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-[#1E293B] group-hover:text-[#2563EB] transition-colors">
                      {disease.name}
                    </h2>
                  </div>

                  <p className="text-slate-600 text-sm mb-6 leading-relaxed flex-grow">
                    {disease.description}
                  </p>

                  <div>
                    <h3 className="text-xs font-bold text-[#1E293B] uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-1 h-4 bg-[#06B6D4] rounded-full"></span>
                      Key Signs & Symptoms
                    </h3>
                    <ul className="space-y-2.5">
                      {disease.symptoms.map((symptom, index) => (
                        <li
                          key={index}
                          className="flex items-start text-sm text-slate-700 group/item hover:text-[#1E293B] transition-colors"
                        >
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-md bg-[#06B6D4]/10 text-[#06B6D4] flex-shrink-0 mr-2.5 mt-0.5 group-hover/item:bg-[#06B6D4]/20 transition-all">
                            <svg
                              className="w-3 h-3"
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
                          {symptom}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Banner */}
        <div className="mt-10 bg-white/80 backdrop-blur-xl border border-white/60 rounded-2xl p-8 shadow-lg">
          <div className="flex items-start gap-4">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-amber-50 text-amber-600 flex-shrink-0 shadow-sm">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#1E293B] mb-3">
                Important Information
              </h3>
              <p className="text-slate-600 mb-4 leading-relaxed">
                This dashboard is designed to assist healthcare professionals in
                analyzing fundus images. It should not be used as a standalone
                diagnostic tool. Always consult with an ophthalmologist or
                retinologist for professional medical advice and diagnosis.
              </p>
              <p className="text-sm text-slate-500 leading-relaxed">
                Early detection through regular eye exams can prevent or slow
                vision loss. If you experience any changes in vision, seek
                immediate medical attention.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 bg-white/50 backdrop-blur-sm border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500">
            © {new Date().getFullYear()} RetinaWeb • Research Tool Only • Not
            for Clinical Use
          </p>
        </div>
      </footer>
    </div>
  );
};

export default DiseaseInfo;
