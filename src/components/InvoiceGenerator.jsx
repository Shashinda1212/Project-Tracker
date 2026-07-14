import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Printer, X, ArrowLeft, PlusCircle } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

// Hardcoded company contact details from the uploaded design
const COMPANY_ADDRESS = "No 62/1/5 prasannapura pitipana south, Homagama";
const COMPANY_PHONE = "+94 76 680 2675";
const COMPANY_EMAIL = "royalcodexsoftware@gmail.com";

// Helper to format currency values with commas
const formatCurrency = (val) => {
  if (val === '' || val === undefined || val === null) return '0';
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

// HTML template generator for printing
export const generateInvoiceHtml = (invoice) => {
  const subtotal = invoice.items.reduce((s, item) => s + ((Number(item.price) || 0) * (Number(item.qty) || 0)), 0);
  const total = subtotal - (Number(invoice.discount) || 0);
  const totalDue = total - (Number(invoice.advance) || 0);

  // Pad items to show at least 10 rows in the printed table to match the image design
  const paddedItems = [...invoice.items];
  while (paddedItems.length < 10) {
    paddedItems.push({ id: `empty-${paddedItems.length}`, description: '', price: '', qty: '' });
  }

  const rowsHtml = paddedItems.map((item, index) => {
    const itemNo = String(index + 1).padStart(2, '0');
    const isPadded = typeof item.id === 'string' && item.id.startsWith('empty');
    const displayTotal = isPadded ? '' : formatCurrency((Number(item.price) || 0) * (Number(item.qty) || 0));
    const displayPrice = isPadded ? '' : formatCurrency(Number(item.price) || 0);
    const displayQty = isPadded ? '' : item.qty;

    return `
      <tr style="border-bottom: 1.5px solid #000000; height: 32px;">
        <td style="border-right: 1.5px solid #000000; padding: 6px; text-align: center; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif;">
          ${isPadded ? '&nbsp;' : itemNo}
        </td>
        <td style="border-right: 1.5px solid #000000; padding: 8px 12px; font-size: 13px; font-weight: 500; text-align: center; font-family: 'Inter', sans-serif;">
          ${item.description || '&nbsp;'}
        </td>
        <td style="border-right: 1.5px solid #000000; padding: 6px; text-align: center; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif;">
          ${displayPrice}
        </td>
        <td style="border-right: 1.5px solid #000000; padding: 6px; text-align: center; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif;">
          ${displayQty}
        </td>
        <td style="padding: 6px; text-align: center; font-size: 13px; font-weight: 500; font-family: 'Inter', sans-serif;">
          ${displayTotal}
        </td>
      </tr>
    `;
  }).join('');

  const showBreakdown = (Number(invoice.discount) || 0) > 0 || (Number(invoice.advance) || 0) > 0;
  const totalLabel = showBreakdown ? 'Total Due' : 'Total';
  const finalVal = showBreakdown ? totalDue : total;

  let financialBreakdownHtml = '';
  if (showBreakdown) {
    financialBreakdownHtml = `
      <div style="display: flex; flex-direction: column; align-items: flex-end; margin-bottom: 8px; font-size: 12px; font-weight: 600; color: #2A262C; font-family: 'Inter', sans-serif;">
        <div style="display: flex; justify-content: space-between; width: 220px; padding: 2px 0;">
          <span>Subtotal:</span>
          <span>${formatCurrency(subtotal)} LKR</span>
        </div>
        ${(Number(invoice.discount) || 0) > 0 ? `
        <div style="display: flex; justify-content: space-between; width: 220px; padding: 2px 0; color: #DC2626;">
          <span>Discount:</span>
          <span>- ${formatCurrency(invoice.discount)} LKR</span>
        </div>
        ` : ''}
        ${(Number(invoice.advance) || 0) > 0 ? `
        <div style="display: flex; justify-content: space-between; width: 220px; padding: 2px 0; color: #059669;">
          <span>Advance:</span>
          <span>- ${formatCurrency(invoice.advance)} LKR</span>
        </div>
        ` : ''}
      </div>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Invoice - ${invoice.invoiceNumber}</title>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        @page {
          margin: 0 !important;
        }
        html, body {
          margin: 0 !important;
          padding: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            overflow: hidden !important;
          }
        }
        * {
          box-sizing: border-box;
        }
      </style>
    </head>
    <body style="background: #ffffff; color: #2A262C; font-family: 'Inter', sans-serif; margin: 0; padding: 0; height: 100%; min-height: 100%; display: flex; flex-direction: column; justify-content: space-between; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
      
      <div>
        <!-- Dark Header -->
        <div style="background-color: #2A262C; padding: 30px 45px 20px 45px; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
          <h1 style="margin: 0; color: #ffffff; font-family: 'Outfit', sans-serif; font-size: 46px; font-weight: 700; tracking-wide: 0.05em; line-height: 1;">Invoice</h1>
        </div>
        <!-- Lime Green Thick Line -->
        <div style="background-color: #93C01F; height: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact;"></div>

        <!-- Details Grid -->
        <table style="width: 100%; border-collapse: collapse; margin-top: 55px; font-size: 13px;">
          <tr>
            <!-- Left Info Block -->
            <td style="width: 50%; vertical-align: top; padding-left: 45px; padding-right: 25px;">
              <div style="margin-bottom: 12px;">
                <div style="color: #4B5563; font-size: 13px; font-weight: 500; margin-bottom: 4px; font-family: 'Inter', sans-serif;">Date: ${invoice.date}</div>
                <div style="border-bottom: 1.5px solid #CCCCCC; width: 100%;"></div>
              </div>
              <div style="margin-bottom: 12px;">
                <div style="color: #4B5563; font-size: 13px; font-weight: 500; margin-bottom: 4px; font-family: 'Inter', sans-serif;">No. Invoice : ${invoice.invoiceNumber}</div>
                <div style="border-bottom: 1.5px solid #CCCCCC; width: 100%;"></div>
              </div>
              <div style="margin-bottom: 12px;">
                <div style="color: #4B5563; font-size: 13px; font-weight: 500; margin-bottom: 4px; font-family: 'Inter', sans-serif;">Bill to: ${invoice.billTo || ''}</div>
                <div style="border-bottom: 1.5px solid #CCCCCC; width: 100%;"></div>
              </div>
            </td>

            <!-- Right Info Block -->
            <td style="width: 50%; vertical-align: top; padding-right: 45px; padding-left: 25px; line-height: 1.5; font-family: 'Inter', sans-serif;">
              <div style="font-weight: 700; font-size: 13px; margin-bottom: 8px; color: #2A262C;">Payment Method:</div>
              <div style="font-size: 13px; color: #2A262C; font-weight: 500;">
                <div>Account Name: W L S Niroshana</div>
                <div>Account Number: 1206 5289 5505</div>
                <div>Bank Name: SAMPATH BANK PLC</div>
                <div>Branch Name: KAMBURUPITIYA BRANCH</div>
              </div>
            </td>
          </tr>
        </table>

        <!-- Table Data -->
        <div style="padding: 0 45px; margin-top: 40px;">
          <table style="width: 100%; border-collapse: collapse; border: 1.5px solid #000000; table-layout: fixed;">
            <thead>
              <tr style="background-color: #93C01F; border-bottom: 1.5px solid #000000; -webkit-print-color-adjust: exact; print-color-adjust: exact; height: 32px;">
                <th style="border-right: 1.5px solid #000000; padding: 6px; text-align: center; font-size: 13px; font-weight: 700; color: #2A262C; font-family: 'Inter', sans-serif; width: 8%;">No</th>
                <th style="border-right: 1.5px solid #000000; padding: 6px; text-align: center; font-size: 13px; font-weight: 700; color: #2A262C; font-family: 'Inter', sans-serif; width: 52%;">Item Description</th>
                <th style="border-right: 1.5px solid #000000; padding: 6px; text-align: center; font-size: 13px; font-weight: 700; color: #2A262C; font-family: 'Inter', sans-serif; width: 18%;">Price</th>
                <th style="border-right: 1.5px solid #000000; padding: 6px; text-align: center; font-size: 13px; font-weight: 700; color: #2A262C; font-family: 'Inter', sans-serif; width: 8%;">Qty</th>
                <th style="padding: 6px; text-align: center; font-size: 13px; font-weight: 700; color: #2A262C; font-family: 'Inter', sans-serif; width: 14%;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>

        <!-- Total area -->
        <div style="padding: 0 45px; margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end;">
          <!-- Thank you -->
          <div style="font-family: 'Outfit', sans-serif; font-size: 32px; font-weight: 700; color: #2A262C; margin-bottom: 2px;">Thank you!</div>
          
          <!-- Total box container -->
          <div>
            ${financialBreakdownHtml}
            <div style="background-color: #E5E7EB; border: 1.5px solid #000000; padding: 12px 24px; min-width: 250px; text-align: right; box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact;">
              <span style="font-family: 'Outfit', sans-serif; font-size: 18px; font-weight: 700; color: #2A262C; text-transform: uppercase;">
                ${totalLabel}: ${formatCurrency(finalVal)} LKR
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer section -->
      <div style="margin-top: 15px; margin-bottom: 0px; page-break-inside: avoid; break-inside: avoid;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 10px;">
          <tr>
            <td style="padding-left: 45px; padding-bottom: 6px; vertical-align: middle;">
              <div style="display: flex; align-items: center; font-size: 12px; font-weight: 500; color: #2A262C; font-family: 'Inter', sans-serif;">
                <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; background-color: #93C01F; border-radius: 50%; margin-right: 12px; flex-shrink: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; vertical-align: middle; padding: 5px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                </span>
                <span style="vertical-align: middle;">${COMPANY_ADDRESS}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-left: 45px; padding-bottom: 6px; vertical-align: middle;">
              <div style="display: flex; align-items: center; font-size: 12px; font-weight: 500; color: #2A262C; font-family: 'Inter', sans-serif;">
                <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; background-color: #93C01F; border-radius: 50%; margin-right: 12px; flex-shrink: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; vertical-align: middle; padding: 5px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                </span>
                <span style="vertical-align: middle;">${COMPANY_PHONE}</span>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-left: 45px; padding-bottom: 8px; vertical-align: middle;">
              <div style="display: flex; align-items: center; font-size: 12px; font-weight: 500; color: #2A262C; font-family: 'Inter', sans-serif;">
                <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; background-color: #93C01F; border-radius: 50%; margin-right: 12px; flex-shrink: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; vertical-align: middle; padding: 5px;">
                  <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <span style="vertical-align: middle;">${COMPANY_EMAIL}</span>
              </div>
            </td>
          </tr>
        </table>
        
        <!-- Bottom line accents -->
        <div style="background-color: #93C01F; height: 10px; -webkit-print-color-adjust: exact; print-color-adjust: exact;"></div>
        <div style="background-color: #2A262C; height: 4px; -webkit-print-color-adjust: exact; print-color-adjust: exact;"></div>
      </div>

      <script>
        window.onload = function() {
          if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 400);
            });
          } else {
            setTimeout(function() {
              window.print();
              window.close();
            }, 600);
          }
        };
      </script>
    </body>
    </html>
  `;
};

// Custom helper to print invoice by writing HTML content to an iframe or new tab
export const printInvoiceContent = (invoice) => {
  const htmlContent = generateInvoiceHtml(invoice);
  const printWindow = window.open('', '_blank', 'width=850,height=900');
  
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
  } else {
    alert("Please allow popups to print the invoice.");
  }
};

export default function InvoiceGenerator({ project, onCancel, onSaveSuccess }) {
  // Determine next invoice number
  const getNextInvoiceNumber = () => {
    const history = project.invoices || [];
    if (history.length === 0) return '00001';
    
    const lastInvoice = history[history.length - 1];
    const lastNumStr = lastInvoice.invoiceNumber || '';
    const match = lastNumStr.match(/(\d+)$/);
    if (match) {
      const numVal = parseInt(match[1], 10);
      const nextVal = numVal + 1;
      const digitsCount = match[1].length;
      const prefix = lastNumStr.substring(0, lastNumStr.length - digitsCount);
      const paddedVal = String(nextVal).padStart(digitsCount, '0');
      return prefix + paddedVal;
    }
    return lastNumStr + '-1';
  };

  // Pre-fill Date to DD.MM.YYYY
  const getTodayFormatted = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}.${mm}.${yyyy}`;
  };

  // State
  const [invoiceNumber, setInvoiceNumber] = useState(getNextInvoiceNumber());
  const [date, setDate] = useState(getTodayFormatted());
  const [billTo, setBillTo] = useState(project.clientName || project.contactName || '');
  const [discount, setDiscount] = useState('');
  const [advance, setAdvance] = useState('');
  
  // Starting with a single empty item row as requested (do not prefill with project values)
  const [items, setItems] = useState([
    { id: Date.now(), description: '', price: '', qty: 1 }
  ]);

  const [saving, setSaving] = useState(false);

  // Handlers
  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        let parsedVal = value;
        if (field === 'price') {
          parsedVal = value === '' ? '' : parseFloat(value) || 0;
        } else if (field === 'qty') {
          parsedVal = value === '' ? '' : parseInt(value, 10) || 0;
        }
        return { ...item, [field]: parsedVal };
      }
      return item;
    }));
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { id: Date.now(), description: '', price: '', qty: 1 }]);
  };

  const handleRemoveItem = (id) => {
    if (items.length === 1) {
      setItems([{ id: Date.now(), description: '', price: '', qty: 1 }]);
    } else {
      setItems(prev => prev.filter(item => item.id !== id));
    }
  };

  // Calculations
  const subtotal = items.reduce((s, item) => s + ((Number(item.price) || 0) * (Number(item.qty) || 0)), 0);
  const total = subtotal - (Number(discount) || 0);
  const totalDue = total - (Number(advance) || 0);

  const handleSaveAndPrint = async () => {
    if (!invoiceNumber.trim()) {
      alert("Please enter an Invoice Number.");
      return;
    }
    if (!billTo.trim()) {
      alert("Please enter a 'Bill to' client name.");
      return;
    }
    
    // Check if at least one item has a description and price
    const validItems = items.filter(item => item.description.trim() !== '' && Number(item.price) > 0);
    if (validItems.length === 0) {
      alert("Please add at least one valid item with a description and a price greater than 0.");
      return;
    }

    setSaving(true);
    try {
      const invoiceData = {
        invoiceNumber,
        date,
        billTo,
        items: validItems.map(({ description, price, qty }) => ({ description, price, qty })),
        discount: Number(discount) || 0,
        advance: Number(advance) || 0,
        subtotal,
        total,
        totalDue,
        createdAt: new Date().toISOString()
      };

      const projectRef = doc(db, 'projects', project.id);
      const updatedInvoices = [...(project.invoices || []), invoiceData];
      
      await updateDoc(projectRef, {
        invoices: updatedInvoices
      });

      // Trigger print using the HTML content passing method
      printInvoiceContent(invoiceData);

      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert("Failed to save invoice history to database: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  // Padded items for live preview
  const paddedPreviewItems = [...items.filter(item => item.description.trim() !== '')];
  while (paddedPreviewItems.length < 10) {
    paddedPreviewItems.push({ id: `preview-empty-${paddedPreviewItems.length}`, description: '', price: '', qty: '' });
  }

  const showBreakdown = (Number(discount) || 0) > 0 || (Number(advance) || 0) > 0;

  return (
    <div className="flex flex-col lg:flex-row gap-6 animate-fadeIn">
      {/* Editor Panel - Left side */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center space-x-2.5">
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-white p-1 hover:bg-slate-805 rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-md font-bold text-white">Generate Project Invoice</h3>
              <p className="text-xs text-slate-500">Design matching original template</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Invoice Number</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white text-sm focus:border-brand-500 focus:ring-0 focus:outline-none"
              placeholder="e.g. 00010"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Invoice Date</label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white text-sm focus:border-brand-500 focus:ring-0 focus:outline-none"
              placeholder="e.g. 11.06.2026"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Bill To</label>
            <input
              type="text"
              value={billTo}
              onChange={(e) => setBillTo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white text-sm focus:border-brand-500 focus:ring-0 focus:outline-none"
              placeholder="e.g. Client Company Name"
            />
          </div>
        </div>

        {/* Items Grid Editor */}
        <div className="space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Invoice Items</label>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex gap-2 items-center">
                <input
                  type="text"
                  placeholder="Item description (e.g. Theme customizations)"
                  value={item.description}
                  onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                  className="flex-grow bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white text-sm focus:border-brand-500 focus:ring-0 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Price (LKR)"
                  value={item.price}
                  onChange={(e) => handleItemChange(item.id, 'price', e.target.value)}
                  className="w-28 bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white text-sm focus:border-brand-500 focus:ring-0 focus:outline-none"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.qty}
                  onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                  className="w-16 bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white text-sm focus:border-brand-500 focus:ring-0 focus:outline-none text-center"
                />
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  className="text-red-500 hover:text-red-400 p-2 hover:bg-slate-950 border border-transparent hover:border-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Remove row"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleAddItem}
            className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 font-bold bg-brand-500/5 hover:bg-brand-500/10 border border-brand-500/20 rounded-xl py-2 px-4.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Item Row</span>
          </button>
        </div>

        {/* Financial Adjustments */}
        <div className="grid grid-cols-2 gap-4 border-t border-slate-800/80 pt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Advance Payment (LKR - if applicable)</label>
            <input
              type="number"
              value={advance}
              onChange={(e) => setAdvance(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white text-sm focus:border-brand-500 focus:ring-0 focus:outline-none"
              placeholder="e.g. 5000"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5">Discount Amount (LKR - if applicable)</label>
            <input
              type="number"
              value={discount}
              onChange={(e) => setDiscount(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-3 text-white text-sm focus:border-brand-500 focus:ring-0 focus:outline-none"
              placeholder="e.g. 1500"
            />
          </div>
        </div>

        {/* Action Panel */}
        <div className="border-t border-slate-800/80 pt-5 flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white py-2.5 px-6 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveAndPrint}
            disabled={saving}
            className="bg-brand-600 hover:bg-brand-500 text-white font-semibold py-2.5 px-6 rounded-xl text-xs shadow-md shadow-brand-500/10 cursor-pointer flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save & Print Invoice'}</span>
          </button>
        </div>
      </div>

      {/* Live Preview Panel - Right side (Canvas design representation) */}
      <div className="flex-1 flex flex-col space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-400 px-1">Live Invoice Preview</div>
        <div className="w-full overflow-x-auto bg-slate-950 border border-slate-800/50 rounded-2xl p-4 flex justify-center items-start shadow-inner">
          
          {/* Printable Invoice Page Container (styled to look exactly like the target image in A4 ratio) */}
          <div className="w-[794px] min-h-[1050px] bg-white text-slate-800 shadow-2xl rounded border border-slate-200 overflow-hidden flex flex-col justify-between select-none transform origin-top scale-75 md:scale-90 lg:scale-100">
            <div>
              {/* Dark Header Banner */}
              <div className="bg-[#2A262C] p-[40px_45px_30px_45px] text-left">
                <h1 className="m-0 text-white font-sans text-5xl font-bold tracking-wide select-none leading-none">Invoice</h1>
              </div>
              {/* Lime Green Accent Strip */}
              <div className="bg-[#93C01F] h-3"></div>

              {/* Invoice Meta Grid */}
              <div className="grid grid-cols-2 gap-8 mt-10 px-[45px] text-xs">
                {/* Left fields with horizontal lines */}
                <div className="space-y-5">
                  <div>
                    <div className="text-slate-600 font-medium pb-1.5">Date: {date}</div>
                    <hr className="border-t-[1.5px] border-slate-200" />
                  </div>
                  <div>
                    <div className="text-slate-600 font-medium pb-1.5">No. Invoice : {invoiceNumber}</div>
                    <hr className="border-t-[1.5px] border-slate-200" />
                  </div>
                  <div>
                    <div className="text-slate-600 font-medium pb-1.5">Bill to: {billTo}</div>
                    <hr className="border-t-[1.5px] border-slate-200" />
                  </div>
                </div>

                {/* Right Static Bank Method */}
                <div className="text-left font-sans text-slate-800 leading-relaxed pl-6">
                  <div className="font-bold text-[13px] mb-2 text-slate-900">Payment Method:</div>
                  <div className="space-y-0.5 text-xs text-slate-700">
                    <div>Account Name: W L S Niroshana</div>
                    <div>Account Number: 1206 5289 5505</div>
                    <div>Bank Name: SAMPATH BANK PLC</div>
                    <div>Branch Name: KAMBURUPITIYA BRANCH</div>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div className="px-[45px] mt-8">
                <table className="w-full border-collapse border-[1.5px] border-black text-xs text-slate-800 table-fixed">
                  <thead>
                    <tr className="bg-[#93C01F] border-b-[1.5px] border-black h-9 text-slate-900 font-bold">
                      <th className="border-r-[1.5px] border-black text-center w-[8%] font-sans">No</th>
                      <th className="border-r-[1.5px] border-black text-center w-[52%] font-sans">Item Description</th>
                      <th className="border-r-[1.5px] border-black text-center w-[18%] font-sans">Price</th>
                      <th className="border-r-[1.5px] border-black text-center w-[8%] font-sans">Qty</th>
                      <th className="text-center w-[14%] font-sans">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paddedPreviewItems.map((item, index) => {
                      const isPadded = typeof item.id === 'string' && item.id.startsWith('preview-empty');
                      const displayPrice = isPadded ? '' : formatCurrency(Number(item.price) || 0);
                      const displayQty = isPadded ? '' : item.qty;
                      const displayTotal = isPadded ? '' : formatCurrency((Number(item.price) || 0) * (Number(item.qty) || 0));
                      
                      return (
                        <tr key={item.id} className="border-b border-black h-[38px] text-center font-medium">
                          <td className="border-r border-black font-sans">{isPadded ? '' : String(index + 1).padStart(2, '0')}</td>
                          <td className="border-r border-black font-sans px-3 text-center truncate">{item.description}</td>
                          <td className="border-r border-black font-sans">{displayPrice}</td>
                          <td className="border-r border-black font-sans">{displayQty}</td>
                          <td className="font-sans">{displayTotal}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totals Section */}
              <div className="px-[45px] mt-6 flex justify-between items-end">
                <div className="font-sans text-[28px] font-extrabold text-slate-900">Thank you!</div>
                
                <div className="flex flex-col items-end">
                  {showBreakdown && (
                    <div className="flex flex-col items-end mb-2 text-xs font-semibold text-slate-700 pr-1 space-y-0.5">
                      <div className="flex justify-between w-48 border-b border-slate-100 pb-0.5">
                        <span>Subtotal:</span>
                        <span>{formatCurrency(subtotal)} LKR</span>
                      </div>
                      {(Number(discount) || 0) > 0 && (
                        <div className="flex justify-between w-48 text-red-600 border-b border-slate-100 pb-0.5">
                          <span>Discount:</span>
                          <span>- {formatCurrency(discount)} LKR</span>
                        </div>
                      )}
                      {(Number(advance) || 0) > 0 && (
                        <div className="flex justify-between w-48 text-emerald-600 border-b border-slate-100 pb-0.5">
                          <span>Advance:</span>
                          <span>- {formatCurrency(advance)} LKR</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="bg-[#E5E7EB] border-[1.5px] border-black p-[10px_20px] min-w-[200px] text-right">
                    <span className="font-sans text-sm font-bold text-slate-900 uppercase">
                      {showBreakdown ? 'Total Due' : 'Total'}: {formatCurrency(showBreakdown ? totalDue : total)} LKR
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer details with icons */}
            <div className="mt-8">
              <div className="px-[45px] pb-6 space-y-2 text-left">
                <div className="flex items-center text-[11px] font-medium text-slate-800">
                  <span className="flex items-center justify-center w-5 h-5 bg-[#93C01F] rounded-full mr-3 text-white shrink-0 p-1">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </span>
                  <span>{COMPANY_ADDRESS}</span>
                </div>
                <div className="flex items-center text-[11px] font-medium text-slate-800">
                  <span className="flex items-center justify-center w-5 h-5 bg-[#93C01F] rounded-full mr-3 text-white shrink-0 p-1">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.94.725l.548 2.2a1 1 0 01-.321.988l-1.305.98a10.582 10.582 0 004.872 4.872l.98-1.305a1 1 0 01.988-.321l2.2.548a1 1 0 01.725.94V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                  </span>
                  <span>{COMPANY_PHONE}</span>
                </div>
                <div className="flex items-center text-[11px] font-medium text-slate-800">
                  <span className="flex items-center justify-center w-5 h-5 bg-[#93C01F] rounded-full mr-3 text-white shrink-0 p-1">
                    <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </span>
                  <span>{COMPANY_EMAIL}</span>
                </div>
              </div>
              <div className="bg-[#93C01F] h-2.5"></div>
              <div className="bg-[#2A262C] h-1.5"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
