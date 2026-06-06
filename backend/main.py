import base64
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import numpy as np
import cv2
import torch
import torch.nn as nn
from torchvision import models
from torchvision.models import (
    convnext_tiny, swin_t,
    efficientnet_b3, resnet50, densenet121
)
import joblib

from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image

# ── Albumentations (same pipeline as training) ────────────────────────────────
import albumentations as A
from albumentations.pytorch import ToTensorV2

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLASS_NAMES = [
    'Normal', 'Cataract', 'Glaucoma', 'Myopia', 'AMD',
    'Epiretinal Membrane', 'Diabetic Retinopathy', 'Retinitis',
    'Hypertensive Retinopathy', 'Vein Occlusion (BRVO)', 'Laser Scars'
]
NUM_CLASSES = len(CLASS_NAMES)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# ══════════════════════════════════════════════════════════════════════════════
# 1. ARCHITECTURE BUILDERS  — must match V4 training scripts exactly
# ══════════════════════════════════════════════════════════════════════════════

def build_resnet50():
    """ResNet-50 V4: BatchNorm1d + ReLU + Dropout(0.3)"""
    model = resnet50(weights=None)
    in_feats = model.fc.in_features
    model.fc = nn.Sequential(
        nn.Linear(in_feats, 512),
        nn.BatchNorm1d(512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, NUM_CLASSES)
    )
    return model


def build_densenet121():
    """DenseNet-121 V4: BatchNorm1d + ReLU + Dropout(0.3)"""
    model = densenet121(weights=None)
    in_feats = model.classifier.in_features
    model.classifier = nn.Sequential(
        nn.Linear(in_feats, 512),
        nn.BatchNorm1d(512),
        nn.ReLU(),
        nn.Dropout(0.3),
        nn.Linear(512, NUM_CLASSES)
    )
    return model


def build_efficientnet_b3():
    """EfficientNet-B3 V4: BatchNorm1d + SiLU + Dropout(0.35), input 300×300"""
    model = efficientnet_b3(weights=None)
    in_feats = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Linear(in_feats, 512),
        nn.BatchNorm1d(512),
        nn.SiLU(),
        nn.Dropout(0.35),
        nn.Linear(512, NUM_CLASSES)
    )
    return model


def build_convnext_tiny():
    """ConvNeXt-Tiny V4: LayerNorm + GELU + Dropout(0.3)"""
    model = convnext_tiny(weights=None)
    in_feats = model.classifier[2].in_features
    model.classifier[2] = nn.Sequential(
        nn.Linear(in_feats, 512),
        nn.LayerNorm(512),
        nn.GELU(),
        nn.Dropout(0.3),
        nn.Linear(512, NUM_CLASSES)
    )
    return model


def build_swin_t():
    """Swin-Tiny V4: LayerNorm + GELU + Dropout(0.3)"""
    model = swin_t(weights=None)
    in_feats = model.head.in_features
    model.head = nn.Sequential(
        nn.Linear(in_feats, 512),
        nn.LayerNorm(512),
        nn.GELU(),
        nn.Dropout(0.3),
        nn.Linear(512, NUM_CLASSES)
    )
    return model


# ══════════════════════════════════════════════════════════════════════════════
# 2. CONFIGURATION  — V4 paths + per-class threshold arrays
# ══════════════════════════════════════════════════════════════════════════════

META_MODEL_PATH = "models/ensemble_V4_best_thresholds.txt"  # ensemble thresholds (11 values)
META_LR_PATH    = "models/ensemble_stacking_models.pkl"             # stacking LogReg model

