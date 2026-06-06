import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../store/useStore";
import type { ModelResult } from "../store/useStore";
import { signOut } from "firebase/auth";
import { auth } from "../lib/firebase";
import jsPDF from "jspdf";
import logo from "../assets/favicon.png";

const Results: React.FC = () => {
  const navigate = useNavigate();
  const {
    imagePreviewUrl,
    modelResults: rawResults,
    user,
    uploadedFile,
  } = useStore();
  const reportRef = useRef<HTMLDivElement>(null);

  // --- DATA SANITIZATION ---
  const modelResults: ModelResult[] = (rawResults || []).map((r: any) => ({
    name: r.name || "Unknown Model",
    confidence: r.confidence ?? r.accuracy ?? 0,
    f1: r.f1 ?? 0,
    accuracy: r.accuracy ?? 0,
    predictedDisease: r.predictedDisease || "Unknown",
    color: r.color || "#8884d8",
    heatmap: r.heatmap,
    is_reliable: r.is_reliable,
    threshold: r.threshold,
    breakdown: r.breakdown || [],
  }));

  const ENSEMBLE_NAMES = ["Ensemble (Final)", "Ensemble (Stacking)"];
  const isEnsembleModel = (name?: string) =>
    !!name && ENSEMBLE_NAMES.includes(name);

  // --- ENSEMBLE CARD EXTRACTION ---
  const ensembleCard = modelResults.find((m) => isEnsembleModel(m.name));
  const baseModelResults = modelResults.filter((m) => !isEnsembleModel(m.name));

  // UI State
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [activeTab, setActiveTab] = useState<"predictions" | "consensus">(
    "predictions",
  );
  const [mounted, setMounted] = useState(false);
  // Default to ensemble model for left column
  const [selectedModelName, setSelectedModelName] = useState<string | null>(
    ensembleCard?.name || null,
  );

  useEffect(() => {
    setMounted(true);
    // Always default to ensemble on mount
    setSelectedModelName(ensembleCard?.name || null);
  }, [ensembleCard?.name]);

  // --- BEST MODEL LOGIC (unchanged, but now only among base models) ---
  const bestModel =
    baseModelResults.length > 0
      ? baseModelResults.reduce(
          (prev, current) =>
            prev.confidence > current.confidence ? prev : current,
          baseModelResults[0],
        )
      : null;

  // --- ACTIVE MODEL LOGIC: always show ensemble if selected, else fallback ---
  const activeModel = selectedModelName
    ? modelResults.find((m) => m.name === selectedModelName) ||
      ensembleCard ||
      bestModel
    : ensembleCard || bestModel;

  // --- PDF GENERATION HANDLER ---
  const handleDownloadPDF = async () => {
    // --- PROFESSIONAL CLINICAL PDF DESIGN ---
    const brand = "#0f4c81";
    const accent = "#0ea5a5";
    const slate = "#334155";
    const muted = "#64748b";
    const border = "#cbd5e1";
    const pageBg = "#f8fafc";

    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });

    const pageHeight = 842;
    const marginX = 32;
    const pageWidth = 595;
    const contentWidth = pageWidth - marginX * 2;
    const diagnosis =
      ensembleCard?.predictedDisease ||
      bestModel?.predictedDisease ||
      "Unknown";
    const diagnosisConfidence =
      ensembleCard?.confidence ?? bestModel?.confidence ?? 0;

    const drawPageBackground = () => {
      doc.setFillColor(pageBg);
      doc.rect(0, 0, pageWidth, pageHeight, "F");
    };

    const drawHeader = () => {
      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      doc.setFillColor(brand);
      doc.roundedRect(marginX, 24, contentWidth, 58, 10, 10, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor("#ffffff");
      doc.text("RETINAWEB Clinical AI Report", marginX + 16, 54);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor("#e2e8f0");
      doc.text(
        `Generated: ${dateStr} ${timeStr}`,
        pageWidth - marginX - 16,
        46,
        {
          align: "right",
        },
      );
      doc.text("For decision support only", pageWidth - marginX - 16, 62, {
        align: "right",
      });
    };

    const drawFooter = () => {
      doc.setDrawColor(border);
      doc.setLineWidth(0.8);
      doc.line(marginX, pageHeight - 52, pageWidth - marginX, pageHeight - 52);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(muted);
      doc.text(
        "Disclaimer: AI-assisted output only. This report is not a standalone diagnosis and must be interpreted by a qualified clinician.",
        pageWidth / 2,
        pageHeight - 34,
        { align: "center", maxWidth: contentWidth },
      );
    };

    const addNewPage = () => {
      doc.addPage();
      drawPageBackground();
      drawHeader();
      drawFooter();
      return 106;
    };

    const ensurePageSpace = (currentY: number, neededHeight: number) => {
      const bottomLimit = pageHeight - 76;
      return currentY + neededHeight > bottomLimit ? addNewPage() : currentY;
    };

    const sectionTitle = (title: string, currentY: number) => {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(brand);
      doc.text(title, marginX, currentY);
      return currentY + 12;
    };

    drawPageBackground();
    drawHeader();
    drawFooter();

    let y = 108;

    // Patient + clinician metadata
    const patientRef = uploadedFile?.name
      ? `Patient Ref: ${uploadedFile.name}`
      : "";
    const userStr = user?.email ? `Clinician: ${user.email}` : "";
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(slate);
    if (patientRef) doc.text(patientRef, marginX, y);
    if (userStr) doc.text(userStr, pageWidth - marginX, y, { align: "right" });

    // Executive summary card
    y += 18;
    y = ensurePageSpace(y, 92);
    doc.setFillColor(236, 253, 252);
    doc.setDrawColor("#99f6e4");
    doc.roundedRect(marginX, y, contentWidth, 82, 10, 10, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(slate);
    doc.text(
      isEnsembleModel(ensembleCard?.name)
        ? "Final Diagnosis (Stacking Ensemble)"
        : "Final Diagnosis",
      marginX + 16,
      y + 24,
    );
    doc.setFontSize(21);
    doc.setTextColor(brand);
    doc.text(diagnosis, marginX + 16, y + 52, { maxWidth: contentWidth - 180 });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(accent);
    doc.text(
      `Confidence: ${(diagnosisConfidence * 100).toFixed(1)}%`,
      pageWidth - marginX - 16,
      y + 28,
      { align: "right" },
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(slate);
    doc.text(
      "Base model outputs and per-class probabilities are included below as supporting evidence.",
      marginX + 16,
      y + 70,
      { maxWidth: contentWidth - 32 },
    );

    // Secondary predictions summary
    const normalizedDiagnosis = diagnosis.replace(" (?)", "").trim();
    const normalizedBasePredictions = baseModelResults.map((m) =>
      m.predictedDisease.replace(" (?)", "").trim(),
    );

    const basePredictionCounts = normalizedBasePredictions.reduce(
      (acc, label) => {
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const otherDiseases = Object.entries(basePredictionCounts)
      .filter(([disease]) => disease !== normalizedDiagnosis)
      .sort((a, b) => b[1] - a[1])
      .map(([disease, count]) => `${disease} (${count})`);

    y += 100;
    if (otherDiseases.length > 0) {
      y = ensurePageSpace(y, 34);
      doc.setFillColor(255, 251, 235);
      doc.setDrawColor("#fcd34d");
      doc.roundedRect(marginX, y, contentWidth, 26, 6, 6, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor("#92400e");
      doc.text(
        `Alternative base-model opinions: ${otherDiseases.join(", ")}`,
        marginX + 10,
        y + 17,
        {
          maxWidth: contentWidth - 20,
        },
      );
      y += 40;
    } else {
      y = ensurePageSpace(y, 30);
      doc.setFillColor(236, 253, 245);
      doc.setDrawColor("#86efac");
      doc.roundedRect(marginX, y, contentWidth, 24, 6, 6, "FD");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor("#166534");
      doc.text(
        "All base models are aligned with the final diagnosis.",
        marginX + 10,
        y + 16,
        {
          maxWidth: contentWidth - 20,
        },
      );
      y += 34;
    }

    // Low-confidence warning
    const anyLowConfidence = modelResults.some((m) => m.is_reliable === false);
    if (anyLowConfidence) {
      y = ensurePageSpace(y, 44);
      doc.setFillColor(254, 242, 242);
      doc.setDrawColor("#fca5a5");
      doc.roundedRect(marginX, y, contentWidth, 34, 6, 6, "FD");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor("#b91c1c");
      const lowConfidenceCount = modelResults.filter(
        (m) => m.is_reliable === false,
      ).length;
      doc.text(
        `Low-confidence predictions were detected in ${lowConfidenceCount} model(s). Clinical review is strongly recommended.`,
        marginX + 10,
        y + 21,
      );
      y += 48;
    }

    // --- DETAILED TABLE (PAGE 1) ---
    y = ensurePageSpace(y, 120);
    y += 6;
    y = sectionTitle("Model Predictions (Supporting Evidence)", y);

    const tableX = marginX;
    const colWidths = [120, 150, 90, 171];
    const baseRowHeight = 22;
    const headerHeight = 24;
    const tableWidth = colWidths.reduce((a, b) => a + b, 0);

    const drawTableHeader = (headerY: number) => {
      doc.setFillColor(226, 232, 240);
      doc.setDrawColor(border);
      doc.rect(tableX, headerY, tableWidth, headerHeight, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(slate);
      doc.text("Model", tableX + 8, headerY + 16);
      doc.text("Predicted Disease", tableX + 8 + colWidths[0], headerY + 16);
      doc.text(
        "Confidence",
        tableX + 8 + colWidths[0] + colWidths[1],
        headerY + 16,
      );
      doc.text(
        "Alternative Classes / Notes",
        tableX + 8 + colWidths[0] + colWidths[1] + colWidths[2],
        headerY + 16,
      );
    };

    let tableY = y + 8;
    drawTableHeader(tableY);
    tableY += headerHeight;

    // --- ABBREVIATION MAP ---
    const diseaseAbbr: Record<string, string> = {
      "Diabetic Retinopathy": "DR",
      Glaucoma: "G",
      Myopia: "MY",
      "Age-related Macular Degeneration": "AMD",
      Cataract: "CAT",
      "Epiretinal Membrane": "ERM",
      "Branch Retinal Vein Occlusion": "BRVO",
      "Hypertensive Retinopathy": "HTR",
      Retinitis: "RS",
      "Laser Scars": "LS",
      Normal: "Normal",
      BRVO: "BRVO",
      ERM: "ERM",
      HTR: "HTR",
      LS: "LS",
      RS: "RS",
      AMD: "AMD",
      CAT: "CAT",
      DR: "DR",
      G: "G",
      MY: "MY",
    };

    const abbr = (disease: string) =>
      diseaseAbbr[disease.trim()] ||
      diseaseAbbr[
        Object.keys(diseaseAbbr).find(
          (k) => k.toLowerCase() === disease.trim().toLowerCase(),
        ) || ""
      ] ||
      disease
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase();

    const rows = [...baseModelResults];
    if (ensembleCard) rows.push(ensembleCard);

    const normalizeDiseaseLabel = (label: string) =>
      label.replace(" (?)", "").trim().toLowerCase();

    rows.forEach((model, idx) => {
      let otherClasses = "";
      if (model.breakdown && model.breakdown.length > 1) {
        const predictedNormalized = normalizeDiseaseLabel(
          model.predictedDisease,
        );
        const seen = new Set<string>();
        otherClasses = [...model.breakdown]
          .sort((a, b) => b.score - a.score)
          .filter((b) => {
            const normalizedClass = normalizeDiseaseLabel(b.class);
            if (normalizedClass === predictedNormalized) return false;
            if (seen.has(normalizedClass)) return false;
            seen.add(normalizedClass);
            return true;
          })
          .slice(0, 2)
          .map((b) => `${abbr(b.class)} (${(b.score * 100).toFixed(1)}%)`)
          .join(", ");
      }

      const rowContext =
        model.is_reliable === false
          ? "Review needed: low confidence"
          : "Confidence acceptable";

      const notesText = isEnsembleModel(model.name)
        ? "Final ensemble meta-model result"
        : otherClasses
          ? `${otherClasses} | ${rowContext}`
          : rowContext;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      const noteLines = doc.splitTextToSize(notesText, colWidths[3] - 10);
      const dynamicRowHeight = Math.max(
        baseRowHeight,
        8 + noteLines.length * 9,
      );

      if (tableY + dynamicRowHeight > pageHeight - 120) {
        tableY = addNewPage() + 8;
        y = tableY;
        drawTableHeader(tableY);
        tableY += headerHeight;
      }

      if (model.is_reliable === false) {
        doc.setFillColor(255, 247, 237);
        doc.rect(tableX, tableY, tableWidth, dynamicRowHeight, "F");
      } else if (idx % 2 === 0) {
        doc.setFillColor(241, 245, 249);
        doc.rect(tableX, tableY, tableWidth, dynamicRowHeight, "F");
      }

      doc.setDrawColor(border);
      doc.rect(tableX, tableY, tableWidth, dynamicRowHeight);

      doc.setTextColor(slate);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.text(model.name, tableX + 8, tableY + 14, {
        maxWidth: colWidths[0] - 10,
      });
      doc.text(model.predictedDisease, tableX + 8 + colWidths[0], tableY + 14, {
        maxWidth: colWidths[1] - 10,
      });
      doc.text(
        `${(model.confidence * 100).toFixed(1)}%`,
        tableX + 8 + colWidths[0] + colWidths[1],
        tableY + 14,
        { maxWidth: colWidths[2] - 10 },
      );

      doc.setFontSize(8.5);
      doc.setTextColor(model.is_reliable === false ? "#9a3412" : muted);
      doc.text(
        noteLines,
        tableX + 8 + colWidths[0] + colWidths[1] + colWidths[2],
        tableY + 12,
        { lineHeightFactor: 1.1 },
      );

      tableY += dynamicRowHeight;
    });

    y = tableY + 16;

    // --- CLINICAL CONTEXT (PAGE 1) ---
    const followUpText =
      diagnosis.toLowerCase() === "normal"
        ? "Suggested follow-up: routine retinal screening in 6 to 12 months, or sooner if symptoms develop."
        : "Suggested follow-up: non-routine finding detected. Correlate clinically and consider specialist review within 1 to 4 weeks based on symptoms.";

    y = ensurePageSpace(y, 130);
    doc.setFillColor("#eef2ff");
    doc.setDrawColor("#c7d2fe");
    doc.roundedRect(marginX, y, contentWidth, 118, 8, 8, "FD");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor("#1e3a8a");
    doc.text("Clinical Context", marginX + 12, y + 18);

    const contextLineHeight = 12;
    let contextY = y + 36;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(slate);
    const contextParagraph1 = doc.splitTextToSize(
      "This report is generated from a single image snapshot. Consider patient symptoms, examination findings, and longitudinal history before final interpretation.",
      contentWidth - 24,
    );
    doc.text(contextParagraph1, marginX + 12, contextY, {
      lineHeightFactor: 1.2,
    });
    contextY += contextParagraph1.length * contextLineHeight + 4;

    const contextParagraph2 = doc.splitTextToSize(
      followUpText,
      contentWidth - 24,
    );
    doc.text(contextParagraph2, marginX + 12, contextY, {
      lineHeightFactor: 1.2,
    });
    contextY += contextParagraph2.length * contextLineHeight + 4;

    const contextParagraph3 = doc.splitTextToSize(
      "Recommended complementary tests when indicated: OCT, visual acuity, IOP measurement, and dilated fundus examination.",
      contentWidth - 24,
    );
    doc.text(contextParagraph3, marginX + 12, contextY, {
      lineHeightFactor: 1.2,
    });

    // --- VISUAL EVIDENCE (PAGE 2) ---
    const loadImageAsset = async (
      src: string,
    ): Promise<{ dataUrl: string; width: number; height: number } | null> => {
      try {
        return await new Promise<{
          dataUrl: string;
          width: number;
          height: number;
        }>((resolve, reject) => {
          const image = new window.Image();
          image.crossOrigin = "Anonymous";
          image.onload = () => {
            const maxDim = 1400;
            const scale = Math.min(
              1,
              maxDim / Math.max(image.width, image.height),
            );
            const canvas = document.createElement("canvas");
            canvas.width = image.width * scale;
            canvas.height = image.height * scale;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
              reject();
              return;
            }
            ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
            resolve({
              dataUrl: canvas.toDataURL("image/jpeg", 0.92),
              width: canvas.width,
              height: canvas.height,
            });
          };
          image.onerror = reject;
          image.src = src;
        });
      } catch {
        return null;
      }
    };

    const drawContainedImage = (
      asset: { dataUrl: string; width: number; height: number } | null,
      x: number,
      yPos: number,
      boxW: number,
      boxH: number,
    ) => {
      if (!asset) return false;
      const scale = Math.min(boxW / asset.width, boxH / asset.height);
      const drawW = asset.width * scale;
      const drawH = asset.height * scale;
      const drawX = x + (boxW - drawW) / 2;
      const drawY = yPos + (boxH - drawH) / 2;
      doc.addImage(asset.dataUrl, "JPEG", drawX, drawY, drawW, drawH);
      return true;
    };

    y = addNewPage();
    y = sectionTitle("Visual Evidence", y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(muted);
    doc.text(
      "All model heatmaps below are displayed in aspect-ratio preserving mode to avoid distortion.",
      marginX,
      y + 10,
    );

    const normalizeModelKey = (name: string) =>
      name.toLowerCase().replace(/[^a-z0-9]/g, "");

    const modelAssetMap = new Map<
      string,
      {
        name: string;
        predictedDisease: string;
        confidence: number;
        imageData: { dataUrl: string; width: number; height: number } | null;
      }
    >();

    await Promise.all(
      baseModelResults.map(async (model) => {
        modelAssetMap.set(normalizeModelKey(model.name), {
          name: model.name,
          predictedDisease: model.predictedDisease,
          confidence: model.confidence,
          imageData: model.heatmap ? await loadImageAsset(model.heatmap) : null,
        });
      }),
    );

    const findModelAsset = (candidates: string[]) => {
      for (const key of candidates) {
        const match = modelAssetMap.get(normalizeModelKey(key));
        if (match) return match;
      }
      return null;
    };

    const originalAsset = imagePreviewUrl
      ? await loadImageAsset(imagePreviewUrl)
      : null;

    const rowItems = [
      [
        {
          label: "Reference Fundus Image",
          predictedDisease: "",
          confidence: 0,
          imageData: originalAsset,
          isReference: true,
        },
        findModelAsset(["ConvNeXtTiny", "ConvNeXt Tiny", "ConvNextTiny"]),
      ],
      [
        findModelAsset([
          "EfficientNetB3",
          "EfficientNet-B3",
          "EfficientNet B3",
        ]),
        findModelAsset(["SwinTiny", "Swin Tiny", "Swin-Tiny"]),
      ],
      [
        findModelAsset(["ResNet50", "ResNet 50"]),
        findModelAsset(["DenseNet121", "DenseNet 121"]),
      ],
    ];

    const gap = 14;
    const cardWidth = (contentWidth - gap) / 2;
    const cardHeight = 194;
    const imageBoxHeight = 148;
    let rowY = y + 22;

    rowItems.forEach((row) => {
      rowY = ensurePageSpace(rowY, cardHeight + 8);

      row.forEach((item, index) => {
        const x = marginX + index * (cardWidth + gap);
        doc.setDrawColor(border);
        doc.setFillColor("#ffffff");
        doc.roundedRect(x, rowY, cardWidth, cardHeight, 8, 8, "FD");

        const hasImage = drawContainedImage(
          item?.imageData || null,
          x + 8,
          rowY + 8,
          cardWidth - 16,
          imageBoxHeight,
        );

        if (!hasImage) {
          doc.setFillColor("#f1f5f9");
          doc.roundedRect(
            x + 8,
            rowY + 8,
            cardWidth - 16,
            imageBoxHeight,
            6,
            6,
            "F",
          );
          doc.setFont("helvetica", "italic");
          doc.setFontSize(9.5);
          doc.setTextColor(muted);
          doc.text("Heatmap unavailable", x + cardWidth / 2, rowY + 82, {
            align: "center",
          });
        }

        const itemTitle = !item
          ? "Unavailable"
          : "isReference" in item
            ? item.label
            : item.name;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.setTextColor(slate);
        doc.text(itemTitle, x + 8, rowY + 172, {
          maxWidth: cardWidth - 16,
        });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(muted);
        if (item && !("isReference" in item && item.isReference)) {
          doc.text(
            `${item.predictedDisease} | ${(item.confidence * 100).toFixed(1)}%`,
            x + 8,
            rowY + 186,
            { maxWidth: cardWidth - 16 },
          );
        } else {
          doc.text(
            "Input scan used for all model inferences",
            x + 8,
            rowY + 186,
            {
              maxWidth: cardWidth - 16,
            },
          );
        }
      });

      rowY += cardHeight + 8;
    });

    y = rowY;

    doc.save("retina_analysis_report.pdf");
  };

  if (!imagePreviewUrl)
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-[#F1F5F9] via-[#F8FAFC] to-white">
        <div className="text-center bg-white/90 backdrop-blur-2xl rounded-2xl p-10 shadow-2xl border border-white/60">
          <p className="text-xl mb-4 text-[#1E293B]">No image loaded.</p>
          <button
            onClick={() => navigate("/upload")}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1E40AF] text-white font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            Go to Upload
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F1F5F9] via-[#F8FAFC] to-white text-[#1E293B] relative overflow-hidden font-sans">
      {/* Enhanced background gradient blobs */}
      <div aria-hidden className="absolute inset-0 -z-10 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-[#2563EB]/10 to-[#06B6D4]/5 filter blur-3xl animate-pulse"
          style={{ animationDuration: "8s" }}
        />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#06B6D4]/8 to-transparent filter blur-3xl" />
        <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-[#2563EB]/5 filter blur-3xl" />
      </div>

      <header className="relative z-10 bg-[#2563EB]/95 backdrop-blur-xl shadow-lg border-b border-white/10">
        <div className="max-w-7xl mx-auto px-8 py-5 flex items-center justify-between flex-wrap gap-4">
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
                Analysis Report
              </h1>
              <div className="flex items-center gap-2 text-xs text-white/80">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                AI Inference Complete
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => navigate("/info")}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-all shadow-sm hover:shadow-md border border-white/20 text-sm"
            >
              Disease Info
            </button>
            <button
              onClick={() => navigate("/model-analytics")}
              className="px-3 py-2 rounded-lg bg-[#06B6D4]/20 hover:bg-[#06B6D4]/30 text-white font-medium transition-all shadow-sm hover:shadow-md border border-white/20 text-sm"
            >
              Analytics
            </button>
            <button
              onClick={() => navigate("/upload")}
              className="px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium transition-all shadow-sm hover:shadow-md border border-white/20 text-sm"
            >
              New Image
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-white font-medium transition-all shadow-sm hover:shadow-md border border-white/20 text-sm"
            >
              Download PDF
            </button>
            <button
              onClick={async () => {
                await signOut(auth);
              }}
              className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-white font-medium transition-all shadow-sm hover:shadow-md border border-red-400/30 text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        ref={reportRef}
        className={`p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 transition-opacity duration-700 ${
          mounted ? "opacity-100" : "opacity-0"
        }`}
      >
        {/* Left Column (Visualizer) */}
        <section className="lg:col-span-5 space-y-6">
          <div className="bg-white/90 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-2xl p-6 relative group hover:shadow-3xl transition-all duration-300">
            {/* Heatmap Toggle - Positioned Outside Image */}
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-slate-700">Retinal Analysis</h4>
              <button
                onClick={() => setShowHeatmap(!showHeatmap)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg backdrop-blur-sm border transition-all shadow-sm ${
                  showHeatmap
                    ? "bg-[#06B6D4] border-[#06B6D4] text-white hover:bg-[#0891b2]"
                    : "bg-white/70 border-slate-300 text-slate-700 hover:bg-white"
                }`}
              >
                {showHeatmap ? "Hide Heatmap" : "Show Heatmap"}
              </button>
            </div>

            {/* Image Container */}
            <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60">
              {/* Original Image - Always Visible */}
              <img
                src={imagePreviewUrl}
                alt="Original Fundus"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Heatmap Overlay - Conditional */}
              {showHeatmap && activeModel?.heatmap ? (
                <img
                  src={activeModel.heatmap}
                  alt={`AI Heatmap from ${activeModel.name}`}
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-300"
                />
              ) : null}

              {/* No Heatmap Message - Only When Toggled On But Not Available */}
              {showHeatmap && !activeModel?.heatmap && (
                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
                  <p className="text-white text-sm font-medium text-center px-4">
                    No heatmap available for {activeModel?.name}
                  </p>
                </div>
              )}

              {/* Bottom Info Overlay */}
              <div className="absolute bottom-0 inset-x-0 p-6 pt-12 bg-gradient-to-t from-white/95 via-white/80 to-transparent">
                <p className="text-xs uppercase tracking-wider font-semibold mb-2 text-slate-500">
                  Analysis By
                </p>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-[#1E293B]">
                    {activeModel?.name || "Loading..."}
                  </h3>
                  {isEnsembleModel(activeModel?.name) && (
                    <span className="px-2 py-1 text-[9px] rounded-lg border font-bold bg-amber-100 text-amber-900 border-amber-200 whitespace-nowrap">
                      FINAL ENSEMBLE
                    </span>
                  )}
                  {activeModel?.name === bestModel?.name &&
                    !isEnsembleModel(activeModel?.name) && (
                      <span className="px-2 py-1 text-[9px] rounded-lg border font-bold bg-emerald-100 text-emerald-800 border-emerald-200 whitespace-nowrap">
                        BEST BASE MODEL
                      </span>
                    )}
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/90 backdrop-blur-xl rounded-xl p-4 border border-white/60 shadow-lg">
              <p className="text-xs mb-1 text-slate-500">Prediction</p>
              <p className="text-lg font-bold truncate text-[#1E293B]">
                {activeModel?.predictedDisease || "..."}
              </p>
              {activeModel && activeModel.is_reliable === false && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-amber-100 border-amber-200">
                  <span className="text-xs font-bold text-amber-700">
                    ⚠️ Low Confidence
                  </span>
                </div>
              )}
              {isEnsembleModel(activeModel?.name) && (
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border bg-amber-100 border-amber-200">
                  <span className="text-xs font-bold text-amber-700">
                    ★ Final Ensemble Diagnosis
                  </span>
                </div>
              )}
            </div>
            <div className="bg-white/90 backdrop-blur-xl rounded-xl p-4 border border-white/60 shadow-lg">
              <p className="text-xs mb-1 text-slate-500">Confidence</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-[#06B6D4]">
                  {activeModel?.confidence
                    ? (activeModel.confidence * 100).toFixed(1)
                    : 0}
                  %
                </p>
                {activeModel?.threshold !== undefined && (
                  <span className="text-xs text-slate-400">
                    (Thresh: {activeModel.threshold})
                  </span>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Right Column (Results Summary) */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex gap-1 p-1 rounded-xl border bg-white/80 backdrop-blur-sm border-white/60 w-fit shadow-sm">
            <button
              onClick={() => setActiveTab("predictions")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === "predictions"
                  ? "bg-white text-[#2563EB] shadow-md"
                  : "text-slate-600 hover:text-[#2563EB]"
              }`}
            >
              Model Predictions
            </button>
            <button
              onClick={() => setActiveTab("consensus")}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                activeTab === "consensus"
                  ? "bg-white text-[#2563EB] shadow-md"
                  : "text-slate-600 hover:text-[#2563EB]"
              }`}
            >
              Ensemble Result
            </button>
          </div>
          <div className="flex-1">
            {activeTab === "predictions" ? (
              <div className="grid grid-cols-1 gap-4">
                {/* ENSEMBLE CARD AT TOP */}
                {ensembleCard && (
                  <div
                    key={ensembleCard.name}
                    onClick={() => setSelectedModelName(ensembleCard.name)}
                    className="relative group cursor-pointer rounded-2xl border transition-all duration-300 bg-gradient-to-br from-amber-50 to-amber-100/50 border-amber-200 shadow-lg hover:shadow-xl hover:-translate-y-1 backdrop-blur-sm"
                  >
                    <div className="p-5">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: "#fbbf24" }}
                          ></div>
                          <h4 className="font-semibold text-lg text-amber-900">
                            {ensembleCard.name}
                          </h4>
                        </div>
                        <span className="px-2 py-1 text-[10px] font-bold rounded-lg bg-amber-200 text-amber-900 border border-amber-300">
                          FINAL ENSEMBLE
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-amber-800">
                          {ensembleCard.predictedDisease}
                        </span>
                        <span className="font-bold text-amber-900">
                          {(ensembleCard.confidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    {selectedModelName === ensembleCard.name &&
                      ensembleCard.breakdown && (
                        <div className="px-5 pb-5 pt-0 border-t border-amber-200 mt-2 animate-in slide-in-from-top-2 duration-300">
                          <p className="text-xs uppercase tracking-wider font-semibold py-3 text-amber-700">
                            Probability Breakdown
                          </p>
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {ensembleCard.breakdown.map((item, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 text-sm"
                              >
                                <div className="w-32 truncate text-amber-800">
                                  {item.class}
                                </div>
                                <div className="flex-1 h-2 bg-amber-200/50 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      item.is_selected
                                        ? "bg-amber-500"
                                        : "bg-amber-300"
                                    }`}
                                    style={{ width: `${item.score * 100}%` }}
                                  />
                                </div>
                                <div className="w-12 text-right font-mono text-xs text-amber-800">
                                  {(item.score * 100).toFixed(1)}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                )}
                {/* BASE MODELS BELOW */}
                {baseModelResults.map((model) => {
                  const isSelected = activeModel?.name === model.name;
                  const isBest = bestModel?.name === model.name;
                  return (
                    <div
                      key={model.name}
                      onClick={() => setSelectedModelName(model.name)}
                      className={`relative group cursor-pointer rounded-2xl border transition-all duration-300 bg-white/90 backdrop-blur-xl shadow-lg hover:shadow-xl hover:-translate-y-1 ${
                        isSelected
                          ? "border-[#2563EB] ring-2 ring-[#2563EB]/20"
                          : "border-white/60"
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: model.color }}
                            ></div>
                            <h4
                              className={`font-semibold text-lg ${
                                isSelected ? "text-[#2563EB]" : "text-slate-700"
                              }`}
                            >
                              {model.name}
                            </h4>
                          </div>
                          {isBest && (
                            <span className="px-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-200">
                              BEST MATCH
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-700">
                            {model.predictedDisease}
                          </span>
                          <span className="font-bold text-[#06B6D4]">
                            {(model.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      {isSelected && model.breakdown && (
                        <div className="px-5 pb-5 pt-0 border-t border-slate-200 mt-2 animate-in slide-in-from-top-2 duration-300">
                          <p className="text-xs uppercase tracking-wider font-semibold py-3 text-slate-600">
                            Probability Breakdown
                          </p>
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {model.breakdown.map((item, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-3 text-sm"
                              >
                                <div className="w-32 truncate text-slate-700">
                                  {item.class}
                                </div>
                                <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      item.is_selected
                                        ? "bg-[#06B6D4]"
                                        : "bg-slate-400"
                                    }`}
                                    style={{ width: `${item.score * 100}%` }}
                                  />
                                </div>
                                <div className="w-12 text-right font-mono text-xs text-slate-600">
                                  {(item.score * 100).toFixed(1)}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="bg-white/90 backdrop-blur-2xl rounded-2xl p-6 flex flex-col border border-white/60 gap-6 shadow-xl"
                style={{ minHeight: 340 }}
              >
                {ensembleCard ? (
                  <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-6 flex flex-col gap-2 shadow-md">
                    <div className="flex items-center gap-3">
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: "#fbbf24" }}
                      ></span>
                      <span className="font-semibold text-lg text-amber-900">
                        {ensembleCard.predictedDisease}
                      </span>
                      <span className="ml-2 px-2 py-0.5 rounded-lg text-xs font-bold bg-amber-200 text-amber-900 border border-amber-300">
                        Confidence: {(ensembleCard.confidence * 100).toFixed(0)}
                        %
                      </span>
                    </div>
                    <div className="mt-2 text-sm">
                      <span className="text-slate-700">
                        The ensemble meta-model integrates all base model
                        outputs for a robust final decision.
                      </span>
                    </div>
                    {ensembleCard.breakdown &&
                      ensembleCard.breakdown.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-semibold mb-1 text-amber-900">
                            Why this diagnosis?
                          </h5>
                          <div className="text-sm mb-2 text-slate-700">
                            The ensemble model chose{" "}
                            <strong>{ensembleCard.predictedDisease}</strong>{" "}
                            because it had the highest combined probability (
                            {(ensembleCard.confidence * 100).toFixed(1)}%) among
                            all possible disease classes.
                          </div>
                          <div className="overflow-x-auto">
                            <table className="min-w-[320px] text-xs border border-amber-300 rounded-lg overflow-hidden">
                              <thead>
                                <tr className="bg-amber-200">
                                  <th className="px-2 py-1 text-left text-amber-900">
                                    Class
                                  </th>
                                  <th className="px-2 py-1 text-left text-amber-900">
                                    Probability
                                  </th>
                                  <th className="px-2 py-1 text-left text-amber-900">
                                    Selected
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {ensembleCard.breakdown
                                  .sort((a, b) => b.score - a.score)
                                  .map((item, idx) => (
                                    <tr
                                      key={idx}
                                      className={
                                        item.is_selected
                                          ? "bg-amber-100"
                                          : "bg-white"
                                      }
                                    >
                                      <td className="px-2 py-1 text-slate-700">
                                        {item.class}
                                      </td>
                                      <td className="px-2 py-1 text-slate-700">
                                        {(item.score * 100).toFixed(1)}%
                                      </td>
                                      <td className="px-2 py-1">
                                        {item.is_selected && (
                                          <span className="font-bold text-amber-700">
                                            ✓
                                          </span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="rounded-xl border border-slate-200 bg-slate-100 p-6 text-slate-700">
                    Ensemble prediction not available.
                  </div>
                )}
                <div className="mt-6">
                  <h4 className="font-semibold mb-2 text-[#1E293B]">
                    Base Model Predictions
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {baseModelResults.map((model) => (
                      <div
                        key={model.name}
                        className="bg-white/70 backdrop-blur-sm rounded-lg border border-slate-200/60 p-3 flex flex-col gap-1 shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block w-2 h-2 rounded-full"
                            style={{ backgroundColor: model.color }}
                          ></span>
                          <span className="font-medium text-slate-800">
                            {model.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <span>
                            <strong>Prediction:</strong>{" "}
                            {model.predictedDisease}
                          </span>
                          <span>
                            <strong>Conf:</strong>{" "}
                            {(model.confidence * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
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

export default Results;
