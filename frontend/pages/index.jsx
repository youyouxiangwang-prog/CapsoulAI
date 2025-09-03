// File: src/pages/index.jsx
// --- FINAL, CORRECTED, AND SIMPLIFIED VERSION ---

import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';

// Import all your components
import Layout from "./Layout.jsx";
import Login from "./Login.jsx";
import Memories from "./Memories";
import Plans from "./Plans";
import Settings from "./Settings";
import RecordingDetails from "./RecordingDetails";
import Moments from "./Moments";
import Capture from "./Capture";
import TodoDetails from "./TodoDetails";
import SearchResults from "./SearchResults";
import MomentsSearchResults from "./MomentsSearchResults";
import GoogleAuthCallback from "./GoogleAuthCallback.jsx";

// Import your fetch interceptor if it exists
// import "../lib/installFetchRefresh";

const PAGES = {
    Memories,
    Plans,
    Settings,
    RecordingDetails,
    Moments,
    Capture,
    TodoDetails,
    SearchResults,
    MomentsSearchResults,
};

function _getCurrentPage(pathname) {
    const path = pathname.startsWith('/') ? pathname.substring(1) : pathname;
    const pageName = Object.keys(PAGES).find(p => p.toLowerCase() === path.toLowerCase());
    return pageName || 'Memories';
}

// --- 【【添加这个新的目标组件】】 ---
function RedirectTargetPage() {
    return (
        <div style={{ padding: '50px', textAlign: 'center', backgroundColor: 'lightgreen' }}>
            <h1>SUCCESS!</h1>
            <p>Redirect was successful.</p>
            <p>You have successfully navigated from a backend redirect to a frontend page.</p>
        </div>
    );
}



// --- Component 1: The Main application layout for protected pages ---
function AppLayout() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);

    return (
        <Layout currentPageName={currentPage}>
            {/* The Outlet will render the matched child route component (Memories, Plans, etc.) */}
            <Routes>
                <Route path="/Memories" element={<Memories />} />
                <Route path="/Plans" element={<Plans />} />
                <Route path="/Settings" element={<Settings />} />
                <Route path="/RecordingDetails" element={<RecordingDetails />} />
                <Route path="/Moments" element={<Moments />} />
                <Route path="/Capture" element={<Capture />} />
                <Route path="/redirect-target-page" element={<RedirectTargetPage />} />
                <Route path="/TodoDetails" element={<TodoDetails />} />
                <Route path="/SearchResults" element={<SearchResults />} />
                <Route path="/MomentsSearchResults" element={<MomentsSearchResults />} />
                {/* Default route for logged in users */}
                <Route path="/" element={<Navigate to="/Memories" replace />} />
                 {/* Fallback for any other unknown path */}
                <Route path="*" element={<Navigate to="/Memories" replace />} />
            </Routes>
        </Layout>
    );
}

// --- Component 2: The Authentication Logic and Router ---
function AppRouter() {
    const location = useLocation();
    const [token, setToken] = useState(() => localStorage.getItem("access_token"));

    useEffect(() => {
        // This effect handles the final step: receiving the token from the backend redirect.
        const params = new URLSearchParams(location.search);
        const tokenFromUrl = params.get("access_token");

        if (tokenFromUrl) {
            localStorage.setItem("access_token", tokenFromUrl);
            setToken(tokenFromUrl);
            // Clean the URL
            window.history.replaceState({}, document.title, location.pathname);
        }
    }, [location.search]);

    return (
        <Routes>
            {/* Public Route: Login Page */}
            <Route 
                path="/login" 
                element={token ? <Navigate to="/Memories" /> : <Login />} 
            />

            {/* Public Route: Google Callback Handler */}
            <Route 
                path="/auth/google/callback" 
                element={<GoogleAuthCallback />} 
            />

            {/* Protected Routes: All other pages */}
            <Route 
                path="/*" 
                element={token ? <AppLayout /> : <Navigate to="/login" />} 
            />
        </Routes>
    );
}

// --- Component 3: The Main Export ---
export default function Pages() {
    return (
        <Router>
            <AppRouter />
        </Router>
    );
}