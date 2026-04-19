import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { PublicDashboard } from './pages/PublicDashboard';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { getConfig } from './services/storageService';

const App: React.FC = () => {
  const [config, setConfig] = useState(getConfig());

  useEffect(() => {
    const updateConfig = () => setConfig(getConfig());
    window.addEventListener('storage', updateConfig);
    
    // Favicon Sync
    if (config.logoUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = config.logoUrl;
    }

    return () => window.removeEventListener('storage', updateConfig);
  }, [config.logoUrl]);

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<PublicDashboard />} />
          <Route path="/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;