MODEL_CONFIGS = {
    # Input order MUST match the order used in ensemble_V4_advanced.py
    "ConvNeXt-Tiny": {
        "builder":      build_convnext_tiny,
        "path":         "models/convnext_tiny_V4_ULTIMATE.pth",
        "thresh_path":  "models/convnext_V4_thresholds.txt",   # 11-value array
        "target_size":  (224, 224),
        "color":        "#0088FE",
    },
    "EfficientNet-B3": {
        "builder":      build_efficientnet_b3,
        "path":         "models/effb3_V4_ULTIMATE.pth",
        "thresh_path":  "models/effb3_V4_thresholds.txt",
        "target_size":  (300, 300),
        "color":        "#8884d8",
    },
    "Swin-Tiny": {
        "builder":      build_swin_t,
        "path":         "models/swin_tiny_V4_ULTIMATE.pth",
        "thresh_path":  "models/swin_tiny_V4_thresholds.txt",
        "target_size":  (224, 224),
        "color":        "#10B981",
    },
    "ResNet-50": {
        "builder":      build_resnet50,
        "path":         "models/resnet50_V4_ULTIMATE.pth",
        "thresh_path":  "models/resnet50_V4_thresholds.txt",
        "target_size":  (224, 224),
        "color":        "#ffc658",
    },
    "DenseNet-121": {
        "builder":      build_densenet121,
        "path":         "models/densenet121_V4_ULTIMATE.pth",
        "thresh_path":  "models/densenet121_V4_thresholds.txt",
        "target_size":  (224, 224),
        "color":        "#82ca9d",
    },
}

loaded_models    = {}
loaded_thresholds = {}   # name → np.array of shape (11,)
meta_lr_model    = None
ensemble_thresholds = None   # np.array of shape (11,) from ensemble val-set sweep


@app.on_event("startup")
async def load_models():
    global meta_lr_model, ensemble_thresholds

    print(f"Startup: Loading V4 models on {device}...")

    for name, cfg in MODEL_CONFIGS.items():
        # Build + load weights
        try:
            model = cfg["builder"]()
            model = model.to(device)

            # Handle SWA-wrapped weights (AveragedModel adds 'module.' prefix)
            state_dict = torch.load(cfg["path"], map_location=device)
            state_dict = {k.replace("module.", ""): v for k, v in state_dict.items()}
            model.load_state_dict(state_dict, strict=False)
            model.eval()
            loaded_models[name] = model
            print(f"  ✅ {name} loaded from {cfg['path']}")
        except Exception as e:
            print(f"  ❌ {name}: {e}")

        # Per-class threshold array (11 values from np.savetxt)
        try:
            loaded_thresholds[name] = np.loadtxt(cfg["thresh_path"])
            print(f"  ✅ {name} thresholds loaded ({loaded_thresholds[name]})")
        except Exception as e:
            print(f"  ⚠️  {name} thresholds fallback to 0.5: {e}")
            loaded_thresholds[name] = np.full(NUM_CLASSES, 0.5)

    # Ensemble stacking LogReg
    try:
        meta_lr_model = joblib.load(META_LR_PATH)
        print(f"  ✅ Meta LogReg loaded from {META_LR_PATH}")
    except Exception as e:
        print(f"  ❌ Meta LogReg: {e}")

    # Ensemble per-class thresholds (from val-set sweep in ensemble script)
    try:
        ensemble_thresholds = np.loadtxt(META_MODEL_PATH)
        print(f"  ✅ Ensemble thresholds loaded: {ensemble_thresholds}")
    except Exception as e:
        print(f"  ⚠️  Ensemble thresholds fallback to 0.5: {e}")
        ensemble_thresholds = np.full(NUM_CLASSES, 0.5)


# ══════════════════════════════════════════════════════════════════════════════
# 3. PREPROCESSING  — identical to V4 training OpenCV pipeline
# ══════════════════════════════════════════════════════════════════════════════

