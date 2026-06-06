import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useNavigate } from "react-router-dom";
import logo from "../assets/favicon.png";

const ModelAnalytics: React.FC = () => {
  const navigate = useNavigate();

  // --- 1. Update the data array for the Bar Chart ---
  const data = [
    { name: "ResNet50", f1: 0.86, prec: 0.86, rec: 0.85, acc: 0.85 },
    { name: "DenseNet121", f1: 0.85, prec: 0.86, rec: 0.84, acc: 0.85 },
    { name: "ConvNeXt", f1: 0.87, prec: 0.88, rec: 0.86, acc: 0.85 },
    { name: "Swin Tiny", f1: 0.88, prec: 0.88, rec: 0.89, acc: 0.89 },
    { name: "EfficientNet-B3", f1: 0.86, prec: 0.88, rec: 0.86, acc: 0.85 },
    // --- NEW: Stacking Ensemble ---
    { name: "Stacking Ensemble", f1: 0.89, prec: 0.89, rec: 0.89, acc: 0.87 },
  ];

  // --- 2. Update the modelDetails array ---
  const modelDetails = [
    {
      name: "EfficientNetB3",
      role: "The High-Res Expert",
      icon: "🎯",
      accent: "#7C3AED",
      accentSoft: "#C4B5FD",
      specs: "300x300px | Compound Scaling",
      desc: "The most accurate model in our ensemble. It is trained on higher-resolution (300px) images to spot minute lesions and micro-aneurysms.",
      customization:
        "We modified the head with a 'Double Dropout' strategy (0.3 + 0.5) to prevent overfitting given the larger input size.",
    },
    {
      name: "Swin Transformer",
      role: "Geometric Context Expert",
      icon: "🧩",
      accent: "#14A39A",
      accentSoft: "#BFEAE6",
      specs: "224x224px | Shifted Windows",
      desc: "Uses Self-Attention to understand the geometry of the eye. It excels at identifying diseases that distort the retinal shape (e.g., Myopia).",
      customization:
        "Trained using 'Smart Cropping' to remove 90% of background noise, forcing the Transformer to focus solely on retinal structure.",
    },
    {
      name: "DenseNet121",
      role: "The Texture Specialist",
      icon: "🔬",
      accent: "#E08410",
      accentSoft: "#F3D3A2",
      specs: "224x224px | Feature Reuse",
      desc: "Connects every layer to every other layer. This makes it incredibly sensitive to subtle texture changes, such as the faint haziness of Cataracts.",
      customization:
        "Applied 'Tunnel Vision' (Zoomed-in crops) during training to force the model to look at texture rather than global shape.",
    },
    {
      name: "ConvNeXt Tiny",
      role: "The Modern Hybrid",
      icon: "🚀",
      accent: "#2F6FE8",
      accentSoft: "#B6C8F5",
      specs: "224x224px | Large Kernels",
      desc: "A modern CNN that behaves like a Transformer. It bridges the gap between the speed of a CNN and the accuracy of attention mechanisms.",
      customization:
        "Trained with aggressive regularization (Weight Decay 0.05) to prevent memorization, making it our most robust generalist.",
    },
    {
      name: "ResNet50",
      role: "The Baseline Anchor",
      icon: "⚓",
      accent: "#747B88",
      accentSoft: "#D6D9E0",
      specs: "224x224px | Residual Blocks",
      desc: "The industry standard for computer vision. We use ResNet50 as our 'Control' model to stabilize the ensemble's voting process.",
      customization:
        "Modified with a high Dropout rate (0.65) to act as a conservative voter, ensuring the system avoids rash predictions.",
    },
    // --- NEW: Stacking Ensemble card ---
    {
      name: "Stacking Ensemble",
      role: "The Supervisor (Meta-Learner)",
      icon: "🏆",
      accent: "#22A84B",
      accentSoft: "#BFE8C8",
      specs: "Logistic Regression | Dynamic Weighting",
      desc: "The final decision-maker. It uses a Logistic Regression meta-learner to analyze the confidence scores of all 5 sub-models and intelligently weighs their opinions to maximize precision.",
      customization:
        "Trained on the validation set to learn the specific reliability of each architecture for every individual disease class.",
    },
  ];

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

          <button
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-all shadow-sm hover:shadow-md border border-white/20"
            onClick={() => navigate(-1)}
          >
            ← Back
          </button>
        </div>
      </header>

      <main className="relative z-10 py-12 px-6">
        {/* Section A: Header */}
        <section className="max-w-4xl mx-auto mb-12 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 rounded-full bg-white/80 backdrop-blur-sm border border-white/60 text-[#06B6D4] text-sm font-semibold shadow-sm">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Architecture Breakdown
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-[#1E293B] to-[#2563EB] bg-clip-text text-transparent leading-tight pb-2">
            Heterogeneous Ensemble Strategy
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-3xl mx-auto">
            RETINAWEB doesn't rely on a single opinion. We leverage a team of{" "}
            <span className="text-[#2563EB] font-semibold">
              5 Specialized Architectures
            </span>
            , each optimized for a specific aspect of retinal diagnosis—from
            texture analysis to geometric context.
          </p>
        </section>

        {/* Section B: Performance Chart */}
        <section className="max-w-6xl mx-auto mb-16 bg-white/90 backdrop-blur-2xl rounded-2xl shadow-xl p-8 md:p-10 border border-white/60 hover:shadow-2xl transition-all duration-300">
          <div className="flex flex-col md:flex-row justify-between items-end mb-8">
            <div>
              <h2 className="text-2xl font-bold text-[#1E293B] mb-2">
                Performance Metrics
              </h2>
              <p className="text-slate-600 text-sm">
                Comparative analysis on the held-out Test Set
              </p>
            </div>
          </div>
          <div className="h-[400px] w-full bg-white/70 backdrop-blur-sm rounded-xl p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#cbd5e1"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={[0.8, 0.92]}
                  ticks={[0.8, 0.82, 0.84, 0.86, 0.88, 0.9, 0.92]}
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(37, 99, 235, 0.05)" }}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderColor: "#e2e8f0",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                  }}
                  itemStyle={{ fontSize: "13px", color: "#1e293b" }}
                  formatter={(value: number) => `${(value * 100).toFixed(2)}%`}
                />
                <Legend wrapperStyle={{ fontSize: 14, color: "#1e293b" }} />
                <Bar
                  dataKey="f1"
                  name="F1-Score"
                  fill="#10B981"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={50}
                />
                <Bar
                  dataKey="prec"
                  name="Precision"
                  fill="#2563EB"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={50}
                />
                <Bar
                  dataKey="rec"
                  name="Recall"
                  fill="#F59E42"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={50}
                />
                <Bar
                  dataKey="acc"
                  name="Accuracy"
                  fill="#06B6D4"
                  radius={[8, 8, 0, 0]}
                  maxBarSize={50}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Section C: Specialist Team Cards */}
        <section className="max-w-7xl mx-auto mb-12">
          <h2 className="text-3xl font-bold mb-10 text-center text-[#1E293B]">
            Meet the Specialist Team
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {modelDetails.map((model) => (
              <div
                key={model.name}
                role="button"
                tabIndex={0}
                onClick={() =>
                  navigate(`/model/${encodeURIComponent(model.name)}`)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ")
                    navigate(`/model/${encodeURIComponent(model.name)}`);
                }}
                className="group cursor-pointer bg-white/90 backdrop-blur-2xl border-t-4 border-transparent rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                style={{ borderTopColor: model.accent }}
              >
                {/* Background Glow */}
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 blur-3xl rounded-full group-hover:scale-150 transition-transform"
                  style={{
                    background: `radial-gradient(circle, ${model.accentSoft} 0%, transparent 72%)`,
                  }}
                />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <div className="text-4xl">{model.icon}</div>
                    <span
                      className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg backdrop-blur-sm border"
                      style={{
                        color: model.accent,
                        backgroundColor: `${model.accent}14`,
                        borderColor: `${model.accent}33`,
                      }}
                    >
                      {model.role}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-[#1E293B] mb-2 group-hover:text-[#2563EB] transition-colors">
                    {model.name}
                  </h3>
                  <div className="text-xs font-mono text-slate-600 mb-4 bg-slate-100/80 backdrop-blur-sm inline-block px-3 py-1.5 rounded-lg border border-slate-200/60">
                    {model.specs}
                  </div>
                  <p className="text-slate-700 text-sm mb-4 leading-relaxed">
                    {model.desc}
                  </p>
                  <div className="pt-4 border-t border-slate-200/60">
                    <p className="text-xs text-slate-600 leading-relaxed">
                      <span
                        className="font-semibold"
                        style={{ color: model.accent }}
                      >
                        Customization:
                      </span>{" "}
                      {model.customization}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
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

export default ModelAnalytics;
