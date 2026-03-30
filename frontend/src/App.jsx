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

function AppLayout() {
  return (
    <div className="app-layout">
      <Header />
      <main className="main-content">
        <div className="page-container">
          <Routes>
            <Route path="/" element={<HomePage />} />
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
        <AppLayout />
      </AppProvider>
    </BrowserRouter>
  );
}

