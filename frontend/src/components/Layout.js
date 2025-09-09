import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import NotificationBell from "./NotificationBell";

const Layout = ({ children }) => {
  const location = useLocation();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isActive = (path) => location.pathname === path;

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Dispatch custom event for dashboard refresh
    window.dispatchEvent(new CustomEvent("dashboardRefresh"));

    // Reset refreshing state after a short delay
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-brand-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-brand-500">
                  ReqGenAI
                </h1>
                <p className="text-xs text-gray-500">
                  Intelligent Requirement Generation
                </p>
              </div>
            </Link>

            <div className="flex-1"></div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-6">
              {/* Notification Bell */}
              <NotificationBell />
              {isActive("/") && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`p-2 rounded-md transition-colors ${
                    isRefreshing
                      ? "text-brand-500 bg-brand-50 cursor-not-allowed"
                      : "text-gray-700 hover:text-brand-500 hover:bg-gray-100"
                  }`}
                  title="Refresh Dashboard"
                >
                  <svg
                    className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              )}

              <Link to="/create">
                <button className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-brand-500 rounded-md hover:bg-brand-600 transition-colors">
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  New Requirement
                </button>
              </Link>
            </div>

            {/* Mobile Menu */}
            <div className="md:hidden flex items-center space-x-2">
              {/* Notification Bell for Mobile */}
              <NotificationBell />
              {isActive("/") && (
                <button
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className={`p-2 rounded-md transition-colors ${
                    isRefreshing
                      ? "text-brand-500 bg-brand-50 cursor-not-allowed"
                      : "text-gray-700 hover:text-brand-500 hover:bg-gray-100"
                  }`}
                  title="Refresh Dashboard"
                >
                  <svg
                    className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              )}
              <button className="p-2 text-gray-700 hover:text-brand-500 hover:bg-gray-100 rounded-md">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="text-sm text-gray-500">
              © 2024 ReqGenAI. All rights reserved.
            </p>
            <div className="flex space-x-4">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                System Online
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
