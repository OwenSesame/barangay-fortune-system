import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function ReceiptModal({ isOpen, onClose, orNumber, requestId, onFinalize, mode = 'preview' }) {
    const [receiptData, setReceiptData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isOpen || !requestId) return;
        
        const fetchReceipt = async () => {
            setLoading(true);
            try {
                // If mode is 'preview' (during release), we fetch print-data or receipt data
                // If mode is 'audit', we fetch receipt data directly by requestId
                const res = await axios.get(`http://localhost:5000/api/staff/receipt/${requestId}`);
                setReceiptData(res.data);
            } catch (error) {
                console.error(error);
                toast.error("Failed to load receipt data.");
            } finally {
                setLoading(false);
            }
        };
        fetchReceipt();
    }, [isOpen, requestId]);

    if (!isOpen) return null;

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1050 }}>
            <style>
                {`
                    @media print {
                        body * {
                            visibility: hidden !important;
                        }
                        .printable-receipt-slip, .printable-receipt-slip * {
                            visibility: visible !important;
                        }
                        .printable-receipt-slip {
                            position: fixed !important;
                            left: 50% !important;
                            top: 20px !important;
                            transform: translateX(-50%) !important;
                            width: 380px !important;
                            max-width: 100% !important;
                            margin: 0 !important;
                            padding: 24px !important;
                            box-shadow: none !important;
                            border: 2px dashed #334155 !important;
                            background: white !important;
                            color: black !important;
                        }
                        .no-print {
                            display: none !important;
                        }
                    }
                `}
            </style>

            <div className="printable-receipt-slip" style={{ background: 'white', padding: '30px', borderRadius: '12px', width: '450px', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px' }}>Loading Receipt...</div>
                ) : receiptData ? (
                    <>
                        <div style={{ textAlign: 'center', borderBottom: '2px dashed #cbd5e1', paddingBottom: '15px', marginBottom: '15px' }}>
                            <h2 style={{ margin: 0, color: '#0f172a', fontSize: '22px', letterSpacing: '1px', textTransform: 'uppercase' }}>Official Receipt</h2>
                            <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '13px' }}>Barangay Fortune, Marikina City</p>
                            <p style={{ margin: '2px 0 0 0', color: '#94a3b8', fontSize: '11px' }}>Official E-Serbisyo Transaction Slip</p>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ color: '#64748b', fontSize: '13px' }}>Date:</span>
                            <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: 'bold' }}>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ color: '#64748b', fontSize: '13px' }}>OR Number:</span>
                            <span style={{ color: '#16a34a', fontSize: '15px', fontWeight: 'bold', letterSpacing: '1px' }}>{orNumber || receiptData.or_number || 'N/A'}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ color: '#64748b', fontSize: '13px' }}>Resident:</span>
                            <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: 'bold' }}>{receiptData.first_name} {receiptData.last_name}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <span style={{ color: '#64748b', fontSize: '13px' }}>Document:</span>
                            <span style={{ color: '#0f172a', fontSize: '13px', fontWeight: 'bold' }}>{receiptData.doc_name}</span>
                        </div>
                        
                        <div style={{ borderTop: '2px dashed #cbd5e1', paddingTop: '15px', marginTop: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#0f172a', fontSize: '16px', fontWeight: 'bold' }}>TOTAL AMOUNT:</span>
                            <span style={{ color: '#0f172a', fontSize: '18px', fontWeight: 'bold' }}>₱{receiptData.base_fee || '0.00'}</span>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '25px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                            <p style={{ margin: 0, color: '#64748b', fontSize: '12px' }}>Processed By: <b>{receiptData.staff_name || 'Front Desk Staff'}</b></p>
                            <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '10px' }}>Thank you for transacting with Barangay Fortune.</p>
                        </div>
                        
                        <div className="no-print" style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '25px' }}>
                            {mode === 'preview' ? (
                                <>
                                    <button onClick={onClose} style={{ padding: '10px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel</button>
                                    <button onClick={() => window.print()} style={{ padding: '10px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>🖨️ Print Slip</button>
                                    <button onClick={onFinalize} style={{ padding: '10px 16px', background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}>Finalize & Release</button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => window.print()} style={{ padding: '10px 20px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}>🖨️ Print Slip</button>
                                    <button onClick={onClose} style={{ padding: '10px 20px', background: '#64748b', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', flex: 1 }}>Close</button>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#ef4444' }}>
                        Error: Could not load receipt details.
                        <div className="no-print" style={{ marginTop: '20px' }}>
                            <button onClick={onClose} style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>Close</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
