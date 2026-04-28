import React, { useCallback, useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { ToastProvider } from './components/Toast';
import { CandidateFormModal } from './components/CandidateFormModal';
import { Dashboard } from './pages/Dashboard';
import { Candidates } from './pages/Candidates';
import { CandidateDetail } from './pages/CandidateDetail';
import { Positions } from './pages/Positions';
import { Tests } from './pages/Tests';
import { Results } from './pages/Results';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { TestApplication } from './pages/TestApplication';
import { Candidate } from './types';
import { Login } from './login';

function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [testId, setTestId] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // 🔍 Verificar si hay sesión guardada al cargar la app
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // 🚀 Manejar login exitoso
  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setCurrentPage('dashboard');
  };

  // 🚪 Manejar logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full"></div>
        </div>
      </div>);

  }

  if (!isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  const handleViewCandidate = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setCurrentPage('candidate-detail');
  };

  const handleBackToCandidates = () => {
    setSelectedCandidate(null);
    setCurrentPage('candidates');
  };

  const handleAddNewCandidate = () => {
    setShowCandidateModal(true);
  };

  const handleCandidateAdded = useCallback(() => {
    setShowCandidateModal(false);
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleApplyTest = (testId: string, candidateId: string) => {
    setTestId(testId);
    setCandidateId(candidateId);
    setCurrentPage('test-application');
  };

  const renderPage = () => {
    if (currentPage === 'test-application') {
      return <TestApplication testId={testId} candidateId={candidateId} />;
    }
    if (currentPage === 'candidate-detail' && selectedCandidate) {
      return (
        <CandidateDetail
          candidate={selectedCandidate}
          onBack={handleBackToCandidates}
          onAddNew={handleAddNewCandidate} />);


    }
    return (
      <Layout
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        onLogout={handleLogout}>
        
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'candidates' &&
        <Candidates
          key={refreshKey}
          onViewCandidate={handleViewCandidate}
          onAddNewCandidate={handleAddNewCandidate} />

        }
        {currentPage === 'positions' && <Positions />}
        {currentPage === 'tests' && <Tests onApplyTest={handleApplyTest} />}
        {currentPage === 'results' && <Results />}
        {currentPage === 'reports' && <Reports />}
        {currentPage === 'settings' && <Settings />}
      </Layout>);

  };

  return (
    <>
      {renderPage()}
      <CandidateFormModal
        isOpen={showCandidateModal}
        onClose={() => setShowCandidateModal(false)}
        onSuccess={handleCandidateAdded} />
      
    </>);

}

export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>);

}