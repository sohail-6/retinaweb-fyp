import { create } from 'zustand';
import type { User } from 'firebase/auth'; 

// --- 1. DATA TYPES ---
export interface BreakdownItem {
  class: string;
  score: number;
  is_selected: boolean;
}

export interface ModelResult {
  name: string;
  confidence: number; 
  accuracy: number; 
  f1: number;
  predictedDisease: string;
  color: string;
  
  // FIX: Allow 'null' because the Ensemble model sends null, not undefined
  heatmap?: string | null;
  
  is_reliable?: boolean;
  threshold?: number;
  breakdown?: BreakdownItem[];
}

// --- 2. STORE STATE DEFINITION ---
interface StoreState {
  // === APP STATE ===
  uploadedFile: File | null;
  imagePreviewUrl: string | null;
  isProcessing: boolean;
  modelResults: ModelResult[];

  // === AUTH STATE ===
  user: User | null;
  isAuthLoading: boolean;

  // === ACTIONS ===
  setFile: (file: File) => void;
  analyzeImage: (file: File) => Promise<void>;
  
  // === AUTH ACTIONS ===
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
}

// --- 3. STORE IMPLEMENTATION ---
const useStore = create<StoreState>((set) => ({
  // Initial App State
  uploadedFile: null,
  imagePreviewUrl: null,
  isProcessing: false,
  modelResults: [],
  
  // Initial Auth State
  user: null,
  isAuthLoading: true, 

  // --- ACTIONS ---
  setFile: (file: File) => {
    const url = URL.createObjectURL(file);
    set({ uploadedFile: file, imagePreviewUrl: url });
  },

  analyzeImage: async (file: File) => {
    set({ isProcessing: true, modelResults: [] }); 

    try {
      const formData = new FormData();
      formData.append("file", file);

      // Send to Python Backend
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.detail || data?.error || `Server Error: ${response.statusText}`);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      if (data.predictions) {
        set({ modelResults: data.predictions, isProcessing: false });
      } else {
        console.error("Backend returned invalid format:", data);
        set({ isProcessing: false });
      }

    } catch (error) {
      console.error("Error analyzing image:", error);
      throw error instanceof Error
        ? error
        : new Error("Failed to analyze image. Please try again.");
    } finally {
      set({ isProcessing: false });
    }
  },

  // --- AUTH ACTIONS ---
  setUser: (user) => set({ user }),
  setAuthLoading: (loading) => set({ isAuthLoading: loading }),
}));

export default useStore;