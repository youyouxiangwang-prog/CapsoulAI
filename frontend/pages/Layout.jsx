
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Mic, Calendar, Settings, Sparkles } from "lucide-react";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    {
      name: "Capture",
      url: createPageUrl("Capture"),
      icon: Mic,
    },
    {
      name: "Plan",
      url: createPageUrl("Plans"),
      icon: Calendar,
    },
    {
      name: "Moments",
      url: createPageUrl("Moments"),
      icon: Sparkles,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <style>
        {`
          :root {
            --primary-start: #1DB8E8;
            --primary-end: #1E88E5;
            --secondary: #0F172A;
            --surface: rgba(255, 255, 255, 0.8);
            --surface-glass: rgba(255, 255, 255, 0.95);
          }
          .glass-effect {
            background: var(--surface-glass);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.2);
          }
          .gradient-text {
            background: linear-gradient(135deg, var(--primary-start), var(--primary-end));
            background-clip: text;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }
          .gradient-bg {
            background: linear-gradient(135deg, var(--primary-start), var(--primary-end));
          }
        `}
      </style>
      
      <div className="relative">
        {/* Desktop/Tablet Layout */}
        <div className="hidden md:flex">
          {/* Sidebar */}
          <div className="w-64 lg:w-80 glass-effect border-r border-white/20 min-h-screen p-6">
            <div className="space-y-12">
              {/* Logo - Bigger */}
              <div className="text-center pt-2">
                <img 
                  src="docs/statics/imgs/Capsoullogo.png" 
                  alt="Capsoul Logo" 
                  className="h-24 w-auto mx-auto" 
                />
              </div>

              {/* Navigation */}
              <nav className="space-y-2">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <Link
                      key={item.name}
                      to={item.url}
                      className={`flex items-center px-6 py-4 rounded-2xl transition-all duration-200 ${
                        isActive
                          ? "gradient-bg text-white shadow-lg"
                          : "text-slate-600 hover:text-[var(--primary-end)] hover:bg-white/50"
                      }`}
                    >
                      <item.icon className={`w-6 h-6 mr-4 ${isActive ? "text-white" : ""}`} />
                      <span className={`font-medium text-lg ${isActive ? "text-white" : ""}`}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-auto relative">
            {/* Settings Icon - Top Right (Desktop only) */}
            <div className="absolute top-6 right-6 z-50">
              <button 
                onClick={() => navigate(createPageUrl("Settings"))}
                className="p-3 rounded-full glass-effect hover:shadow-lg transition-shadow"
              >
                <Settings className="w-6 h-6 gradient-text" />
              </button>
            </div>
            
            {/* Content with proper right margin to avoid overlap */}
            <div className="pr-20">
              {children}
            </div>
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="md:hidden flex flex-col max-w-md mx-auto relative min-h-screen">
          {/* Settings Icon - Top Right (Mobile) */}
          <div className="absolute top-6 right-6 z-50">
            <button 
              onClick={() => navigate(createPageUrl("Settings"))}
              className="p-3 rounded-full glass-effect hover:shadow-lg transition-shadow"
            >
              <Settings className="w-6 h-6 gradient-text" />
            </button>
          </div>

          {/* Main Content Area */}
          <main className="flex-1 overflow-auto pb-20 pt-16">
            {children}
          </main>

          {/* Bottom Navigation */}
          <nav className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md">
            <div className="glass-effect border-t border-white/20 px-6 py-3">
              <div className="flex justify-around items-center">
                {navigationItems.map((item) => {
                  const isActive = location.pathname === item.url;
                  return (
                    <Link
                      key={item.name}
                      to={item.url}
                      className={`flex flex-col items-center py-2 px-4 rounded-xl transition-all duration-300 ${
                        isActive
                          ? "gradient-bg text-white shadow-lg transform scale-105"
                          : "text-slate-600 hover:text-[var(--primary-end)] hover:bg-white/50"
                      }`}
                    >
                      <item.icon className={`w-6 h-6 mb-1 ${isActive ? "text-white" : ""}`} />
                      <span className={`text-xs font-medium ${isActive ? "text-white" : ""}`}>
                        {item.name}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
