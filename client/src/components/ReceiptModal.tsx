import React, { useState, useEffect } from 'react';
import { X, Printer, Download, Share2, CheckCircle2 } from 'lucide-react';
import { apiRequest, formatLKR, formatDate } from '../api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReceiptModalProps {
  receiptNumber: string | null;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ receiptNumber, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!receiptNumber) return;
    setLoading(true);
    apiRequest(`/payments/receipt/${receiptNumber}`)
      .then(res => setData(res))
      .catch(err => console.error('Failed to load receipt:', err))
      .finally(() => setLoading(false));
  }, [receiptNumber]);

  if (!receiptNumber) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [80, 160] // Standard 80mm POS Thermal Receipt format
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(data.institute.name, 40, 10, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(data.institute.tagline, 40, 14, { align: 'center' });
    doc.text(data.institute.address, 40, 18, { align: 'center' });
    doc.text(`Tel: ${data.institute.phone}`, 40, 22, { align: 'center' });
    
    doc.line(5, 25, 75, 25);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`OFFICIAL RECEIPT: ${data.receiptNumber}`, 40, 30, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Date: ${formatDate(data.paymentDate)}`, 6, 36);
    doc.text(`Cashier: ${data.cashier}`, 6, 40);
    doc.text(`Student: ${data.student.fullName}`, 6, 45);
    doc.text(`ID: ${data.student.studentIdNumber} (${data.student.grade})`, 6, 49);
    
    doc.line(5, 52, 75, 52);
    
    let y = 58;
    data.items.forEach((item: any) => {
      doc.setFont('helvetica', 'bold');
      doc.text(item.classTitle, 6, y);
      y += 4;
      doc.setFont('helvetica', 'normal');
      doc.text(`Month: ${item.month}`, 6, y);
      doc.text(`Paid: Rs. ${item.amountPaid.toLocaleString()}`, 45, y);
      y += 4;
      doc.text(`Remaining Balance: Rs. ${item.remainingBalance.toLocaleString()}`, 6, y);
      y += 6;
    });

    doc.line(5, y, 75, y);
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`TOTAL PAID: Rs. ${data.totalPaid.toLocaleString()}`, 6, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Method: ${data.paymentMethod}`, 6, y);

    y += 10;
    doc.setFontSize(7);
    doc.text('Thank you for your payment!', 40, y, { align: 'center' });
    doc.text('Apex Education - Continuous Academic Excellence', 40, y + 4, { align: 'center' });

    doc.save(`Receipt_${data.receiptNumber}.pdf`);
  };

  const handleShareWhatsApp = () => {
    if (!data) return;
    const phone = data.student.parentPhone || '';
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const text = encodeURIComponent(
      `Official Tuition Receipt from ${data.institute.name}\n` +
      `Receipt No: ${data.receiptNumber}\n` +
      `Student: ${data.student.fullName} (${data.student.studentIdNumber})\n` +
      `Amount Paid: Rs. ${data.totalPaid.toLocaleString()}\n` +
      `Payment Date: ${formatDate(data.paymentDate)}\n` +
      `Payment Method: ${data.paymentMethod}\n` +
      `Thank you!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Action Bar (Hidden in Print) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50 print:hidden">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Payment Receipt</span>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-white border border-slate-200 shadow-sm transition-colors"
              title="Print Receipt"
            >
              <Printer size={16} />
            </button>
            <button
              onClick={handleDownloadPDF}
              className="p-1.5 rounded-lg text-slate-600 hover:text-brand-600 hover:bg-white border border-slate-200 shadow-sm transition-colors"
              title="Download PDF"
            >
              <Download size={16} />
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-600 hover:bg-white border border-slate-200 shadow-sm transition-colors"
              title="Share on WhatsApp"
            >
              <Share2 size={16} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white border border-slate-200 shadow-sm transition-colors"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper */}
        <div className="flex-1 overflow-y-auto p-6 bg-white font-sans print:p-0 print:m-0 text-slate-800" id="receipt-printable-area">
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Loading receipt data...</div>
          ) : data ? (
            <div className="space-y-4">
              {/* Institute Branding Header */}
              <div className="text-center border-b border-dashed border-slate-300 pb-4">
                <div className="w-12 h-12 mx-auto mb-2 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                  A
                </div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">{data.institute.name}</h2>
                <p className="text-[11px] text-slate-500">{data.institute.tagline}</p>
                <p className="text-[10px] text-slate-400 mt-1">{data.institute.address}</p>
                <p className="text-[10px] text-slate-400">Tel: {data.institute.phone}</p>
              </div>

              {/* Receipt Metadata */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between font-mono font-bold text-brand-700">
                  <span>RECEIPT NO:</span>
                  <span>{data.receiptNumber}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Date:</span>
                  <span>{formatDate(data.paymentDate)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Cashier:</span>
                  <span>{data.cashier}</span>
                </div>
                {data.reference && (
                  <div className="flex justify-between text-slate-600">
                    <span>Reference / Ref:</span>
                    <span>{data.reference}</span>
                  </div>
                )}
              </div>

              {/* Student Details */}
              <div className="border-b border-dashed border-slate-200 pb-3 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-semibold text-slate-900">{data.student.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student ID / Grade:</span>
                  <span className="font-mono text-slate-700">{data.student.studentIdNumber} • {data.student.grade}</span>
                </div>
                {data.student.school && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">School:</span>
                    <span className="text-slate-700">{data.student.school}</span>
                  </div>
                )}
              </div>

              {/* Fee Items Breakdown */}
              <div className="space-y-3">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Fee Details</span>
                {data.items.map((item: any, idx: number) => (
                  <div key={idx} className="bg-slate-50/70 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                    <div className="font-semibold text-slate-900">{item.classTitle}</div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>Month: {item.month}</span>
                      <span>Total Due: {formatLKR(item.totalDue)}</span>
                    </div>
                    <div className="flex justify-between text-emerald-700 font-medium">
                      <span>Paid in this transaction:</span>
                      <span>{formatLKR(item.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between font-mono text-[11px] text-slate-600 pt-1 border-t border-slate-200/60">
                      <span>Remaining Balance:</span>
                      <span className={item.remainingBalance > 0 ? 'text-amber-600 font-bold' : 'text-emerald-600 font-bold'}>
                        {formatLKR(item.remainingBalance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grand Total */}
              <div className="pt-2 border-t-2 border-slate-900 text-sm">
                <div className="flex justify-between font-bold text-slate-900 text-base">
                  <span>TOTAL AMOUNT PAID:</span>
                  <span className="text-brand-700">{formatLKR(data.totalPaid)}</span>
                </div>
                <div className="flex justify-between text-xs text-slate-600 mt-1">
                  <span>Payment Method:</span>
                  <span className="font-semibold">{data.paymentMethod}</span>
                </div>
              </div>

              {/* Stamp & Footer */}
              <div className="pt-4 text-center border-t border-dashed border-slate-300">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-semibold border border-emerald-200 mb-2">
                  <CheckCircle2 size={12} />
                  <span>PAYMENT VERIFIED & RECORDED</span>
                </div>
                <p className="text-[10px] text-slate-400">This is a computer-generated digital receipt and requires no physical seal.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Apex Education Portal • Thank you!</p>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
