import React, { useState } from 'react';
import { Download, FileBarChart, Edit2, Save, X, Check } from 'lucide-react';
import axios from 'axios';

const formatCurrency = (value) => {
    if (value === null || value === undefined) return "$0.00";
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(value);
};

const CATEGORIES = [
    "Revenue", "COGS", "Payroll", "Rent", "Software",
    "Marketing", "Travel", "Utilities", "Uncategorized",
    "Operational", "Financial", "Legal"
];

export default function Reports({ transactions, t, onUpdate }) {
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    // Group categories for summary cards
    const categorySummary = transactions.reduce((acc, txn) => {
        acc[txn.category] = (acc[txn.category] || 0) + txn.amount;
        return acc;
    }, {});

    const startEdit = (txn) => {
        setEditingId(txn.id);
        setEditForm({ ...txn });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = async () => {
        setSaving(true);
        try {
            // 1. Call Backend
            await axios.put(`http://localhost:8000/api/v1/transactions/${editForm.id}`, {
                category: editForm.category,
                description: editForm.description
            });

            // 2. Update Frontend Parent State
            onUpdate(editForm);
            setEditingId(null);
        } catch (error) {
            console.error("Failed to update transaction", error);
            alert("Failed to save changes.");
        } finally {
            setSaving(false);
        }
    };

    const downloadCSV = () => {
        if (!transactions.length) return alert("No data");
        const headers = ["Date,Description,Category,Amount"];
        const rows = transactions.map(t =>
            `${t.date},"${t.description.replace(/"/g, '""')}",${t.category},${t.amount}`
        );
        const blob = new Blob([headers.concat(rows).join("\n")], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `report_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 flex items-center">
                        <FileBarChart className="mr-2 text-blue-600" /> {t?.navReports || "Financial Report"}
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">Review and categorize your transactions</p>
                </div>
                <button
                    onClick={downloadCSV}
                    className="mt-4 sm:mt-0 flex items-center space-x-2 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 transition"
                >
                    <Download size={16} />
                    <span>{t?.exportCSV || "Export CSV"}</span>
                </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.entries(categorySummary).map(([cat, amount]) => (
                    <div key={cat} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">{cat}</p>
                        <p className={`text-2xl font-bold mt-2 ${amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {amount >= 0 ? '+' : ''}{formatCurrency(amount).replace('$', '')}
                        </p>
                    </div>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-700">Transaction Ledger</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Description</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase">Category</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Amount</th>
                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {transactions.map((txn, idx) => (
                                <tr key={txn.id || idx} className="hover:bg-gray-50 transition">
                                    {/* DATE */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                        {txn.date}
                                    </td>

                                    {/* DESCRIPTION */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {editingId === txn.id ? (
                                            <input
                                                type="text"
                                                className="border border-gray-300 rounded px-2 py-1 w-full focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            />
                                        ) : (
                                            <div className="max-w-xs truncate" title={txn.description}>{txn.description}</div>
                                        )}
                                    </td>

                                    {/* CATEGORY */}
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        {editingId === txn.id ? (
                                            <select
                                                className="border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                                                value={editForm.category}
                                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                            >
                                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-1 rounded-md text-xs font-bold border ${txn.amount > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'
                                                }`}>
                                                {txn.category}
                                            </span>
                                        )}
                                    </td>

                                    {/* AMOUNT */}
                                    <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-bold ${txn.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {txn.amount >= 0 ? '+' : ''}{formatCurrency(txn.amount)}
                                    </td>

                                    {/* ACTIONS */}
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {editingId === txn.id ? (
                                            <div className="flex justify-end space-x-2">
                                                <button onClick={saveEdit} disabled={saving} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                                    <Check size={18} />
                                                </button>
                                                <button onClick={cancelEdit} disabled={saving} className="p-1 text-red-600 hover:bg-red-50 rounded">
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button onClick={() => startEdit(txn)} className="p-1 text-blue-600 hover:bg-blue-50 rounded">
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}