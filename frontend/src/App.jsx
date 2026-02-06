import React, { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from './components/DashboardLayout';
import FinancialPulse from './components/FinancialPulse';
import Reports from './components/Reports';
import { UploadCloud, Globe, Briefcase } from 'lucide-react'; // Added Briefcase icon
import { translations } from './translations';

const INDUSTRIES = [
    "Retail",
    "Tech / SaaS",
    "Manufacturing",
    "Services",
    "Healthcare",
    "Hospitality",
    "Construction"
];

function App() {
    const [transactions, setTransactions] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [currentView, setCurrentView] = useState('dashboard');

    // --- STATE FOR SETTINGS ---
    const [language, setLanguage] = useState('en');
    const [industry, setIndustry] = useState('Retail'); // Default

    const t = translations[language] || translations['en'];

    const fetchReport = async () => {
        if (transactions.length === 0) return;

        setLoading(true);
        try {
            const response = await axios.post('http://localhost:8000/api/v1/generate-report', {
                company_name: "User Corp",
                industry: industry, // <--- NOW DYNAMIC
                language: language,
                transactions: transactions
            });
            setReportData(response.data);
        } catch (error) {
            console.error("Backend error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        try {
            setLoading(true);
            const response = await axios.post('http://localhost:8000/api/v1/upload-file', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (response.data.transactions) {
                const txnsWithId = response.data.transactions.map((t, i) => ({
                    ...t,
                    id: t.id || `demo-corp-id-${i}`
                }));
                setTransactions(txnsWithId);
                setCurrentView('dashboard');
            }
        } catch (error) {
            console.error("Upload error:", error);
            alert("Failed to upload.");
        } finally {
            setLoading(false);
        }
    };

    const handleTransactionUpdate = (updatedTxn) => {
        const newTransactions = transactions.map(t =>
            t.id === updatedTxn.id ? { ...t, ...updatedTxn } : t
        );
        setTransactions(newTransactions);
    };

    // Re-run analysis when transactions, language, OR industry changes
    useEffect(() => {
        if (transactions.length > 0) {
            fetchReport();
        }
    }, [transactions, language, industry]);

    return (
        <DashboardLayout
            currentView={currentView}
            onNavigate={setCurrentView}
            onFileUpload={handleFileUpload}
            t={t}
        >

            {currentView === 'dashboard' && (
                <>
                    <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">{t.dashboardTitle}</h2>
                            <p className="text-gray-500 mt-1">{t.dashboardSubtitle}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">

                            {/* INDUSTRY SELECTOR */}
                            <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                                <Briefcase size={16} className="text-gray-500 mr-2" />
                                <select
                                    value={industry}
                                    onChange={(e) => setIndustry(e.target.value)}
                                    className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer outline-none"
                                >
                                    {INDUSTRIES.map(ind => (
                                        <option key={ind} value={ind}>{ind}</option>
                                    ))}
                                </select>
                            </div>

                            {/* LANGUAGE SELECTOR */}
                            <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                                <Globe size={16} className="text-gray-500 mr-2" />
                                <select
                                    value={language}
                                    onChange={(e) => setLanguage(e.target.value)}
                                    className="bg-transparent border-none text-sm font-medium text-gray-700 focus:ring-0 cursor-pointer outline-none"
                                >
                                    <option value="en">English</option>
                                    <option value="es">Español</option>
                                    <option value="fr">Français</option>
                                    <option value="de">Deutsch</option>
                                    <option value="hi">हिंदी</option>
                                </select>
                            </div>

                            {transactions.length > 0 && (
                                <button
                                    onClick={fetchReport}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all active:scale-95"
                                >
                                    {t.refreshBtn}
                                </button>
                            )}
                        </div>
                    </div>

                    {transactions.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors">
                            <div className="p-4 bg-blue-50 rounded-full mb-4 animate-bounce">
                                <UploadCloud size={48} className="text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">{t.uploadTitle}</h3>
                            <p className="text-gray-500 mt-2 mb-6 text-center max-w-sm">
                                {t.uploadSubtitle}
                            </p>
                            <button
                                onClick={() => document.querySelector('input[type="file"]').click()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transition-all transform hover:-translate-y-1"
                            >
                                {t.uploadBtn}
                            </button>
                        </div>
                    ) : (
                        <FinancialPulse data={reportData} loading={loading} t={t} />
                    )}
                </>
            )}

            {currentView === 'reports' && (
                <Reports
                    transactions={transactions}
                    t={t}
                    onUpdate={handleTransactionUpdate}
                />
            )}

        </DashboardLayout>
    );
}

export default App;