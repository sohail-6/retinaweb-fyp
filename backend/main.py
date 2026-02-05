import base64
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io
import numpy as np
import cv2
import torch
import torch.nn as nn
from torchvision import transforms, models
import joblib   # Required to load the Meta-Model
import sklearn  # Ensure sklearn is installed for the .pkl file

# Import Grad-CAM
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget
from pytorch_grad_cam.utils.image import show_cam_on_image

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CLASS_NAMES = ['Normal', 'Cataract', 'Glaucoma', 'Myopia', 'AMD', 'Epiretinal Membrane', 
               'Diabetic Retinopathy', 'Retinitis', 'Hypertensive Retinopathy', 
               'Vein Occlusion (BRVO)', 'Laser Scars']

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# --- 1. ARCHITECTURE BUILDERS (Unchanged) ---
def build_resnet50():
    model = models.resnet50(weights=None)
    model.fc = nn.Sequential(nn.Linear(model.fc.in_features, 512), nn.ReLU(), nn.Dropout(0.65), nn.Linear(512, 11))
    return model

def build_densenet121():
    model = models.densenet121(weights=None)
    model.classifier = nn.Sequential(nn.Linear(model.classifier.in_features, 512), nn.ReLU(), nn.Dropout(0.5), nn.Linear(512, 11))
    return model

def build_efficientnet_b3():
    model = models.efficientnet_b3(weights=None)
    model.classifier = nn.Sequential(nn.Dropout(p=0.5, inplace=True), nn.Linear(model.classifier[1].in_features, 512), nn.ReLU(), nn.Dropout(p=0.65), nn.Linear(512, 11))
    return model

def build_convnext_tiny():
    from torchvision.models import convnext_tiny
    model = convnext_tiny(weights=None)
    in_feats = model.classifier[2].in_features
    model.classifier[2] = nn.Sequential(
        nn.Linear(in_feats, 512),
        nn.ReLU(),
        nn.Dropout(0.5),
        nn.Linear(512, 11)
    )
    return model

def build_swin_t():
    from torchvision.models import swin_t
    model = swin_t(weights=None)
    in_feats = model.head.in_features
    model.head = nn.Sequential(nn.Linear(in_feats, 512), nn.ReLU(), nn.Dropout(0.5), nn.Linear(512, 11))
    return model

# --- 2. CONFIGURATION ---
META_MODEL_PATH = "models/final_meta_model.pkl" 

MODEL_CONFIGS = {
    "EfficientNetB3": { 
        "builder": build_efficientnet_b3, 
        "path": "models/efficientnet_b3_balanced3.pth", 
        "thresh_path": "models/effb3_threshold3.txt",
        "target_size": (300, 300), "color": "#8884d8" 
    },
    "ResNet50": { 
        "builder": build_resnet50, 
        "path": "models/resnet50_regularized_FINAL_Scratch.pth", 
        "thresh_path": "models/resnet50_best_threshold_reg_Scratch.txt",
        "target_size": (224, 224), "color": "#ffc658" 
    },
    "DenseNet121": { 
        "builder": build_densenet121, 
        "path": "models/densenet121_regularized.pth", 
        "thresh_path": "models/densenet121_best_threshold_reg.txt",
        "target_size": (224, 224), "color": "#82ca9d" 
    },
    "SwinTiny": { 
        "builder": build_swin_t, 
        "path": "models/swin_tiny_balanced.pth", 
        "thresh_path": "models/swin_threshold.txt",
        "target_size": (224, 224), "color": "#10B981" 
    },
     "ConvNeXtTiny": { 
        "builder": build_convnext_tiny, 
        "path": "models/convnext_tiny_regularized.pth", 
        "thresh_path": "models/convnext_best_threshold.txt", 
        "target_size": (224, 224), "color": "#0088FE" 
    }
}

loaded_models = {}
loaded_thresholds = {}
meta_model = None 

@app.on_event("startup")
async def load_models():
    global meta_model
    print(f"Startup: Loading models on {device}...")
    
    # Load Deep Learning Models
    for name, config in MODEL_CONFIGS.items():
        try:
            model = config["builder"]() #Build Skeletion
            model = model.to(device) #Move to CPU/GPU
            state_dict = torch.load(config["path"], map_location=device) #Load Weights
            model.load_state_dict(state_dict) #Apply Weights
            model.eval() #Set to Evaluation Mode
            loaded_models[name] = model #Store in Global Dictionary
            print(f"✅ {name} loaded.")
        except Exception as e:
            print(f"❌ Could not load {name}: {e}")
            
        try:
            with open(config["thresh_path"], "r") as f:
                val = float(f.read().strip())
                loaded_thresholds[name] = val
        except:
            loaded_thresholds[name] = 0.5

    # Load Stacking Meta-Model
    try:
        meta_model = joblib.load(META_MODEL_PATH)
        print(f"✅ Meta-Model (Logistic Regression) loaded from {META_MODEL_PATH}")
    except Exception as e:
        print(f"❌ Failed to load Meta-Model: {e}")

