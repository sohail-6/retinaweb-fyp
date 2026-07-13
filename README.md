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
    <h3>TABLE III: Per-Class Metrics for Swin-Tiny Network</h3>
<table width="100%">
  <thead>
    <tr bgcolor="#f2f2f2">
      <th align="center">Pathology Class</th>
      <th align="left">Description</th>
      <th align="center">Precision</th>
      <th align="center">Recall</th>
      <th align="center">F₁-Score</th>
      <th align="center">AUC</th>
      <th align="center">Test Support</th>
    </tr>
  </thead>
  <tbody>
    <tr><td align="center"><b>N</b></td><td>Normal Fundus</td><td align="center">0.79</td><td align="center">0.84</td><td align="center">0.81</td><td align="center">0.9590</td><td align="center">160</td></tr>
    <tr><td align="center"><b>CAT</b></td><td>Cataract</td><td align="center">0.90</td><td align="center">0.84</td><td align="center">0.87</td><td align="center">0.9179</td><td align="center">31</td></tr>
    <tr><td align="center"><b>G</b></td><td>Glaucoma</td><td align="center">0.92</td><td align="center">0.93</td><td align="center">0.93</td><td align="center">0.9895</td><td align="center">135</td></tr>
    <tr><td align="center"><b>MY</b></td><td>Myopic Maculopathy</td><td align="center">0.95</td><td align="center">0.95</td><td align="center">0.95</td><td align="center">0.9925</td><td align="center">95</td></tr>
    <tr><td align="center"><b>AMD</b></td><td>Age-related Macular Degeneration</td><td align="center">0.90</td><td align="center">0.80</td><td align="center">0.85</td><td align="center">0.9799</td><td align="center">69</td></tr>
    <tr><td align="center"><b>ERM</b></td><td>Epiretinal Membrane</td><td align="center">0.60</td><td align="center">0.84</td><td align="center">0.70</td><td align="center">0.9677</td><td align="center">43</td></tr>
    <tr><td align="center"><b>DR</b></td><td>Diabetic Retinopathy</td><td align="center">0.95</td><td align="center">0.93</td><td align="center">0.94</td><td align="center">0.9885</td><td align="center">120</td></tr>
    <tr><td align="center"><b>RS</b></td><td>Retinoschisis</td><td align="center">1.00</td><td align="center">0.98</td><td align="center">0.99</td><td align="center">0.9999</td><td align="center">61</td></tr>
    <tr><td align="center"><b>HTR</b></td><td>Hypertensive Retinopathy</td><td align="center">0.88</td><td align="center">0.85</td><td align="center">0.86</td><td align="center">0.9765</td><td align="center">84</td></tr>
    <tr><td align="center"><b>BRVO</b></td><td>Branch Retinal Vein Occlusion</td><td align="center">0.81</td><td align="center">0.96</td><td align="center">0.88</td><td align="center">0.9996</td><td align="center">26</td></tr>
    <tr><td align="center"><b>LS</b></td><td>Laser Scars</td><td align="center">0.95</td><td align="center">0.87</td><td align="center">0.91</td><td align="center">0.9994</td><td align="center">23</td></tr>
  </tbody>
</table>

  </tbody>
</table>

