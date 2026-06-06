import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import useStore from "../store/useStore";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import logo from "../assets/favicon.png";

const Upload = () => {
  const navigate = useNavigate();
  const { setFile, analyzeImage, isProcessing } = useStore();
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Clear any previous errors before sending the file to the backend
      setError(null);

      try {
        setFile(file);
        await analyzeImage(file);
        navigate("/results");
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Failed to analyze image. Please try again with a valid fundus image.";
        setError(message);
      }
    },
    [setFile, analyzeImage, navigate],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".gif"] },
    disabled: isProcessing,
  });

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
      <header className="relative z-10 bg-[#2563EB]/95 backdrop-blur-xl shadow-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
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
            <div className="hidden md:block border-l border-white/20 pl-6">
              <h1 className="text-base font-semibold text-white">
                Upload Fundus Image
              </h1>
              <p className="text-xs text-white/80">
                Select a retinal image for analysis
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/info", { state: { from: "upload" } })}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-all shadow-sm hover:shadow-md border border-white/20"
            >
              Disease Info
            </button>
            <button
              className="px-4 py-2 rounded-lg bg-[#06B6D4]/20 hover:bg-[#06B6D4]/30 text-white font-medium transition-all shadow-sm hover:shadow-md border border-white/20"
              onClick={() => navigate("/model-analytics")}
            >
              Analytics
            </button>
            <button
              onClick={async () => {
                await signOut(auth);
              }}
              className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white font-medium transition-all shadow-sm hover:shadow-md border border-red-400/30"
            >
              Logout
            </button>
            {isProcessing && (
              <div className="flex items-center text-sm text-white gap-2">
                <svg
                  className="w-5 h-5 animate-spin text-[#06B6D4]"
                  viewBox="0 0 24 24"
                  fill="none"
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
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
                Processing...
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="p-6 max-w-6xl mx-auto relative z-10 py-12">
        <div className="max-w-3xl mx-auto relative">
          {/* uploading overlay */}
          {isProcessing && (
            <div
              className="absolute inset-0 z-20 bg-slate-900/40 backdrop-blur-md rounded-2xl flex items-center justify-center"
              aria-live="polite"
            >
              <div className="text-center bg-white/95 backdrop-blur-2xl rounded-2xl p-8 shadow-2xl border border-white/60">
                <div className="w-16 h-16 border-4 border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#1E293B] font-semibold text-lg">
                  Running AI Models...
                </p>
                <p className="text-slate-600 text-sm mt-2">
                  Analyzing your retinal image
                </p>
              </div>
            </div>
          )}

          {/* Upload Card */}
          <div className="bg-white/90 backdrop-blur-2xl rounded-2xl shadow-2xl border border-white/60 p-10 hover:shadow-3xl transition-all duration-300">
            <h2 className="text-2xl font-bold text-[#1E293B] mb-6 bg-gradient-to-r from-[#1E293B] to-[#2563EB] bg-clip-text text-transparent">
              Upload Retinal Image
            </h2>

            {/* Drag & Drop Zone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-xl p-16 text-center cursor-pointer transition-all ${
                isDragActive
                  ? "border-[#2563EB] bg-[#2563EB]/5 shadow-lg"
                  : "border-slate-300 hover:border-[#2563EB]/60 hover:bg-[#2563EB]/5"
              } ${
                isProcessing ? "opacity-60 pointer-events-none" : ""
              } bg-white/70 backdrop-blur-sm`}
            >
              <input {...getInputProps()} />
              <div className="mb-6">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-[#2563EB]/20 to-[#06B6D4]/10 shadow-lg mb-4">
                  <svg
                    className="w-10 h-10 text-[#2563EB]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                </div>
              </div>
              <h3 className="text-xl font-bold text-[#1E293B] mb-3">
                {isDragActive
                  ? "Drop your image here"
                  : "Drag & drop your fundus image"}
              </h3>
              <p className="text-slate-600 mb-4">
                or click to browse from your computer
              </p>
              <div className="inline-flex items-center gap-2 px-6 py-2 rounded-lg bg-white/70 backdrop-blur-sm border border-slate-200/60 text-sm text-slate-500">
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                  />
                </svg>
                PNG, JPG, JPEG, GIF
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-50/90 border border-red-200 flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-red-800 text-sm">{error}</span>
              </div>
            )}

            {/* Info Section */}
            <div className="mt-8 bg-white/70 backdrop-blur-sm border border-slate-200/60 rounded-xl p-6">
              <h4 className="text-sm font-semibold text-[#1E293B] mb-4 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#06B6D4]/20 text-[#06B6D4] text-xs">
                  i
                </span>
                What happens next?
              </h4>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-3 group">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB]/20 to-[#2563EB]/10 text-[#2563EB] flex-shrink-0 font-bold text-xs shadow-sm group-hover:shadow-md transition-all">
                    1
                  </span>
                  <span className="group-hover:text-[#1E293B] transition-colors">
                    Your image will be analyzed by 5 ML models
                  </span>
                </li>
                <li className="flex items-start gap-3 group">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#06B6D4]/20 to-[#06B6D4]/10 text-[#06B6D4] flex-shrink-0 font-bold text-xs shadow-sm group-hover:shadow-md transition-all">
                    2
                  </span>
                  <span className="group-hover:text-[#1E293B] transition-colors">
                    Each model provides disease prediction & confidence scores
                  </span>
                </li>
                <li className="flex items-start gap-3 group">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gradient-to-br from-[#2563EB]/20 to-[#2563EB]/10 text-[#2563EB] flex-shrink-0 font-bold text-xs shadow-sm group-hover:shadow-md transition-all">
                    3
                  </span>
                  <span className="group-hover:text-[#1E293B] transition-colors">
                    Compare model performance metrics and visualizations
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Additional Info Card */}
          <div className="mt-6 text-sm text-slate-500 px-2 bg-white/50 backdrop-blur-sm rounded-lg p-4 border border-slate-200/50">
            <p className="leading-relaxed">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-600 text-xs font-bold mr-2">
                !
              </span>
              RETINAWEB is a research tool for educational purposes only.
              Results should not be used for clinical diagnosis.
            </p>
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

export default Upload;