# --- 3. PREPROCESSING ---
def get_largest_contour(img):
    """Extract the largest contour from an image. Returns contour or None if not found."""
    try:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        _, thresh = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
        contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return None
        return max(contours, key=cv2.contourArea)
    except:
        return None

def crop_to_fundus(img):
    c = get_largest_contour(img)
    if c is None:
        return img
    x, y, w, h = cv2.boundingRect(c)
    if w < 50 or h < 50:
        return img 
    return img[y:y+h, x:x+w]

def make_square_and_resize(img, target_size=500):
    h, w = img.shape[:2]
    if h > w:
        diff = h - w
        img = cv2.copyMakeBorder(img, 0, 0, diff//2, diff-(diff//2), cv2.BORDER_CONSTANT, value=0)
    elif w > h:
        diff = w - h
        img = cv2.copyMakeBorder(img, diff//2, diff-(diff//2), 0, 0, cv2.BORDER_CONSTANT, value=0)
    return cv2.resize(img, (target_size, target_size), interpolation=cv2.INTER_AREA)

def apply_clean_mask(img):
    c = get_largest_contour(img)
    if c is None:
        return img
    (x, y), radius = cv2.minEnclosingCircle(c)
    radius = int(radius * 0.90) 
    mask = np.zeros_like(img)
    cv2.circle(mask, (int(x), int(y)), radius, (255, 255, 255), -1)
    return cv2.bitwise_and(img, mask)

def clean_preprocess(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    img = crop_to_fundus(img)
    img = make_square_and_resize(img, target_size=500)
    final_img = apply_clean_mask(img)
    final_img = cv2.cvtColor(final_img, cv2.COLOR_BGR2RGB)
    return Image.fromarray(final_img)

def get_transform(target_size, model_name):
    t_list = []
    t_list.append(transforms.Resize(target_size)) 
    t_list.append(transforms.ToTensor())
    t_list.append(transforms.Normalize([0.485,0.456,0.406], [0.229,0.224,0.225]))
    return transforms.Compose(t_list)

# --- 4. GRAD-CAM UTILS ---
def swin_reshape_transform(tensor):
    return tensor.permute(0, 3, 1, 2)

def get_target_layer(model_name, model):
    try:
        if model_name == "ResNet50": return [model.layer4[-1]]
        elif model_name == "DenseNet121": return [model.features[-1]]
        elif model_name == "EfficientNetB3": return [model.features[-1]]
        elif model_name == "ConvNeXtTiny": 
            return [model.features[7][-1]]
        elif model_name == "SwinTiny": return [model.features[-1]]
    except: return None
    return None

def generate_heatmap_base64(model, input_tensor, rgb_img_np, target_layers, class_idx, model_name=""):
    reshape_transform = swin_reshape_transform if model_name == "SwinTiny" else None
    cam = GradCAM(model=model, target_layers=target_layers, reshape_transform=reshape_transform)
    targets = [ClassifierOutputTarget(class_idx)]
    grayscale_cam = cam(input_tensor=input_tensor, targets=targets)
    visualization = show_cam_on_image(rgb_img_np, grayscale_cam[0, :], use_rgb=True)
    pil_img = Image.fromarray(visualization)
    buff = io.BytesIO()
    pil_img.save(buff, format="PNG")
    return base64.b64encode(buff.getvalue()).decode("utf-8")

# --- 5. PREDICT ENDPOINT ---
@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    print(f"Analyzing: {file.filename}")
    contents = await file.read()
    response_data = []
    base_image_pil = clean_preprocess(contents)

    # Dictionary to store probability vectors for the Meta-Model
    model_probs_map = {} 

    for name, config in MODEL_CONFIGS.items():
        if name not in loaded_models: continue
        model = loaded_models[name]
        threshold = loaded_thresholds.get(name, 0.5) 
        
        transform = get_transform(config["target_size"], name)
        input_tensor = transform(base_image_pil).unsqueeze(0).to(device)
        
        with torch.no_grad():
            outputs = model(input_tensor)
            if isinstance(outputs, tuple): outputs = outputs[0]
            probs = torch.sigmoid(outputs) 
            
            # Store raw probabilities for Meta-Model (Flatten to 1, 11)
            model_probs_map[name] = probs.cpu().numpy()

            # --- DETERMINE THE WINNER (Logic for Frontend Cards) ---
            predicted_idx = 0
            is_reliable = True

            if name == "ResNet50":
                disease_probs = probs[0, 1:] 
                has_disease = (disease_probs > threshold).any().item()
                if has_disease:
                    predicted_idx = torch.argmax(disease_probs).item() + 1
                    is_reliable = True
                else:
                    predicted_idx = 0 
                    is_reliable = (probs[0, 0].item() > 0.70)
            else:
                score, idx = torch.max(probs, dim=1)
                predicted_idx = idx.item()
                if score.item() < threshold:
                    is_reliable = False

            # --- BUILD CLASS BREAKDOWN ---
            class_breakdown = []
            for i, class_name in enumerate(CLASS_NAMES):
                score = probs[0, i].item()
                class_breakdown.append({
                    "class": class_name,
                    "score": float(f"{score:.4f}"), 
                    "is_selected": (i == predicted_idx)
                })
            class_breakdown.sort(key=lambda x: x["score"], reverse=True)

        # Generate Heatmap 
        heatmap_b64 = None
        try:
            target_layers = get_target_layer(name, model)
            if target_layers:
                viz_size = config["target_size"] 
                viz_img = base_image_pil.resize(viz_size) 
                rgb_img_np = np.float32(viz_img) / 255.0
                heatmap_b64 = generate_heatmap_base64(model, input_tensor, rgb_img_np, target_layers, predicted_idx, model_name=name)
        except Exception as e: 
            print(f"Heatmap error for {name}: {e}")
        
        final_confidence = probs[0, predicted_idx].item()
        final_class_name = CLASS_NAMES[predicted_idx]
        if not is_reliable: final_class_name += " (?)"

        response_data.append({
            "name": name,
            "predictedDisease": final_class_name,
            "confidence": float(f"{final_confidence:.2f}"),
            "threshold": threshold,
            "is_reliable": is_reliable,
            "color": config["color"],
            "heatmap": f"data:image/png;base64,{heatmap_b64}" if heatmap_b64 else None,
            "breakdown": class_breakdown 
        })

    # ======================================================
    # ### UPDATED: STACKING META-MODEL INFERENCE (With Safety Net)
    # ======================================================
    if meta_model is not None:
        try:
            # 1. Stack probabilities in the EXACT order used during training
            p_resnet = model_probs_map.get("ResNet50")
            p_dense  = model_probs_map.get("DenseNet121")
            p_conv   = model_probs_map.get("ConvNeXtTiny")
            p_swin   = model_probs_map.get("SwinTiny")
            p_eff    = model_probs_map.get("EfficientNetB3")

            if all(x is not None for x in [p_resnet, p_dense, p_conv, p_swin, p_eff]):
                meta_input = np.hstack([p_resnet, p_dense, p_conv, p_swin, p_eff])
                
                # 2. Predict Probabilities (Soft Voting)
                # predict_proba returns a list of (N, 2) arrays (one per class)
                raw_probs_list = meta_model.predict_proba(meta_input)
                
                # Convert list to (1, 11) array - taking index 1 (Probability of Positive)
                # Some versions of sklearn/MultiOutput return list, some return array. 
                # This logic handles the standard List[Array(N,2)] format
                final_probs = np.array([prob[:, 1] for prob in raw_probs_list]).T 
                
                # 3. Find Max Score and Class
                max_score = np.max(final_probs)
                max_idx = np.argmax(final_probs)
                
                # 4. SAFETY CHECK (Using Operating Point from your analysis)
                OPERATING_POINT = 0.10  # Calculated from F1-Maximization Script
                
                ensemble_disease = "Normal"
                ensemble_color = "#000000" # Black
                is_reliable_meta = True

                if max_score < OPERATING_POINT:
                    # CASE: INCONCLUSIVE
                    ensemble_disease = "Inconclusive (Low Confidence)"
                    ensemble_color = "#F59E0B" # Amber/Yellow Warning
                    is_reliable_meta = False
                    print(f"⚠️ Ensemble Inconclusive. Max Score: {max_score:.3f} < {OPERATING_POINT}")

                elif max_idx == 0:
                    # CASE: NORMAL
                    ensemble_disease = "Normal"
                    ensemble_color = "#10B981" # Green
                    print(f"✅ Ensemble Normal. Score: {max_score:.3f}")

                else:
                    # CASE: DISEASE DETECTED
                    ensemble_disease = CLASS_NAMES[max_idx]
                    ensemble_color = "#EF4444" # Red
                    print(f"🚨 Ensemble Detected: {ensemble_disease}. Score: {max_score:.3f}")

                # Add "Ensemble" as the HEADLINE card
                response_data.insert(0, {
                    "name": "Ensemble (Final)",
                    "predictedDisease": ensemble_disease,
                    "confidence": float(f"{max_score:.2f}"), # Normalized display
                    "threshold": OPERATING_POINT,
                    "is_reliable": is_reliable_meta,
                    "color": ensemble_color,
                    "heatmap": None, 
                    "breakdown": [] 
                })

        except Exception as e:
            print(f"❌ Meta-Model Inference Failed: {e}")

    return { "filename": file.filename, "predictions": response_data }