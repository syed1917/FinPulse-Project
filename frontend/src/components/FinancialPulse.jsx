import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity, CheckCircle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

const formatCurrency = (value) => {
    if (value === null || value === undefined) return "$0.00";
    const absValue = Math.abs(value);
    if (absValue >= 1.0e9) return (value / 1.0e9).toFixed(2) + "B";
    if (absValue >= 1.0e6) return (value / 1.0e6).toFixed(2) + "M";
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
};

export default function FinancialPulse({ data, loading, t }) {
    // Safety check for translations
    const safeT = t || {};

    if (loading) return (
        <div className="flex flex-col items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-500 animate-pulse">Analyzing Financial Data...</p>
        </div>
    );

    if (!data) return <div className="p-10 text-center text-gray-500">No data loaded.</div>;

    const { score, metrics, ai_analysis } = data;
    const isCritical = score < 50;

    const chartData = Object.entries(metrics.monthly_trend || {})
        .map(([date, val]) => ({ date, value: val }))
        .sort((a, b) => new Date(a.date) - new Date(b.date));

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                {/* GRAPH CARD - INCREASED HEIGHT HERE */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">{safeT.cashFlowTrend || "Cash Flow Trend"}</h3>

                    {/* Changed h-72 to h-[500px] for a taller graph */}
                    <div className="h-[500px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9ca3af' }} dy={10} />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#9ca3af' }}
                                    width={60}
                                    domain={['auto', 'auto']}
                                    tickFormatter={(val) => {
                                        if (val === 0) return "$0";
                                        if (Math.abs(val) >= 1.0e9) return (val / 1.0e9).toFixed(1) + "B";
                                        if (Math.abs(val) >= 1.0e6) return (val / 1.0e6).toFixed(1) + "M";
                                        if (Math.abs(val) >= 1.0e3) return (val / 1.0e3).toFixed(0) + "k";
                                        return val;
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [formatCurrency(value), "Net Cash Flow"]}
                                />
                                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* METRICS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
                        <p className="text-sm font-medium text-gray-500 mb-1">{safeT.runway || "Runway"}</p>
                        <div className="flex items-end justify-between">
                            <p className="text-2xl font-bold text-gray-900">{metrics.runway_months} <span className="text-sm text-gray-400 font-normal">{safeT.months || "Mo"}</span></p>
                            <Activity size={20} className={metrics.runway_months > 6 ? "text-green-500" : "text-amber-500"} />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
                        <p className="text-sm font-medium text-gray-500 mb-1">{safeT.monthlyBurn || "Avg Burn"}</p>
                        <div className="flex items-end justify-between">
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.burn_rate)}</p>
                            <TrendingDown size={20} className="text-red-500" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col justify-between">
                        <p className="text-sm font-medium text-gray-500 mb-1">{safeT.netMargin || "Net Margin"}</p>
                        <div className="flex items-end justify-between">
                            <p className={`text-2xl font-bold ${metrics.net_margin_percent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {metrics.net_margin_percent}%
                            </p>
                            <DollarSign size={20} className="text-blue-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* AI ANALYSIS */}
            <div className="lg:col-span-1 space-y-6">
                <div className={`p-6 rounded-xl border shadow-sm ${isCritical ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                    <div className="flex justify-between items-center mb-5">
                        <h3 className="text-base font-bold text-gray-900">{safeT.healthScore || "Health Score"}</h3>
                        <span className={`text-2xl font-bold ${score > 70 ? 'text-green-600' : 'text-amber-600'}`}>{score}/100</span>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{ai_analysis.summary}</p>
                    <h4 className="text-sm font-semibold text-gray-800 mb-2">{safeT.actions || "Actions"}</h4>
                    <ul className="space-y-3">
                        {ai_analysis.actions.map((action, idx) => (
                            <li key={idx} className="flex items-start text-sm bg-white p-2 rounded border border-gray-100">
                                <CheckCircle size={14} className="mt-1 mr-2 text-blue-600 flex-shrink-0" />
                                <span className="text-gray-700">{action}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}