import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import ErrorBoundary from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import CreateRequirement from "./pages/CreateRequirement";
import EnhancedCreateRequirement from "./components/EnhancedCreateRequirement";
import RequirementDetail from "./pages/RequirementDetail";
import ProjectDetail from "./pages/ProjectDetail";
import { RequirementProvider } from "./context/RequirementContext";
import { NotificationProvider } from "./context/NotificationContext";

function App() {
  return (
    <ErrorBoundary>
      <RequirementProvider>
        <NotificationProvider>
          <div className="min-h-screen bg-gray-50">
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/create" element={<EnhancedCreateRequirement />} />
                <Route
                  path="/requirement/:project_id"
                  element={<RequirementDetail />}
                />
                <Route
                  path="/project/:project_id"
                  element={<ProjectDetail />}
                />
              </Routes>
            </Layout>
          </div>
        </NotificationProvider>
      </RequirementProvider>
    </ErrorBoundary>
  );
}

export default App;
