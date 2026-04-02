import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Header from './components/layout/Header';
import HomePage from './pages/HomePage';
import ClimateDashboard from './pages/ClimateDashboard';
import VisualizationLab from './pages/VisualizationLab';
import MapView from './pages/MapView';
import CityPage from './pages/CityPage';
import TravelPlanner from './pages/TravelPlanner';
import ExpenseModule from './pages/ExpenseModule';
import Landing3D from './pages/Landing3D';

function AppLayout() {
  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        <div className="page-container">
          <Routes>
            <Route path="/overview" element={<HomePage />} />
            <Route path="/dashboard" element={<ClimateDashboard />} />
            <Route path="/visualization" element={<VisualizationLab />} />
            <Route path="/map" element={<MapView />} />
            <Route path="/city" element={<CityPage />} />
            <Route path="/travel" element={<TravelPlanner />} />
            <Route path="/expenses" element={<ExpenseModule />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <Routes>
          {/* True Fullscreen Landing Page bypassing Header Framework */}
          <Route path="/" element={<Landing3D />} />
          {/* Wildcard Application Infrastructure matching the old routing */}
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </AppProvider>
    </BrowserRouter>
  );
}
