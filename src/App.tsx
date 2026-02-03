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
import { WardSendPage } from './pages/WardSendPage';
import { WardReceivePage } from './pages/WardReceivePage';
import { WardRequestPage } from './pages/WardRequestPage';

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
          <Route path="/ward/send" element={<WardSendPage />} />
          <Route path="/ward/receive" element={<WardReceivePage />} />
          <Route path="/ward/request" element={<WardRequestPage />} />
          <Route path="/admin" element={<MasterDataPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