def _largest_contour(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 7, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    return max(contours, key=cv2.contourArea) if contours else None


def crop_to_fundus(img):
    c = _largest_contour(img)
    if c is None:
        return img
    x, y, w, h = cv2.boundingRect(c)
    return img[y:y + h, x:x + w] if w >= 50 and h >= 50 else img


def is_fundus_image(image_bytes):
    """Content-based validation for retinal fundus images.

    This is intentionally lightweight and runs before inference so non-fundus
    uploads are rejected without relying on file size heuristics.
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if img is None:
        return False, "Could not decode the uploaded file as an image."

    height, width = img.shape[:2]
    if min(height, width) < 128:
        return False, "The uploaded image is too small to be a retinal fundus image."

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    color_bgr = cv2.cvtColor(img, cv2.COLOR_BGR2RGB).astype(np.float32)

    # Contour-based foreground estimate
    _, thresh = cv2.threshold(gray, 7, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return False, "The uploaded image does not appear to contain a retinal fundus field."

    contour = max(contours, key=cv2.contourArea)
    area = float(cv2.contourArea(contour))
    if area <= 0:
        return False, "The uploaded image does not appear to contain a retinal fundus field."

    image_area = float(height * width)
    area_ratio = area / image_area
    x, y, box_w, box_h = cv2.boundingRect(contour)
    box_area = float(box_w * box_h) if box_w > 0 and box_h > 0 else 1.0
    fill_ratio = area / box_area
    perimeter = float(cv2.arcLength(contour, True))
    circularity = (4.0 * np.pi * area) / (perimeter * perimeter + 1e-6)

    # The retina in a fundus photo is usually centered and surrounded by a dark border.
    center = gray[height // 4 : (3 * height) // 4, width // 4 : (3 * width) // 4]
    corner_h = max(height // 8, 1)
    corner_w = max(width // 8, 1)
    corners = np.concatenate([
        gray[:corner_h, :corner_w].ravel(),
        gray[:corner_h, -corner_w:].ravel(),
        gray[-corner_h:, :corner_w].ravel(),
        gray[-corner_h:, -corner_w:].ravel(),
    ])
    center_mean = float(center.mean()) if center.size else 0.0
    corner_mean = float(corners.mean()) if corners.size else 0.0

    # A fundus image is typically red-dominant in the retinal field.
    center_rgb = color_bgr[height // 4 : (3 * height) // 4, width // 4 : (3 * width) // 4]
    if center_rgb.size:
        rgb_means = center_rgb.reshape(-1, 3).mean(axis=0)
        red_dominance = float(rgb_means[0] - max(rgb_means[1], rgb_means[2]))
    else:
        red_dominance = -999.0

    # Large, near-central circle detection is a strong fundus signal.
    blurred = cv2.GaussianBlur(gray, (9, 9), 2)
    circles = cv2.HoughCircles(
        blurred,
        cv2.HOUGH_GRADIENT,
        dp=1.2,
        minDist=max(min(height, width) // 2, 1),
        param1=80,
        param2=28,
        minRadius=max(min(height, width) // 5, 1),
        maxRadius=max(min(height, width) // 2, 1),
    )

    circle_score = 0.0
    if circles is not None and len(circles[0]) > 0:
        cx, cy, radius = circles[0][0]
        center_dx = abs(cx - width / 2) / max(width, 1)
        center_dy = abs(cy - height / 2) / max(height, 1)
        radius_ratio = radius / max(min(height, width), 1)
        if center_dx < 0.18 and center_dy < 0.18 and 0.22 <= radius_ratio <= 0.60:
            circle_score = 1.0

    border_darkness = 1.0 - (corner_mean / (center_mean + 1e-6)) if center_mean > 0 else 0.0

    score = 0.0
    if 0.12 <= area_ratio <= 0.95:
        score += 0.9
    if 0.45 <= fill_ratio <= 0.98:
        score += 0.8
    if circularity >= 0.40:
        score += 0.7
    if border_darkness >= 0.20:
        score += 0.8
    if red_dominance >= 6.0:
        score += 0.6
    score += circle_score

    if score < 2.8:
        return False, "The uploaded image does not appear to be a retinal fundus image."

    return True, None


def make_square_and_resize(img, target_size=500):
    h, w = img.shape[:2]
    if h > w:
        d = h - w
        img = cv2.copyMakeBorder(img, 0, 0, d // 2, d - d // 2,
                                 cv2.BORDER_CONSTANT, value=0)
    elif w > h:
        d = w - h
        img = cv2.copyMakeBorder(img, d // 2, d - d // 2, 0, 0,
                                 cv2.BORDER_CONSTANT, value=0)
    return cv2.resize(img, (target_size, target_size), interpolation=cv2.INTER_AREA)


def apply_circular_mask(img):
    c = _largest_contour(img)
    if c is None:
        return img
    (cx, cy), radius = cv2.minEnclosingCircle(c)
    radius = int(radius * 0.90)
    mask = np.zeros_like(img)
    cv2.circle(mask, (int(cx), int(cy)), radius, (255, 255, 255), -1)
    return cv2.bitwise_and(img, mask)


def clean_preprocess(image_bytes) -> Image.Image:
    """Returns a 500×500 PIL RGB image (pre-processed, before model-specific resize)."""
    nparr = np.frombuffer(image_bytes, np.uint8)
    img   = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img   = crop_to_fundus(img)
    img   = make_square_and_resize(img, target_size=500)
    img   = apply_circular_mask(img)
    img   = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    return Image.fromarray(img)


# ══════════════════════════════════════════════════════════════════════════════
# 4. INFERENCE TRANSFORMS  — Albumentations val pipeline (matches training)
# ══════════════════════════════════════════════════════════════════════════════

def get_val_transform(target_size: tuple):
    """Identical to val_albu in training: Resize → CenterCrop → Normalize."""
    h, w = target_size
    # For 224: resize to 256 then crop; for 300: resize to 320 then crop
    resize_h = int(h * 256 / 224) if h == 224 else int(h * 320 / 300)
    resize_w = int(w * 256 / 224) if w == 224 else int(w * 320 / 300)
    return A.Compose([
        A.Resize(resize_h, resize_w),
        A.CenterCrop(h, w),
        A.Normalize(mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]),
        ToTensorV2(),
    ])


def pil_to_tensor(pil_img: Image.Image, target_size: tuple) -> torch.Tensor:
    """Convert PIL → normalised tensor using the V4 val transform."""
    np_img  = np.array(pil_img)
    transform = get_val_transform(target_size)
    tensor  = transform(image=np_img)["image"]
    return tensor.unsqueeze(0).to(device)


# ══════════════════════════════════════════════════════════════════════════════
# 5. TEST-TIME AUGMENTATION  — matches tta_predict() in training scripts
# ══════════════════════════════════════════════════════════════════════════════

def tta_predict(model: nn.Module, tensor: torch.Tensor) -> torch.Tensor:
    """Average original + H-flip + V-flip probabilities."""
    with torch.no_grad():
        p0 = torch.sigmoid(model(tensor))
        p1 = torch.sigmoid(model(torch.flip(tensor, dims=[3])))   # H-flip
        p2 = torch.sigmoid(model(torch.flip(tensor, dims=[2])))   # V-flip
    return (p0 + p1 + p2) / 3.0


# ══════════════════════════════════════════════════════════════════════════════
# 6. GRAD-CAM  — updated target layers for V4 heads
# ══════════════════════════════════════════════════════════════════════════════

def _swin_reshape(tensor):
    """Swin outputs (B, H, W, C) — reshape to (B, C, H, W) for Grad-CAM."""
    return tensor.permute(0, 3, 1, 2)


def get_target_layers(model_name: str, model: nn.Module):
    try:
        if model_name == "ResNet-50":
            return [model.layer4[-1]]
        elif model_name == "DenseNet-121":
            return [model.features[-1]]
        elif model_name == "EfficientNet-B3":
            return [model.features[-1]]
        elif model_name == "ConvNeXt-Tiny":
            # Last ConvNeXt stage before the classifier
            return [model.features[7][-1]]
        elif model_name == "Swin-Tiny":
            return [model.features[-1]]
    except Exception as e:
        print(f"Grad-CAM layer error ({model_name}): {e}")
    return None


def generate_heatmap_b64(model, tensor, rgb_np, target_layers,
                         class_idx, model_name=""):
    reshape = _swin_reshape if model_name == "Swin-Tiny" else None
    cam     = GradCAM(model=model, target_layers=target_layers,
                      reshape_transform=reshape)
    grayscale = cam(input_tensor=tensor,
                    targets=[ClassifierOutputTarget(class_idx)])
    vis = show_cam_on_image(rgb_np, grayscale[0], use_rgb=True)
    buf = io.BytesIO()
    Image.fromarray(vis).save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")


# ══════════════════════════════════════════════════════════════════════════════
# 7. /predict ENDPOINT
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    print(f"\nAnalysing: {file.filename}")
    contents       = await file.read()

    valid_fundus, fundus_error = is_fundus_image(contents)
    if not valid_fundus:
        return {
            "filename": file.filename,
            "error": fundus_error,
            "predictions": [],
        }

    base_pil       = clean_preprocess(contents)
    response_data  = []
    model_probs_map = {}   # name → np.array (1, 11) for meta-model input

    for name, cfg in MODEL_CONFIGS.items():
        if name not in loaded_models:
            continue

        model      = loaded_models[name]
        thresholds = loaded_thresholds[name]          # shape (11,)
        tensor     = pil_to_tensor(base_pil, cfg["target_size"])

        # ── TTA inference ────────────────────────────────────────────────────
        probs_tensor = tta_predict(model, tensor)     # (1, 11)
        probs_np     = probs_tensor.cpu().numpy()     # (1, 11)
        model_probs_map[name] = probs_np

        probs_1d = probs_np[0]                        # (11,)

        # ── Apply per-class thresholds ────────────────────────────────────────
        predicted_flags = (probs_1d >= thresholds).astype(int)

        # Primary prediction: class with highest probability among those flagged
        flagged_indices = np.where(predicted_flags)[0]
        if len(flagged_indices) > 0:
            # Among flagged classes, pick the one with highest probability
            predicted_idx = flagged_indices[np.argmax(probs_1d[flagged_indices])]
        else:
            # Nothing cleared threshold — show highest-probability class as uncertain
            predicted_idx = int(np.argmax(probs_1d))

        is_reliable     = len(flagged_indices) > 0
        final_prob      = float(probs_1d[predicted_idx])
        final_class     = CLASS_NAMES[predicted_idx]
        if not is_reliable:
            final_class += " (?)"

        # ── Class breakdown for frontend ──────────────────────────────────────
        breakdown = sorted([
            {
                "class":       CLASS_NAMES[i],
                "score":       round(float(probs_1d[i]), 4),
                "threshold":   round(float(thresholds[i]), 2),
                "is_selected": bool(predicted_flags[i]),
            }
            for i in range(NUM_CLASSES)
        ], key=lambda x: x["score"], reverse=True)

        # ── Grad-CAM heatmap ─────────────────────────────────────────────────
        heatmap_b64 = None
        try:
            target_layers = get_target_layers(name, model)
            if target_layers:
                viz_pil   = base_pil.resize(cfg["target_size"])
                rgb_np    = np.float32(viz_pil) / 255.0
                # Use non-TTA tensor for Grad-CAM (TTA would average gradients incorrectly)
                cam_tensor = pil_to_tensor(base_pil, cfg["target_size"])
                heatmap_b64 = generate_heatmap_b64(
                    model, cam_tensor, rgb_np,
                    target_layers, predicted_idx, model_name=name
                )
        except Exception as e:
            print(f"  Heatmap error ({name}): {e}")

        response_data.append({
            "name":            name,
            "predictedDisease": final_class,
            "confidence":      round(final_prob, 4),
            "thresholds":      thresholds.tolist(),   # all 11 per-class thresholds
            "is_reliable":     is_reliable,
            "color":           cfg["color"],
            "heatmap":         f"data:image/png;base64,{heatmap_b64}" if heatmap_b64 else None,
            "breakdown":       breakdown,
        })

    # ══════════════════════════════════════════════════════════════════════════
    # STACKING ENSEMBLE  — LogReg meta-model (same order as ensemble script)
    # Input order: ConvNeXt | EfficientNet-B3 | Swin | ResNet | DenseNet
    # ══════════════════════════════════════════════════════════════════════════
    if meta_lr_model is not None:
        try:
            p_conv  = model_probs_map.get("ConvNeXt-Tiny")
            p_eff   = model_probs_map.get("EfficientNet-B3")
            p_swin  = model_probs_map.get("Swin-Tiny")
            p_res   = model_probs_map.get("ResNet-50")
            p_dense = model_probs_map.get("DenseNet-121")

            if all(x is not None for x in [p_conv, p_eff, p_swin, p_res, p_dense]):
                # Stack: (1, 55) — same horizontal order as ensemble_V4_advanced.py
                meta_input = np.hstack([p_conv, p_eff, p_swin, p_res, p_dense])

                final_probs = np.zeros(NUM_CLASSES)
                
                for c in range(NUM_CLASSES):
                    class_model = meta_lr_model.get(c)
                    
                    if class_model == 'simple_avg_fallback':
                        # Fallback: simple average for this specific class
                        class_preds = [p_conv[0, c], p_eff[0, c], p_swin[0, c], p_res[0, c], p_dense[0, c]]
                        final_probs[c] = np.mean(class_preds)
                    else:
                        # Use the trained Logistic Regression model for this class
                        # predict_proba returns (1, 2), we want the positive class probability [0, 1]
                        final_probs[c] = class_model.predict_proba(meta_input)[0, 1]

                # Apply ensemble per-class thresholds from val-set sweep
                ens_flags   = (final_probs >= ensemble_thresholds).astype(int)
                flagged_ens = np.where(ens_flags)[0]

                if len(flagged_ens) > 0:
                    ens_idx      = flagged_ens[np.argmax(final_probs[flagged_ens])]
                    ens_disease  = CLASS_NAMES[ens_idx]
                    ens_color    = "#10B981" if ens_idx == 0 else "#EF4444"
                    ens_reliable = True
                else:
                    ens_idx      = int(np.argmax(final_probs))
                    ens_disease  = CLASS_NAMES[ens_idx] + " (?)"
                    ens_color    = "#F59E0B"
                    ens_reliable = False

                ens_confidence = float(final_probs[ens_idx])

                # Per-class breakdown for ensemble card
                ens_breakdown = sorted([
                    {
                        "class":       CLASS_NAMES[i],
                        "score":       round(float(final_probs[i]), 4),
                        "threshold":   round(float(ensemble_thresholds[i]), 2),
                        "is_selected": bool(ens_flags[i]),
                    }
                    for i in range(NUM_CLASSES)
                ], key=lambda x: x["score"], reverse=True)

                print(f"  Ensemble → {ens_disease} (conf: {ens_confidence:.4f})")

                # Insert ensemble card first so frontend shows it as headline
                response_data.insert(0, {
                    "name":             "Ensemble (Stacking)",
                    "predictedDisease": ens_disease,
                    "confidence":       round(ens_confidence, 4),
                    "thresholds":       ensemble_thresholds.tolist(),
                    "is_reliable":      ens_reliable,
                    "color":            ens_color,
                    "heatmap":          None,
                    "breakdown":        ens_breakdown,
                })

        except Exception as e:
            print(f"  ❌ Ensemble inference failed: {e}")

    return {"filename": file.filename, "predictions": response_data}