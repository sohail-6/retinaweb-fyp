# RetinaWeb: Multi-Label Classification of Retinal Pathologies Using Deep Learning Ensemble Systems

[![Python 3.10+](https://shields.io)](https://python.org)
[![Framework: PyTorch](https://shields.io)](https://pytorch.org)
[![Stack: Full--Stack%20JavaScript-Node/React-green.svg](https://shields.io)]()
[![Target: IEEE ICONICS 2026](https://shields.io)](https://iconics.neduet.edu.pk/]

## 📌 Project Overview
This repository contains the official full-stack implementation of **RetinaWeb**, an automated diagnostic web application developed as a Final Year Project (FYP). The platform utilizes an end-to-end deep learning pipeline integrated with an ensemble system designed for the simultaneous, multi-label classification of **11 distinct retinal pathologies** from fundus images.

Our target publication venue for this research is the **International Conference on Innovations in Computer Science 2026**.

---

## 🦠 Target Retinal Pathologies (11 Labels)
The model screens for conditions concurrently, including:
1. Diabetic Retinopathy (DR)
2. Age-related Macular Degeneration (AMD)
3. Glaucoma (G)
4. Hypertensive Retinopathy (HTR)
5. Cataract (CAT)
6. Myopic Maculopathy (MY)
7. Branch Retinal Vein Occlusion (BRVO)
8. Retinoschisis / Retinal Detachment (RS)
9. Normal / Healthy Retina
10. Laser Scars (LS)
11. Epiretinal Membrane (ERM)
---

## 📁 Repository Structure
*   **`backend/`** — Python/Flask API serving the deep learning pipeline, managing multi-label classification logic, and loading model weights.
*   **`retinaweb/`** — Frontend web application built with analytics dashboards, user authentication, and patient report generation screens.
*   **`package.json` & `package-lock.json`** — Node.js root configurations for managing full-stack dependencies and automation scripts.
*   **`.gitignore`** — Specific file exclusions keeping large model weights (`.pth`) and node modules out of repository tracking.

---

## 🚀 Getting Started

### 1. Prerequisites
Ensure you have Python 3.10+ and Node.js installed on your system.

### 2. Setting Up the Frontend & Analytics
Navigate to the web interface folder to install packages and start the UI development server:
```bash
cd retinaweb
npm install
npm run start
```

### 3. Setting Up the AI Backend Pipeline
Navigate to the backend server directory to handle image processing and model inferences:
```bash
cd backend
pip install -r requirements.txt
python app.py
```

---

## 👥 Contributors
*   **Hamza Mustafa**
*  **Sohail Hussain**
*  **Atique ur Rehman** 
*  **Ahmer Ali**
---

## 📊 Results & Experimental Performance

<br />
<hr />
<h2>📊 Results & Experimental Performance</h2>

<h3>TABLE I: Overall Performance of Base Models on Test Set</h3>
<table width="100%">
  <thead>
    <tr bgcolor="#f2f2f2">
      <th align="left">Model</th>
      <th align="center">Macro F₁</th>
      <th align="center">95% CI</th>
      <th align="center">Mean AUC</th>
      <th align="center">mAP</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>ResNet-50</b></td><td align="center">0.8558</td><td align="center">0.8289 – 0.8776</td><td align="center">0.9845</td><td align="center">0.9235</td></tr>
    <tr><td><b>DenseNet-121</b></td><td align="center">0.8455</td><td align="center">0.8181 – 0.8685</td><td align="center">0.9834</td><td align="center">0.9149</td></tr>
    <tr><td><b>EfficientNet-B3</b></td><td align="center">0.8637</td><td align="center">0.8353 – 0.8861</td><td align="center">0.9860</td><td align="center">0.9215</td></tr>
    <tr><td><b>ConvNeXt-Tiny</b></td><td align="center">0.8677</td><td align="center">0.8422 – 0.8913</td><td align="center">0.9823</td><td align="center">0.9215</td></tr>
    <tr><td><b>Swin-Tiny</b></td><td align="center"><b>0.8789</b></td><td align="center"><b>0.8566 – 0.9014</b></td><td align="center"><b>0.9791</b></td><td align="center"><b>0.9403</b></td></tr>
  </tbody>
</table>

<h3>TABLE II: Ensemble Strategies Performance Comparison</h3>
<table width="100%">
  <thead>
    <tr bgcolor="#f2f2f2">
      <th align="left">Strategy</th>
      <th align="center">Macro F₁</th>
      <th align="center">Mean AUC</th>
      <th align="center">mAP</th>
    </tr>
  </thead>
  <tbody>
    <tr><td><b>A – Simple Average</b></td><td align="center">0.8804</td><td align="center"><b>0.9898</b></td><td align="center"><b>0.9433</b></td></tr>
    <tr><td><b>B – Weighted Average</b></td><td align="center">0.8728</td><td align="center"><b>0.9898</b></td><td align="center"><b>0.9433</b></td></tr>
    <tr><td><b>C – Per-Class Weighted</b></td><td align="center">0.8805</td><td align="center"><b>0.9898</b></td><td align="center">0.9431</td></tr>
    <tr><td><b>D – Stacking (Proposed)</b></td><td align="center"><b>0.8845</b></td><td align="center">0.9888</td><td align="center">0.9398</td></tr>
  </tbody>
</table>

