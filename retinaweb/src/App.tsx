import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthListener } from "./components/AuthListener";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Upload from "./pages/Upload";
import Results from "./pages/Results";
import DiseaseInfo from "./pages/DiseaseInfo";
import ModelAnalytics from "./pages/ModelAnalytics";
import ModelDetail from "./pages/ModelDetail";

function App() {
  return (
    <Router>
      <AuthListener>
        <div className="min-h-screen bg-[#F8FAFC]">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            {/* Protected Routes */}
            <Route path="/" element={<Upload />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/results" element={<Results />} />
            <Route path="/info" element={<DiseaseInfo />} />
            <Route path="/model-analytics" element={<ModelAnalytics />} />
            <Route path="/model/:name" element={<ModelDetail />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </AuthListener>
    </Router>
  );
}

export default App;
