import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import TodayTrends from './pages/TodayTrends';
import Explore from './pages/Explore';
import Report from './pages/Report';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/today" element={<TodayTrends />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/report" element={<Report />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
