
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { FeatureStudio } from './components/FeatureStudio';
import { LoginPage } from './components/LoginPage';
import { ProfileSettings } from './components/ProfileSettings';
import { UserManagement } from './components/UserManagement';
import { AgentManagement } from './components/AgentManagement';
import { OptimizationAgent } from './components/OptimizationAgent';
import { GlobalStandardsEditor } from './components/GlobalStandardsEditor';
import { IntegrationManagement } from './components/IntegrationManagement';
import { DatabaseSchemaViewer } from './components/DatabaseSchemaViewer';
import { AuditLogs } from './components/AuditLogs';
import { Home } from './components/Home';
import { AuthProvider, SettingsProvider, ToastProvider, useToast, useAuth, NavigationProvider, AgentProvider, IntegrationProvider } from './contexts';
import { Toast } from './components/Toast';

function ToastContainer() {
  const { toasts, removeToast } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} onClose={removeToast} />
        </div>
      ))}
    </div>
  );
}

function MainLayout() {
  const { isAuthenticated, user, canManageUsers, canManageStructure, canManageGlobalStandards, canEditContent } = useAuth();
  
  // App View State: 'dashboard' | 'settings' | 'users' | 'agents' | 'integrations' | 'schema-query' | 'audit-logs' | 'optimization-agent'
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings' | 'users' | 'agents' | 'integrations' | 'schema-query' | 'audit-logs' | 'optimization-agent'>('dashboard');
  
  // Module State. Initialize to null to show Home by default.
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedModuleName, setSelectedModuleName] = useState<string>('');

  // Reset state when user changes or logs out
  React.useEffect(() => {
    if (!isAuthenticated) {
        setSelectedModuleId(null);
        setSelectedModuleName('');
        setCurrentView('dashboard');
    }
  }, [isAuthenticated]);

  // Permission Check Effect: Redirect if user stays on a page they don't have access to
  React.useEffect(() => {
      if (!isAuthenticated) return;

      // Check current view permissions
      if (currentView === 'users' && !canManageUsers) {
          setCurrentView('dashboard');
          setSelectedModuleId(null);
      }
      if (currentView === 'agents' && !canManageUsers) { // Assuming agent mgmt needs admin
          setCurrentView('dashboard');
          setSelectedModuleId(null);
      }
      if (currentView === 'audit-logs' && !canManageUsers) {
          setCurrentView('dashboard');
          setSelectedModuleId(null);
      }
      if (currentView === 'integrations' && !canManageUsers) {
          setCurrentView('dashboard');
          setSelectedModuleId(null);
      }
      // Schema query usually admin only
      if (currentView === 'schema-query' && !canManageUsers) {
          setCurrentView('dashboard');
          setSelectedModuleId(null);
      }
      
      // Global Standards check (if it was a view, but here it is a module ID in dashboard)
      if (selectedModuleId === 'global-standards' && !canManageGlobalStandards) {
          setSelectedModuleId(null);
          setSelectedModuleName('');
          setCurrentView('dashboard');
      }

  }, [isAuthenticated, user, currentView, selectedModuleId, canManageUsers, canManageGlobalStandards]);


  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  const handleModuleSelect = (id: string, name: string) => {
    setSelectedModuleId(id);
    setSelectedModuleName(name);
    setCurrentView('dashboard'); // Switch back to dashboard when a module is selected
  };

  const handleGoHome = () => {
    setSelectedModuleId(null);
    setSelectedModuleName('');
    setCurrentView('dashboard');
  };

  const renderContent = () => {
    if (currentView === 'settings') return <ProfileSettings />;
    if (currentView === 'users') return <UserManagement />;
    if (currentView === 'agents') return <AgentManagement />;
    if (currentView === 'integrations') return <IntegrationManagement />;
    if (currentView === 'schema-query') return <DatabaseSchemaViewer />;
    if (currentView === 'audit-logs') return <AuditLogs />;
    if (currentView === 'optimization-agent') return <OptimizationAgent />;

    // Dashboard View - switch based on module ID
    if (!selectedModuleId || selectedModuleId === 'home') {
      return <Home onNavigateToModule={handleModuleSelect} onNavigateToView={setCurrentView} />;
    }

    if (selectedModuleId === 'global-standards') {
      return <GlobalStandardsEditor />;
    }

    return (
      <FeatureStudio 
        moduleId={selectedModuleId} 
        moduleName={selectedModuleName} 
      />
    );
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      <Sidebar 
        onSelectModule={handleModuleSelect} 
        onGoHome={handleGoHome}
        selectedModuleId={currentView === 'dashboard' ? selectedModuleId : null} 
        onNavigate={setCurrentView}
        currentView={currentView}
      />
      
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <Header 
          moduleName={selectedModuleName} 
          onNavigate={setCurrentView}
          onGoHome={handleGoHome}
          currentView={currentView}
        />
        
        <div className="flex-1 overflow-auto bg-gray-50 dark:bg-black/20">
          {renderContent()}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <SettingsProvider>
          <NavigationProvider>
            <IntegrationProvider>
              <AgentProvider>
                  <MainLayout />
              </AgentProvider>
            </IntegrationProvider>
          </NavigationProvider>
        </SettingsProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
