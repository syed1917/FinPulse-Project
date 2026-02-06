import React, { useRef, useState } from 'react';
import { LayoutDashboard, FileText, Upload, ChevronLeft, ChevronRight, Menu } from 'lucide-react';

export default function DashboardLayout({ children, currentView, onNavigate, onFileUpload, t }) {
    const fileInputRef = useRef(null);
    const [isCollapsed, setIsCollapsed] = useState(false);

    // Safe Translation Access
    const safeT = t || {};

    const toggleSidebar = () => setIsCollapsed(!isCollapsed);

    const navItems = [
        { id: 'dashboard', label: safeT.navDashboard || "Dashboard", icon: LayoutDashboard },
        { id: 'reports', label: safeT.navReports || "Reports", icon: FileText },
    ];

    const handleUploadClick = () => {
        if (fileInputRef.current) fileInputRef.current.click();
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && onFileUpload) onFileUpload(file);
        event.target.value = null; // Reset input so you can upload the same file twice if needed
    };

    return (
        <div className="flex h-screen bg-gray-50 font-sans overflow-hidden">
            {/* Hidden Input: Now accepts Images for Receipt Scanning */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".csv, .xlsx, .pdf, .docx, .jpg, .jpeg, .png, .webp"
                className="hidden"
            />

            {/* SIDEBAR */}
            <aside
                className={`bg-white border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'
                    } hidden md:flex`}
            >
                {/* Logo Area */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
                    <div className={`flex items-center ${isCollapsed ? 'justify-center w-full' : ''}`}>
                        <div className="h-8 w-8 bg-blue-600 rounded-lg shadow-sm flex-shrink-0"></div>
                        {!isCollapsed && <span className="ml-3 text-xl font-bold text-gray-800 tracking-tight overflow-hidden whitespace-nowrap">FinPulse</span>}
                    </div>
                    {!isCollapsed && (
                        <button onClick={toggleSidebar} className="p-1 rounded hover:bg-gray-100 text-gray-400">
                            <ChevronLeft size={20} />
                        </button>
                    )}
                </div>

                {/* Navigation Items */}
                <nav className="p-4 space-y-2 flex-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`flex items-center p-3 rounded-lg text-sm font-medium transition-all ${currentView === item.id ? 'bg-blue-50 text-blue-700' : 'text-gray-600 hover:bg-gray-50'
                                } ${isCollapsed ? 'justify-center' : ''}`}
                            title={isCollapsed ? item.label : ""}
                        >
                            <item.icon size={22} className={currentView === item.id ? 'text-blue-600' : 'text-gray-400'} />
                            {!isCollapsed && <span className="ml-3 overflow-hidden whitespace-nowrap">{item.label}</span>}
                        </button>
                    ))}

                    {/* Upload Button */}
                    <button
                        onClick={handleUploadClick}
                        className={`flex items-center p-3 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 w-full ${isCollapsed ? 'justify-center' : ''}`}
                        title={isCollapsed ? (safeT.navSources || "Data Sources") : ""}
                    >
                        <Upload size={22} className="text-gray-400" />
                        {!isCollapsed && <span className="ml-3 overflow-hidden whitespace-nowrap">{safeT.navSources || "Data Sources"}</span>}
                    </button>
                </nav>

                {/* Expand Button (Only visible when collapsed) */}
                {isCollapsed && (
                    <div className="p-4 border-t border-gray-100 flex justify-center">
                        <button onClick={toggleSidebar} className="p-2 rounded hover:bg-gray-100 text-gray-500">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                )}
            </aside>

            {/* MAIN CONTENT AREA */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Mobile Header */}
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
                    <div className="flex items-center">
                        <button className="md:hidden mr-4 text-gray-500"><Menu size={24} /></button>
                        <h2 className="text-lg font-bold text-gray-800">
                            {currentView === 'dashboard' ? (safeT.navDashboard || 'Dashboard') : (safeT.navReports || 'Reports')}
                        </h2>
                    </div>
                    {/* User Profile / Context */}
                    <div className="flex items-center space-x-4">
                        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">User</div>
                    </div>
                </header>

                {/* Scrollable Page Content */}
                <div className="flex-1 overflow-y-auto p-4 lg:p-6 bg-gray-50">
                    <div className="max-w-7xl mx-auto h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}