import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { ToastProvider, useToast } from './components/Toast';
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
function AppContent() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [showCandidateModal, setShowCandidateModal] = useState(false);
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
  const renderPage = () => {
    if (currentPage === 'test-application') {
      return <TestApplication />;
    }
    if (currentPage === 'candidate-detail' && selectedCandidate) {
      return (
        <CandidateDetail
          candidate={selectedCandidate}
          onBack={handleBackToCandidates}
          onAddNew={handleAddNewCandidate} />);


    }
    return (
      <Layout currentPage={currentPage} onNavigate={setCurrentPage}>
        {currentPage === 'dashboard' && <Dashboard />}
        {currentPage === 'candidates' &&
        <Candidates
          onViewCandidate={handleViewCandidate}
          onAddNewCandidate={handleAddNewCandidate} />

        }
        {currentPage === 'positions' && <Positions />}
        {currentPage === 'tests' && <Tests />}
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
        onClose={() => setShowCandidateModal(false)} />
      
    </>);

}
export function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>);

}