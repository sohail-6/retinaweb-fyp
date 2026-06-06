import React, { useLayoutEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../assets/favicon.png";

const normalizeModelName = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, "");

const modelArtifacts: Record<string, { prefix: string; f1Image?: string }> = {
  resnet50: { prefix: "resnet_50" },
  densenet121: {
    prefix: "densenet_121",
    f1Image: "/images/densenet_121_per_class_f1.png",
  },
  convnexttiny: { prefix: "convnext_tiny" },
  swintransformer: { prefix: "swin_tiny" },
  swintiny: { prefix: "swin_tiny" },
  efficientnetb3: { prefix: "efficientnet_b3" },
  stackingensemble: { prefix: "ensemble" },
};

const getArtifacts = (modelName: string) => {
  const artifact =
    modelArtifacts[normalizeModelName(modelName)] ?? modelArtifacts.resnet50;

  return [
    {
      key: "confusion",
      title: "Confusion Matrix",
      src: `/images/${artifact.prefix}_confusion_matrices.png`,
    },
    {
      key: "roc",
      title: "ROC Curves",
      src: `/images/${artifact.prefix}_roc_curves.png`,
    },
    {
      key: "f1",
      title: "F1 Scores",
      src: artifact.f1Image ?? `/images/${artifact.prefix}_per_class_f1.png`,
    },
  ];
};

const ModelDetail: React.FC = () => {
  const navigate = useNavigate();
  const { name } = useParams<{ name: string }>();
  const title = name ? decodeURIComponent(name) : "Model";
  const images = getArtifacts(title);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F5F9] via-[#F8FAFC] to-white text-[#1E293B] relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#2563EB]/10 to-[#06B6D4]/5 filter blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#06B6D4]/8 to-transparent filter blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-[#2563EB]/5 filter blur-3xl" />
      </div>

      <header className="relative z-10 bg-[#2563EB]/95 backdrop-blur-xl shadow-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img
                src={logo}
                alt="RETINAWEB Logo"
                className="w-10 h-10 object-contain rounded-lg"
              />
            </div>
            <span className="text-xl font-bold tracking-tight select-none text-white">
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
        <section className="max-w-5xl mx-auto text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
          <p className="text-slate-600">
            Detailed artifacts for the selected model.
          </p>
        </section>

        <section className="max-w-5xl mx-auto flex flex-col gap-8">
          {images.map((img) => (
            <div
              key={img.key}
              className="bg-white/90 rounded-2xl p-5 lg:p-6 shadow-md border border-white/60"
            >
              <div className="mb-4 flex items-center justify-between gap-4">
                <h3 className="text-lg font-semibold text-slate-900">
                  {img.title}
                </h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">
                  {title}
                </span>
              </div>

              <div className="w-full rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-4 overflow-hidden">
                <img
                  src={img.src}
                  alt={img.title}
                  className="w-full h-auto object-contain"
                  loading="lazy"
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Model: <span className="font-medium">{title}</span>
              </p>
            </div>
          ))}
        </section>

        <section className="max-w-6xl mx-auto mt-8">
          <div className="bg-white/90 rounded-xl p-4 shadow-md">
            <h2 className="text-lg font-semibold mb-2">Notes</h2>
            <ul className="list-disc pl-5 text-sm text-slate-600">
              <li>
                The heatmap is shown on the final results page, so this page
                focuses on the exported report artifacts.
              </li>
              <li>
                Each image should be an exported PNG/JPEG showing the requested
                metric for audits and reporting.
              </li>
              <li>
                Provenance (model version, dataset, timestamp) should be
                displayed alongside future real artifacts.
              </li>
            </ul>
          </div>
        </section>
      </main>

      <footer className="mt-16 py-6 bg-white/50 backdrop-blur-sm border-t border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <p className="text-center text-sm text-slate-500">
            © {new Date().getFullYear()} RetinaWeb • Research Tool Only • Not
            for Clinical Use for clinical use
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ModelDetail;
