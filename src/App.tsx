import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { DashboardPage } from './pages/DashboardPage';
import { IntakePage } from './pages/IntakePage';
import { WashingPage } from './pages/WashingPage';
import { PackingPage } from './pages/PackingPage';
import { SterilizingPage } from './pages/SterilizingPage';
import { DistributionPage } from './pages/DistributionPage';
import { MasterDataPage } from './pages/MasterDataPage';
import { ReportsPage } from './pages/ReportsPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/intake" element={<IntakePage />} />
          <Route path="/washing" element={<WashingPage />} />
          <Route path="/packing" element={<PackingPage />} />
          <Route path="/sterilizing" element={<SterilizingPage />} />
          <Route path="/distribution" element={<DistributionPage />} />
          <Route path="/admin" element={<MasterDataPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
