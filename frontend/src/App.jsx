import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import ApiKeyModal from './components/ApiKeyModal';
import HRAssistant from './components/HRAssistant';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import Login from './pages/Login';
import CareersPortal from './pages/CareersPortal';
import AccessDenied from './components/AccessDenied';
import { apiService } from './api/apiService';

const allowedTabsByRole = {
  Admin: ['overview', 'employees', 'payroll', 'policies'],
  'Senior Manager': ['overview', 'team', 'leaves'],
  'HR Recruiter': ['overview', 'jobs', 'screening', 'interviews'],
  Employee: ['portal', 'leaves', 'payslips', 'performance']
};

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('smart_hrms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [activeTab, setActiveTab] = useState(() => {
    const saved = localStorage.getItem('smart_hrms_user');
    const user = saved ? JSON.parse(saved) : null;
    return user?.role === 'Employee' ? 'portal' : 'overview';
  });
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCareers, setShowCareers] = useState(false);

  const currentRole = currentUser?.role || 'Guest';
  const allowedTabs = allowedTabsByRole[currentRole] || [];
  const isTabAllowed = allowedTabs.includes(activeTab);

  // Check key status on mount / updates
  useEffect(() => {
    const checkKey = async () => {
      try {
        const res = await apiService.hasGeminiKey();
        setHasKey(res.hasKey);
      } catch (e) {
        console.error('Failed to check backend Gemini key status', e);
      }
    };
    checkKey();
  }, [refreshKey]);

  // Load employee profile matching the logged-in user
  useEffect(() => {
    const loadEmployee = async () => {
      if (!currentUser) {
        setCurrentEmployee(null);
        return;
      }
      try {
        const emp = await apiService.getProfile();
        setCurrentEmployee(emp);
      } catch (e) {
        console.error('Failed to load employee profile', e);
        // Fallback
        setCurrentEmployee(currentUser);
      }
    };
    loadEmployee();
  }, [currentUser, refreshKey]);

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    localStorage.setItem('smart_hrms_user', JSON.stringify(user));
    if (user.role === 'Employee') {
      setActiveTab('portal');
    } else {
      setActiveTab('overview');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentEmployee(null);
    localStorage.removeItem('smart_hrms_user');
  };

  const handleTriggerRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (!currentUser) {
    if (showCareers) {
      return <CareersPortal onClose={() => setShowCareers(false)} onLoginSuccess={handleLoginSuccess} />;
    }
    return <Login onLoginSuccess={handleLoginSuccess} onShowCareers={() => setShowCareers(true)} />;
  }

  if (currentUser.role === 'Candidate') {
    return <CareersPortal currentUser={currentUser} onLogout={handleLogout} />;
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-hidden">
      
      {/* 1. Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        currentRole={currentRole} 
        currentEmployee={currentEmployee} 
        onLogout={handleLogout}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Global Control Header */}
        <Header 
          currentRole={currentRole} 
          onOpenApiKey={() => setShowApiKeyModal(true)}
          hasKey={hasKey}
        />

        {/* Dynamic Scrollable Dashboard Panels */}
        <main className="flex-1 overflow-y-auto bg-slate-950/30">
          {!isTabAllowed ? (
            <AccessDenied 
              currentRole={currentRole} 
              onLogout={handleLogout} 
              onGoHome={() => {
                if (currentRole === 'Employee') {
                  setActiveTab('portal');
                } else {
                  setActiveTab('overview');
                }
              }}
            />
          ) : (
            <>
              {currentRole === 'Admin' && (
                <AdminDashboard 
                  activeSubTab={activeTab} 
                  refreshKey={refreshKey} 
                  onTriggerRefresh={handleTriggerRefresh} 
                />
              )}

              {currentRole === 'Senior Manager' && currentEmployee && (
                <ManagerDashboard 
                  activeSubTab={activeTab} 
                  currentEmployee={currentEmployee}
                  refreshKey={refreshKey} 
                  onTriggerRefresh={handleTriggerRefresh} 
                />
              )}

              {currentRole === 'HR Recruiter' && (
                <RecruiterDashboard 
                  activeSubTab={activeTab} 
                  refreshKey={refreshKey} 
                  onTriggerRefresh={handleTriggerRefresh} 
                />
              )}

              {currentRole === 'Employee' && currentEmployee && (
                <EmployeeDashboard 
                  activeSubTab={activeTab} 
                  currentEmployee={currentEmployee}
                  refreshKey={refreshKey} 
                  onTriggerRefresh={handleTriggerRefresh} 
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* 3. Floating AI chatbot assistant (Active for everyone contextually) */}
      {currentEmployee && (
        <HRAssistant currentEmployee={currentEmployee} />
      )}

      {/* 4. API Key Configuration Modal */}
      <ApiKeyModal 
        isOpen={showApiKeyModal} 
        onClose={() => setShowApiKeyModal(false)} 
        onSave={(k) => setHasKey(!!k)}
      />
    </div>
  );
}
