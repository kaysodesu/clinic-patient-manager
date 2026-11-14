import React, { useState } from 'react';
import { Patient, Invoice } from '../types';
import { DollarSign, Search, Filter, AlertTriangle, CheckCircle, Clock, CreditCard, ChevronRight, X, FileText, Send, PieChart } from 'lucide-react';

interface BillingManagerProps {
  patients: Patient[];
  invoices: Invoice[];
  onPayInvoice: (
    invoiceId: string, 
    method: string, 
    paidAmount?: number, 
    isPartial?: boolean, 
    paymentPlanDeadline?: string,
    defaultCardUsed?: string,
    applyPenalty?: boolean
  ) => void;
  onCreateInvoice: (invoice: Omit<Invoice, 'id' | 'date'>) => void;
}

export default function BillingManager({ patients, invoices, onPayInvoice, onCreateInvoice }: BillingManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Paid' | 'Pending' | 'Overdue'>('All');
  
  // Synchronized select state derivation
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const selectedInvoice = invoices.find(inv => inv.id === selectedInvoiceId) || null;
  
  // Payment processing state
  const [isProcessingPay, setIsProcessingPay] = useState(false);
  const [payMethod, setPayMethod] = useState('Credit Card');

  // New Credit Card split pay + defaults state
  const cardOptions = [
    'Visa ending in 4242',
    'Mastercard ending in 9876',
    'Amex ending in 1004',
    'Discover ending in 5512'
  ];
  const [selectedCard, setSelectedCard] = useState(() => {
    return localStorage.getItem('clinic_default_pay_card') || 'Visa ending in 4242';
  });
  const [saveAsDefaultCard, setSaveAsDefaultCard] = useState(false);

  // Split payment configuration
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [partialPayAmount, setPartialPayAmount] = useState('');

  // Create invoice state
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [newInvoicePatientId, setNewInvoicePatientId] = useState('');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('');
  const [newInvoiceDesc, setNewInvoiceDesc] = useState('');
  const [newInvoiceDueDays, setNewInvoiceDueDays] = useState('30');
  const [invoiceCreateError, setInvoiceCreateError] = useState('');

  // Financial calculations
  const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalCollected = invoices.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + (inv.paidAmount || inv.amount), 0);
  const totalPending = invoices.filter(inv => inv.status === 'Pending').reduce((sum, inv) => sum + inv.amount, 0);
  const totalOverdue = invoices.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.amount, 0);
  const collectedPct = totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 100) : 0;

  // Filtered invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.patientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          inv.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleOpenPayment = (inv: Invoice) => {
    setSelectedInvoiceId(inv.id);
    setIsProcessingPay(true);
    setIsSplitPayment(false);
    setPartialPayAmount('');
  };

  const handleConfirmPayment = () => {
    if (selectedInvoice) {
      const isSplit = isSplitPayment;
      const amtPaid = isSplit ? Number(partialPayAmount) : selectedInvoice.amount;

      // Validate split rules if split checkout
      if (isSplit) {
        const minAllowed = selectedInvoice.amount * 0.3;
        if (isNaN(amtPaid) || amtPaid < minAllowed) {
          alert(`❌ Minimum payment must be at least 30% of the bill ($${minAllowed.toFixed(2)}).`);
          return;
        }
        if (amtPaid > selectedInvoice.amount) {
          alert(`❌ Payment amount cannot exceed the total outstanding bill ($${selectedInvoice.amount.toFixed(2)}).`);
          return;
        }
      }

      // Save default card preference if indicated
      if (payMethod === 'Credit Card' && saveAsDefaultCard) {
        localStorage.setItem('clinic_default_pay_card', selectedCard);
      }

      const todayObj = new Date();
      todayObj.setDate(todayObj.getDate() + 25);
      const deadlineStr = todayObj.toISOString().split('T')[0];

      // Settle invoice on parent ledger state
      onPayInvoice(
        selectedInvoice.id,
        payMethod === 'Credit Card' ? `Credit Card (${selectedCard})` : payMethod,
        amtPaid,
        isSplit,
        isSplit ? deadlineStr : undefined,
        payMethod === 'Credit Card' ? selectedCard : undefined
      );

      setIsProcessingPay(false);
      setIsSplitPayment(false);
      setPartialPayAmount('');
    }
  };

  const handleApplyPenaltySim = (invId: string) => {
    onPayInvoice(invId, 'Penalty', undefined, undefined, undefined, undefined, true);
  };

  const handleInvoiceCreation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoicePatientId) {
      setInvoiceCreateError('Please select a patient.');
      return;
    }
    if (!newInvoiceAmount || Number(newInvoiceAmount) <= 0) {
      setInvoiceCreateError('Please enter a valid billing amount.');
      return;
    }
    if (!newInvoiceDesc.trim()) {
      setInvoiceCreateError('Please enter an invoice description statement.');
      return;
    }

    const patient = patients.find(p => p.id === newInvoicePatientId);
    if (!patient) {
      setInvoiceCreateError('Patient logic error.');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const due = new Date();
    due.setDate(due.getDate() + Number(newInvoiceDueDays));
    const dueStr = due.toISOString().split('T')[0];

    onCreateInvoice({
      patientId: newInvoicePatientId,
      patientName: `${patient.personalInfo.firstName} ${patient.personalInfo.lastName}`,
      dueDate: dueStr,
      amount: Number(newInvoiceAmount),
      status: 'Pending',
      description: newInvoiceDesc
    });

    // Reset fields
    setNewInvoicePatientId('');
    setNewInvoiceAmount('');
    setNewInvoiceDesc('');
    setNewInvoiceDueDays('30');
    setInvoiceCreateError('');
    setIsCreatingInvoice(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* 4 Multi-metric Cards for Billing summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-700 rounded-xl">
            <DollarSign className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Total Invoiced</span>
            <span className="text-xl md:text-2xl font-bold text-slate-900">${totalBilled.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
                <CheckCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium block">Collected (Paid)</span>
                <span className="text-xl md:text-2xl font-bold text-slate-900">${totalCollected.toFixed(2)}</span>
              </div>
            </div>
            <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-bold ml-1">{collectedPct}%</span>
          </div>
          <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${collectedPct}%` }} />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Unpaid Pending</span>
            <span className="text-xl md:text-2xl font-bold text-slate-900">${totalPending.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-rose-50 text-rose-700 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs text-slate-500 font-medium block">Overdue Ledger</span>
            <span className="text-xl md:text-2xl font-bold text-rose-700">${totalOverdue.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Main Grid for Control bar + Invoice lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Filter and Invoices List */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-xs flex flex-col">
          
          {/* Filters Bar */}
          <div className="p-4 md:p-6 border-b border-slate-150 bg-slate-50/50 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4.5 h-4.5 text-slate-500" />
                Ledger Invoices ({filteredInvoices.length})
              </h3>
              <button
                type="button"
                onClick={() => setIsCreatingInvoice(true)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ml-auto md:ml-0"
              >
                <DollarSign className="w-3.5 h-3.5" />
                Create Custom Bill
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search */}
              <div className="relative md:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Query patient name, Bill ID, terms..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-250 rounded-lg text-xs bg-white focus:outline-teal-400 transition-all font-sans"
                />
              </div>

              {/* Status Selector */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="w-full px-2.5 py-2 border border-slate-250 rounded-lg text-xs bg-white focus:outline-teal-400 transition-all font-sans"
                >
                  <option value="All">All Invoices</option>
                  <option value="Paid">Paid Out</option>
                  <option value="Pending">Unpaid (Pending)</option>
                  <option value="Overdue">Overdue Outstanding</option>
                </select>
              </div>
            </div>
          </div>

          {/* Invoice entries */}
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {filteredInvoices.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <FileText className="w-10 h-10 mx-auto text-slate-300 stroke-[1.5]" />
                <p className="text-sm font-semibold">No invoice metrics matches search.</p>
                <p className="text-xs">Adjust filter or create an active copay invoice for patients.</p>
              </div>
            ) : (
              filteredInvoices.map(inv => {
                const isSelected = selectedInvoice?.id === inv.id;
                const statusStyles = {
                  Paid: 'bg-emerald-50 text-emerald-700 border-emerald-150',
                  Pending: 'bg-amber-50 text-amber-700 border-amber-150',
                  Overdue: 'bg-rose-50 text-rose-700 border-rose-150'
                };

                return (
                  <div
                    key={inv.id}
                    className={`p-4 md:p-5 hover:bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-all cursor-pointer ${
                      isSelected ? 'bg-teal-50/30' : ''
                    }`}
                    onClick={() => setSelectedInvoiceId(inv.id)}
                  >
                    <div className="space-y-1 md:space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-bold text-slate-450">{inv.id}</span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${statusStyles[inv.status]}`}>
                          {inv.status}
                        </span>
                        {inv.isPartial && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-sky-50 text-sky-800 border-sky-155">
                            Partially Paid
                          </span>
                        )}
                        {inv.penaltyApplied && (
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border bg-rose-50 text-rose-800 border-rose-155">
                            Penalty Fee
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 truncate">{inv.patientName}</h4>
                      <p className="text-xs text-slate-500 font-sans truncate">{inv.description}</p>
                      <div className="flex items-center gap-4 text-[10px] text-slate-400 font-mono">
                        <span>Issued: {inv.date}</span>
                        <span>Due: {inv.dueDate}</span>
                      </div>
                    </div>
 
                    <div className="flex md:flex-col items-baseline md:items-end justify-between md:justify-center gap-2">
                      <div className="text-left md:text-right">
                        <span className="text-base font-bold text-slate-900 font-mono block">${inv.amount.toFixed(2)}</span>
                        {inv.isPartial && inv.originalAmount && (
                          <span className="text-[9px] text-slate-550 block font-sans">
                            of ${inv.originalAmount.toFixed(2)} (${inv.paidAmount?.toFixed(2)} paid)
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenPayment(inv);
                        }}
                        disabled={inv.status === 'Paid'}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          inv.status === 'Paid'
                            ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                            : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                        }`}
                      >
                        <CreditCard className="w-3 h-3" />
                        {inv.status === 'Paid' ? 'Paid out' : 'Process'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Detailed Print/Pay View */}
        <div className="bg-slate-900 text-slate-300 rounded-2xl border border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          {selectedInvoice ? (
            <div className="space-y-5 h-full flex flex-col justify-between">
              
              {/* Invoice Layout Header */}
              <div>
                <div className="flex justify-between items-start border-b border-slate-800 pb-4 mb-4">
                  <div>
                    <span className="text-xs font-bold font-mono text-teal-400 uppercase tracking-wider">OFFICIAL CLINIC LEDGER</span>
                    <h3 className="text-base font-bold text-white mt-1">Medical Invoice Statement</h3>
                  </div>
                  <FileText className="w-6 h-6 text-slate-500" />
                </div>

                {/* Body details */}
                <div className="space-y-4 text-xs font-sans">
                  <div className="grid grid-cols-2 gap-3 bg-slate-850 p-3 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-slate-550 block">INVOICE NUMBER</span>
                      <strong className="text-white font-mono">{selectedInvoice.id}</strong>
                    </div>
                    <div>
                      <span className="text-slate-550 block">STATUS</span>
                      <strong className={`uppercase ${
                        selectedInvoice.status === 'Paid' ? 'text-emerald-400' :
                        selectedInvoice.status === 'Pending' ? 'text-amber-400' : 'text-rose-400'
                      }`}>{selectedInvoice.status}</strong>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Patient Client</span>
                    <span className="text-white text-sm font-bold block">{selectedInvoice.patientName}</span>
                    <span className="text-slate-400 text-[10px], font-mono">Patient Ref: {selectedInvoice.patientId}</span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Treatment / Care Description</span>
                    <p className="text-slate-200 leading-relaxed bg-slate-850 p-2.5 rounded border border-slate-810 text-[11px] font-sans">
                      {selectedInvoice.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-1 border-t border-slate-800">
                    <div>
                      <span className="text-slate-500 block text-[10px]">ISSUED DATE</span>
                      <span className="text-slate-350 font-mono text-[11px]">{selectedInvoice.date}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block text-[10px]">PAYMENT DUE DATE</span>
                      <span className="text-slate-350 font-mono text-[11px]">{selectedInvoice.dueDate}</span>
                    </div>
                  </div>

                  {selectedInvoice.isPartial && (
                    <div className="p-3 bg-slate-850 border border-slate-800 rounded-lg space-y-2 text-xs">
                      <span className="text-teal-400 font-bold block text-[10px] uppercase tracking-wider">Split Payment Overview</span>
                      <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                        <div>
                          <span className="text-slate-550 block text-[9.5px]">ORIGINAL AMT</span>
                          <span className="text-white">${selectedInvoice.originalAmount?.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-slate-550 block text-[9.5px]">PAID ACCUMULATED</span>
                          <span className="text-emerald-400">${selectedInvoice.paidAmount?.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="pt-2 border-t border-slate-800 space-y-1.5 text-slate-350">
                        <p className="text-[10px] text-amber-400">
                          ⚠️ Balance payment plan/payout due: <strong>{selectedInvoice.paymentPlanDeadline}</strong> (25 days from split initiation).
                        </p>
                        
                        {!selectedInvoice.penaltyApplied ? (
                          <div className="pt-1">
                            <button
                              type="button"
                              onClick={() => handleApplyPenaltySim(selectedInvoice.id)}
                              className="w-full py-1.5 text-[10px] bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded font-bold transition-all cursor-pointer"
                            >
                              ⚡ Simulate 25 Days Expired (Apply $75 Penalty)
                            </button>
                            <span className="text-[8.5px] text-slate-500 block text-center mt-1">
                              Applies $75 fee on remaining balance if unpaid after 25 days.
                            </span>
                          </div>
                        ) : (
                          <p className="text-[10px] text-rose-450 font-bold bg-rose-950/20 p-1.5 rounded border border-rose-900/55 text-center">
                            ❌ Penalty of $75.00 has been applied for overdue partial terms.
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedInvoice.status === 'Paid' && (
                    <div className="p-3 bg-emerald-950/40 border border-emerald-900/60 rounded-lg text-emerald-400 text-[11px] flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-300" />
                      <div>
                        Paid out on {selectedInvoice.paymentDate} via <strong>{selectedInvoice.paymentMethod}</strong>.
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Totals & Quick pay controls */}
              <div className="pt-4 border-t border-slate-800 mt-auto">
                <div className="flex justify-between items-baseline mb-4">
                  <span className="text-xs text-slate-450 uppercase font-bold tracking-wider">
                    {selectedInvoice.isPartial ? 'REMAINING UNPAID BALANCE' : 'TOTAL INVOICE AMOUNT'}
                  </span>
                  <span className="text-2xl font-bold font-mono text-white">${selectedInvoice.amount.toFixed(2)}</span>
                </div>

                {/* Pay Trigger Options */}
                {selectedInvoice.status === 'Paid' ? (
                  <div className="text-center py-2 bg-slate-850 rounded-lg border border-slate-800 text-[11px] text-zinc-450 font-mono">
                    CLAIM TRANSACTION COMPLETE
                  </div>
                ) : (
                  <div className="space-y-4 bg-slate-850 p-4 rounded-xl border border-slate-800 text-xs">
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Clinical Settlement Method</span>
                    <div className="grid grid-cols-2 gap-1.5 font-sans">
                      {['Credit Card', 'Insurance Claim', 'Cash', 'Apple Pay'].map((meth) => (
                        <button
                          type="button"
                          key={meth}
                          onClick={() => {
                            setPayMethod(meth);
                          }}
                          className={`py-1.5 rounded text-[10px] font-bold border transition-all text-center select-none cursor-pointer ${
                            payMethod === meth 
                              ? 'bg-teal-500/10 border-teal-500 text-teal-400' 
                              : 'bg-slate-905 border-slate-750 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {meth === 'Insurance Claim' ? 'Carrier Claim' : meth}
                        </button>
                      ))}
                    </div>

                    {/* Credit Card Details Dropdown + Saved Default Choice */}
                    {payMethod === 'Credit Card' && (
                      <div className="space-y-2.5 pt-2 border-t border-slate-800 select-none">
                        <div>
                          <label className="block text-[10px] text-slate-500 uppercase font-bold mb-1">Select Credit Card to Use</label>
                          <select
                            value={selectedCard}
                            onChange={(e) => {
                              setSelectedCard(e.target.value);
                            }}
                            className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-slate-200 focus:outline-teal-400 cursor-pointer font-sans"
                          >
                            {cardOptions.map((card) => {
                              const isDefault = card === localStorage.getItem('clinic_default_pay_card');
                              return (
                                <option key={card} value={card}>
                                  {card} {isDefault ? ' (Default)' : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>

                        <label className="flex items-center gap-2 text-[10px] text-slate-400 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={saveAsDefaultCard}
                            onChange={(e) => setSaveAsDefaultCard(e.target.checked)}
                            className="bg-slate-900 border-slate-700 text-teal-500 rounded focus:ring-teal-450 h-3.5 w-3.5 cursor-pointer"
                          />
                          <span>Set payment card as default for next transaction</span>
                        </label>
                      </div>
                    )}

                    {/* Split Payment Switcher Option */}
                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-[10px] uppercase font-bold">
                        <span className="text-slate-500">Payment Option</span>
                        <span className="text-slate-400">Split Pay Available</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-750">
                        <button
                          type="button"
                          onClick={() => {
                            setIsSplitPayment(false);
                            setPartialPayAmount('');
                          }}
                          className={`py-1 text-[10.5px] font-bold text-center rounded transition-all cursor-pointer ${
                            !isSplitPayment 
                              ? 'bg-slate-800 text-white shadow-3xs' 
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Full Pay
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsSplitPayment(true);
                            setPartialPayAmount((selectedInvoice.amount * 0.5).toFixed(2));
                          }}
                          className={`py-1 text-[10.5px] font-bold text-center rounded transition-all cursor-pointer ${
                            isSplitPayment 
                              ? 'bg-amber-600 text-white shadow-3xs' 
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Split Payment
                        </button>
                      </div>
                    </div>

                    {/* Split payment Amount input and limits */}
                    {isSplitPayment && (() => {
                      const minPayment = selectedInvoice.amount * 0.3;
                      const enteredAmt = Number(partialPayAmount);
                      const isTooLow = isNaN(enteredAmt) || enteredAmt < minPayment;
                      const isTooHigh = enteredAmt > selectedInvoice.amount;

                      const today = new Date();
                      today.setDate(today.getDate() + 25);
                      const displayDeadline = today.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      });

                      return (
                        <div className="space-y-3 bg-slate-900/60 p-2.5 rounded-lg border border-amber-500/20 font-sans">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-[10px] text-amber-400 uppercase font-black tracking-wider">Amount to Pay ($USD)</label>
                              <span className="text-[9.5px] text-slate-500 font-mono">Min 30%: ${minPayment.toFixed(2)}</span>
                            </div>
                            <input
                              type="number"
                              step="0.01"
                              value={partialPayAmount}
                              onChange={(e) => setPartialPayAmount(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 focus:border-amber-400 focus:outline-none rounded px-2 py-1 text-xs font-mono text-white"
                              placeholder={`Min ${minPayment.toFixed(2)}`}
                            />
                            {isTooLow && (
                              <p className="text-[9px] text-rose-400 font-bold mt-1">
                                ❌ Minimum payment is at least 30% ($${minPayment.toFixed(2)}).
                              </p>
                            )}
                            {isTooHigh && (
                              <p className="text-[9px] text-rose-400 font-bold mt-1">
                                ❌ Amount cannot exceed unpaid balance (${selectedInvoice.amount.toFixed(2)}).
                              </p>
                            )}
                          </div>

                          {/* Compliance Disclosure Notice */}
                          <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] rounded space-y-1.5 leading-relaxed">
                            <span className="font-bold flex items-center gap-1 uppercase tracking-wider text-[9px]">⚠️ Partial Payment Disclosure Notice</span>
                            <p>
                              A verified installment payment plan or full checkout payout must be completed 25 days from today (Due on/before <strong>{displayDeadline}</strong>).
                            </p>
                            <p className="font-bold text-amber-300">
                              Failure to settle or complete either requirement within 25 days will result in an immediate <strong className="text-rose-400 underline">$75.00 late penalty fee</strong> added directly to the outstanding remaining bill.
                            </p>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Confirm Button */}
                    <button
                      type="button"
                      onClick={handleConfirmPayment}
                      disabled={isSplitPayment && (() => {
                        const amt = Number(partialPayAmount);
                        return isNaN(amt) || amt < selectedInvoice.amount * 0.3 || amt > selectedInvoice.amount;
                      })()}
                      className={`w-full py-2.5 font-bold rounded-lg text-xs transition-all shadow-xs flex items-center justify-center gap-1 cursor-pointer font-sans ${
                        isSplitPayment && (() => {
                          const amt = Number(partialPayAmount);
                          return isNaN(amt) || amt < selectedInvoice.amount * 0.3 || amt > selectedInvoice.amount;
                        })()
                          ? 'bg-slate-800 text-slate-500 border border-slate-750 cursor-not-allowed shadow-none'
                          : isSplitPayment 
                            ? 'bg-amber-600 hover:bg-amber-550 text-white font-extrabold'
                            : 'bg-teal-500 hover:bg-teal-450 text-teal-985 font-extrabold'
                      }`}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      {isSplitPayment 
                        ? `Process Split Settle $${Number(partialPayAmount || 0).toFixed(2)}` 
                        : `Collect & Settle $${selectedInvoice.amount.toFixed(2)}`
                      }
                    </button>
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="h-full flex flex-col justify-center items-center py-12 text-center text-slate-500 space-y-3">
              <FileText className="w-12 h-12 text-slate-700 stroke-[1]" />
              <p className="text-sm font-semibold text-slate-400">No Invoice Selected</p>
              <p className="text-xs text-slate-600 max-w-[200px]">Click any patient invoice Entry in the ledger to process payments or review claims statement.</p>
            </div>
          )}

        </div>
      </div>

      {/* CREATE CUSTOM INVOICE MODAL */}
      {isCreatingInvoice && (
        <div id="create-invoice-modal" className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-150 shadow-xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-teal-600" />
                Issue Custom Billing Invoice
              </h3>
              <button 
                type="button"
                onClick={() => setIsCreatingInvoice(false)} 
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-650 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {invoiceCreateError && (
              <div className="text-xs bg-rose-50 text-rose-800 p-2.5 rounded-lg border border-rose-150 flex items-center gap-1.5 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                {invoiceCreateError}
              </div>
            )}

            <form onSubmit={handleInvoiceCreation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-650 mb-1.5">Select Hospitalized Patient Client</label>
                <select
                  required
                  value={newInvoicePatientId}
                  onChange={e => setNewInvoicePatientId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-slate-50/20 focus:bg-white transition-all"
                >
                  <option value="">-- Choose patient --</option>
                  {patients.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.personalInfo.firstName} {p.personalInfo.lastName} ({p.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Billing Amount ($USD)</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 150"
                    value={newInvoiceAmount}
                    onChange={e => setNewInvoiceAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs focus:outline-teal-400 transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5">Grace Terms (Days)</label>
                  <select
                    value={newInvoiceDueDays}
                    onChange={e => setNewInvoiceDueDays(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-slate-50/20 focus:bg-white transition-all focus:outline-teal-400"
                  >
                    <option value="15">Net 15</option>
                    <option value="30">Net 30 (Default)</option>
                    <option value="45">Net 45</option>
                    <option value="60">Net 60</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-650 mb-1.5">Active Treatment & Billable Items</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Allergy follow-up clinic consult, custom respiratory spirometry diagnostic panel..."
                  value={newInvoiceDesc}
                  onChange={e => setNewInvoiceDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs focus:outline-teal-400 transition-all font-sans"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingInvoice(false)}
                  className="px-4 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  Generate Statement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
