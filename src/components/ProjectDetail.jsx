import React, { useState } from 'react';
import { X, Calendar, User, Phone, CheckCircle, Clock, XCircle, Globe, Server, Mail, DollarSign, Edit, Key, Copy, Check, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { decryptPassword } from '../services/crypto';

export default function ProjectDetail({ project, onEdit, onClose, masterKey, onPromptMasterKey }) {
  const [copiedField, setCopiedField] = useState(null);
  const [showPlainPasswords, setShowPlainPasswords] = useState({
    domain: false,
    hosting: false,
    gmail: false,
    wpAdmin: false,
    cpanel: false
  });

  if (!project) return null;

  // Decrypt passwords if Master Key is set
  const getDecryptedVal = (cipher) => {
    if (!cipher) return '';
    if (!masterKey) return '__LOCKED__';
    try {
      return decryptPassword(cipher, masterKey);
    } catch (err) {
      return '__BAD_KEY__';
    }
  };

  const domainPass = getDecryptedVal(project.domainPlatform?.password);
  const hostingPass = getDecryptedVal(project.hostingPlatform?.password);
  const gmailPass = getDecryptedVal(project.gmail?.password);
  const wpAdminPass = getDecryptedVal(project.wpAdmin?.password);
  const cpanelPass = getDecryptedVal(project.cpanel?.password);

  const handleCopy = (text, fieldName) => {
    if (!text || text === '__LOCKED__' || text === '__BAD_KEY__') return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'finished':
        return (
          <span className="flex items-center space-x-1.5 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 py-1 px-3 rounded-full font-bold uppercase tracking-wider">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Finished</span>
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center space-x-1.5 text-xs bg-red-500/10 border border-red-500/20 text-red-400 py-1 px-3 rounded-full font-bold uppercase tracking-wider">
            <XCircle className="w-3.5 h-3.5" />
            <span>Cancelled</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center space-x-1.5 text-xs bg-amber-500/10 border border-amber-500/20 text-amber-400 py-1 px-3 rounded-full font-bold uppercase tracking-wider animate-pulse">
            <Clock className="w-3.5 h-3.5" />
            <span>Ongoing</span>
          </span>
        );
    }
  };

  const getCategoryLabel = (cat) => {
    if (cat === 'web') return 'Web Project';
    if (cat === 'pos') return 'POS System';
    return 'Other Software';
  };

  // Financial aggregates
  const fullVal = project.fullValue || 0;
  const advPay = project.advancePayment || 0;
  const paymentsTotal = (project.paymentsList || []).reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = advPay + paymentsTotal;
  const dueAmount = fullVal - totalPaid;

  // WordPress calculations
  const plugins = project.pluginsUsed || [];
  const pluginsTotalCost = plugins.reduce((sum, p) => sum + p.cost, 0);
  const wpTotalCost = (project.themeCost || 0) + pluginsTotalCost;

  // Expenses and Profit calculations
  const domainCost = project.domainPlatform?.cost || 0;
  const hostingCost = project.hostingPlatform?.cost || 0;
  const themeCost = project.themeCost || 0;
  const totalExpenses = domainCost + hostingCost + themeCost + pluginsTotalCost;
  const netProfit = fullVal - totalExpenses;

  return (
    <div className="bg-slate-900 border border-slate-800 w-full rounded-2xl shadow-2xl relative flex flex-col animate-fadeIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-2xl font-bold text-white tracking-tight">{project.projectName}</h2>
                {getStatusBadge(project.status)}
              </div>
              <p className="text-sm text-slate-400 mt-1 font-medium">
                {getCategoryLabel(project.category)}
                {project.category === 'web' && ` • ${project.webType === 'wordpress' ? 'WordPress CMS' : 'Custom Coding'}`}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onEdit(project)}
              className="bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm py-2 px-4 rounded-xl flex items-center space-x-1.5 shadow-md shadow-brand-500/10 cursor-pointer"
            >
              <Edit className="w-4 h-4" />
              <span>Edit</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white hover:bg-slate-850 py-2.5 px-4 rounded-xl transition-all cursor-pointer text-xs font-bold flex items-center space-x-1.5 border border-slate-800 bg-slate-950/40"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to List</span>
            </button>
          </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-8 flex-grow">
          {/* General Information Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-slate-950 border border-slate-800/60 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400">Client Info</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">Client Company</span>
                  <span className="font-semibold text-slate-200">{project.clientName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">Contact Person</span>
                  <span className="font-semibold text-slate-200">{project.contactName || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-5 space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400">Dates</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">Start Date</span>
                  <span className="font-semibold text-slate-200">{project.startDate || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">Target Delivery</span>
                  <span className="font-semibold text-slate-200 text-brand-300">{project.deliveryDate || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* WordPress Details (Web Category Only) */}
          {project.category === 'web' && project.webType === 'wordpress' && (
            <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400">WordPress Details</h3>
                <span className="text-xs font-bold text-slate-400">Setup Cost: <span className="text-emerald-400">LKR {wpTotalCost.toFixed(2)}</span></span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 block">Theme Name</span>
                  <span className="font-semibold text-slate-200">{project.themeName || 'Default/Free Theme'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-500 block">Theme Cost</span>
                  <span className="font-semibold text-slate-200">LKR {(project.themeCost || 0).toFixed(2)}</span>
                </div>
              </div>
              {/* Plugins list */}
              <div className="pt-2">
                <span className="text-xs text-slate-500 block mb-2">Plugins Installed ({plugins.length})</span>
                {plugins.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {plugins.map((plugin, index) => (
                      <div key={plugin.id || index} className="flex justify-between bg-slate-900 border border-slate-800 p-2.5 rounded-lg text-xs">
                        <span className="text-slate-300 font-medium">{plugin.name}</span>
                        <span className="text-emerald-400 font-semibold">LKR {plugin.cost.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No plugins configured.</p>
                )}
              </div>
            </div>
          )}

          {/* Financials & Payments logs */}
          <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400">Financial Ledger</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-xl">
                <span className="text-xs text-slate-500 block">Project Value</span>
                <span className="text-lg font-bold text-white">LKR {fullVal.toFixed(2)}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-xl">
                <span className="text-xs text-slate-500 block">Advance Deposit</span>
                <span className="text-lg font-bold text-slate-300">LKR {advPay.toFixed(2)}</span>
              </div>
              <div className="bg-slate-900 border border-slate-800/60 p-4 rounded-xl">
                <span className="text-xs text-slate-500 block">Total Payments Logged</span>
                <span className="text-lg font-bold text-emerald-400">LKR {totalPaid.toFixed(2)}</span>
              </div>
              <div className={`border p-4 rounded-xl ${dueAmount > 0 ? 'bg-amber-950/20 border-amber-900/40' : 'bg-emerald-950/20 border-emerald-900/40'}`}>
                <span className="text-xs text-slate-500 block">Outstanding Balance</span>
                <span className={`text-lg font-extrabold ${dueAmount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  LKR {dueAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payments list ledger */}
            {project.paymentsList && project.paymentsList.length > 0 && (
              <div className="pt-2 border-t border-slate-900">
                <span className="text-xs text-slate-500 block mb-2 font-medium">Additional Payment Logs</span>
                <div className="space-y-1.5">
                  {project.paymentsList.map((payment) => (
                    <div key={payment.id} className="flex justify-between items-center bg-slate-900 p-2 px-3 rounded-lg text-xs border border-slate-800">
                      <div>
                        <span className="font-semibold text-slate-300">{payment.description}</span>
                        <span className="text-[10px] text-slate-500 ml-2">({payment.date})</span>
                      </div>
                      <span className="text-emerald-400 font-bold">LKR {payment.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profitability Summary */}
            <div className="pt-4 border-t border-slate-900 grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Expenses Breakdown</span>
                <div className="space-y-1 bg-slate-900/50 p-3 rounded-xl border border-slate-800 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Domain Cost:</span>
                    <span className="text-slate-300 font-medium">LKR {domainCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Hosting Cost:</span>
                    <span className="text-slate-300 font-medium">LKR {hostingCost.toFixed(2)}</span>
                  </div>
                  {project.category === 'web' && project.webType === 'wordpress' && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Theme Cost:</span>
                        <span className="text-slate-300 font-medium">LKR {themeCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Plugins Cost:</span>
                        <span className="text-slate-300 font-medium">LKR {pluginsTotalCost.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between border-t border-slate-800 pt-1.5 font-bold">
                    <span className="text-slate-400">Total Expenses:</span>
                    <span className="text-red-400">LKR {totalExpenses.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between bg-slate-900/40 border border-slate-800/80 p-4 rounded-xl">
                <div>
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Net Profitability</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Project Value minus all registered setup and recurring expenses.</p>
                </div>
                <div className="mt-4 flex items-baseline justify-between">
                  <span className="text-xs text-slate-400 font-medium">Estimated Net Profit</span>
                  <span className={`text-xl font-black ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    LKR {netProfit.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Credentials Area (Encrypted fields) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400">Secure Access Credentials</h3>
              {!masterKey && (
                <button
                  onClick={onPromptMasterKey}
                  className="text-xs bg-brand-600 hover:bg-brand-500 text-white font-semibold py-1 px-3 rounded-lg flex items-center space-x-1 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Unlock Credentials</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {/* Domain Credentials Card */}
              <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-5 space-y-3.5">
                <span className="text-sm font-semibold text-sky-400 flex items-center gap-1.5">
                  <Globe className="w-4 h-4" /> Domain Portal
                </span>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-slate-500 block">Platform</span>
                    <span className="text-slate-200 font-medium">{project.domainPlatform?.platformName || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Username</span>
                    <span className="text-slate-200 font-medium">{project.domainPlatform?.username || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Registered Email</span>
                    <span className="text-slate-200 font-medium">{project.domainPlatform?.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Password</span>
                    {domainPass === '__LOCKED__' ? (
                      <span className="text-amber-500 italic font-semibold">🔒 Locked</span>
                    ) : domainPass === '__BAD_KEY__' ? (
                      <span className="text-red-500 italic font-semibold">❌ Decryption Failed</span>
                    ) : domainPass ? (
                      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-1.5 pl-2.5 rounded-lg text-slate-200 font-mono mt-1">
                        <span>{showPlainPasswords.domain ? domainPass : '••••••••'}</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setShowPlainPasswords(prev => ({ ...prev, domain: !prev.domain }))}
                            className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                          >
                            {showPlainPasswords.domain ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(domainPass, 'domain')}
                            className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                            title="Copy Password"
                          >
                            {copiedField === 'domain' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">No password saved</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 block">Registration Date</span>
                    <span className="text-slate-200 font-medium">{project.domainPlatform?.registrationDate || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Expiration Date</span>
                    <span className="text-slate-200 font-medium">{project.domainPlatform?.expirationDate || 'N/A'}</span>
                  </div>
                  <div className="pt-1.5 border-t border-slate-900/60 mt-1">
                    <span className="text-slate-500 block font-semibold text-slate-400">Domain Cost</span>
                    <span className="text-slate-200 font-semibold text-emerald-400">LKR {(project.domainPlatform?.cost || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Hosting Credentials Card */}
              <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-5 space-y-3.5">
                <span className="text-sm font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Server className="w-4 h-4" /> Hosting Portal
                </span>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-slate-500 block">Hosting Provider</span>
                    <span className="text-slate-200 font-medium">{project.hostingPlatform?.provider || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Hosting Type</span>
                    <span className="text-slate-200 font-medium capitalize">{project.hostingPlatform?.type || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Username</span>
                    <span className="text-slate-200 font-medium">{project.hostingPlatform?.username || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Registered Email</span>
                    <span className="text-slate-200 font-medium">{project.hostingPlatform?.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Password</span>
                    {hostingPass === '__LOCKED__' ? (
                      <span className="text-amber-500 italic font-semibold">🔒 Locked</span>
                    ) : hostingPass === '__BAD_KEY__' ? (
                      <span className="text-red-500 italic font-semibold">❌ Decryption Failed</span>
                    ) : hostingPass ? (
                      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-1.5 pl-2.5 rounded-lg text-slate-200 font-mono mt-1">
                        <span>{showPlainPasswords.hosting ? hostingPass : '••••••••'}</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setShowPlainPasswords(prev => ({ ...prev, hosting: !prev.hosting }))}
                            className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                          >
                            {showPlainPasswords.hosting ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(hostingPass, 'hosting')}
                            className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                            title="Copy Password"
                          >
                            {copiedField === 'hosting' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">No password saved</span>
                    )}
                  </div>
                  {project.hostingPlatform?.type === 'shared' && (
                    <>
                      <div>
                        <span className="text-slate-500 block">Hosting Registration Date</span>
                        <span className="text-slate-200 font-medium">{project.hostingPlatform?.registrationDate || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Hosting Expiration Date</span>
                        <span className="text-slate-200 font-medium">{project.hostingPlatform?.expirationDate || 'N/A'}</span>
                      </div>
                    </>
                  )}
                  <div className="pt-1.5 border-t border-slate-900/60 mt-1">
                    <span className="text-slate-500 block font-semibold text-slate-400">Hosting Cost</span>
                    <span className="text-slate-200 font-semibold text-emerald-400">LKR {(project.hostingPlatform?.cost || 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Project Gmail Credentials Card */}
              <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-5 space-y-3.5">
                <span className="text-sm font-semibold text-violet-400 flex items-center gap-1.5">
                  <Mail className="w-4 h-4" /> Gmail Credentials
                </span>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-slate-500 block">Gmail Account</span>
                    <span className="text-slate-200 font-medium">{project.gmail?.email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Password</span>
                    {gmailPass === '__LOCKED__' ? (
                      <span className="text-amber-500 italic font-semibold">🔒 Locked</span>
                    ) : gmailPass === '__BAD_KEY__' ? (
                      <span className="text-red-500 italic font-semibold">❌ Decryption Failed</span>
                    ) : gmailPass ? (
                      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-1.5 pl-2.5 rounded-lg text-slate-200 font-mono mt-1">
                        <span>{showPlainPasswords.gmail ? gmailPass : '••••••••'}</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setShowPlainPasswords(prev => ({ ...prev, gmail: !prev.gmail }))}
                            className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                          >
                            {showPlainPasswords.gmail ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(gmailPass, 'gmail')}
                            className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                            title="Copy Password"
                          >
                            {copiedField === 'gmail' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">No password saved</span>
                    )}
                  </div>
                </div>
              </div>

              {/* cPanel Credentials Card */}
              <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-5 space-y-3.5">
                <span className="text-sm font-semibold text-brand-400 flex items-center gap-1.5">
                  <Server className="w-4 h-4" /> cPanel Logins
                </span>
                <div className="text-xs space-y-2">
                  <div>
                    <span className="text-slate-500 block">cPanel URL</span>
                    {project.cpanel?.url ? (
                      <a
                        href={project.cpanel.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-brand-400 hover:text-brand-300 font-medium underline break-all inline-block mt-0.5"
                      >
                        {project.cpanel.url}
                      </a>
                    ) : (
                      <span className="text-slate-200 font-medium">N/A</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-500 block">Username</span>
                    <span className="text-slate-200 font-medium">{project.cpanel?.username || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Password</span>
                    {cpanelPass === '__LOCKED__' ? (
                      <span className="text-amber-500 italic font-semibold">🔒 Locked</span>
                    ) : cpanelPass === '__BAD_KEY__' ? (
                      <span className="text-red-500 italic font-semibold">❌ Decryption Failed</span>
                    ) : cpanelPass ? (
                      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-1.5 pl-2.5 rounded-lg text-slate-200 font-mono mt-1">
                        <span>{showPlainPasswords.cpanel ? cpanelPass : '••••••••'}</span>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => setShowPlainPasswords(prev => ({ ...prev, cpanel: !prev.cpanel }))}
                            className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                          >
                            {showPlainPasswords.cpanel ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleCopy(cpanelPass, 'cpanel')}
                            className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                            title="Copy Password"
                          >
                            {copiedField === 'cpanel' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">No password saved</span>
                    )}
                  </div>
                </div>
              </div>

              {/* WP Admin Credentials Card */}
              {project.category === 'web' && project.webType === 'wordpress' && (
                <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-5 space-y-3.5">
                  <span className="text-sm font-semibold text-brand-400 flex items-center gap-1.5">
                    <Key className="w-4 h-4" /> WP Admin Logins
                  </span>
                  <div className="text-xs space-y-2">
                    <div>
                      <span className="text-slate-500 block">Admin URL</span>
                      {project.wpAdmin?.url ? (
                        <a
                          href={project.wpAdmin.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-brand-400 hover:text-brand-300 font-medium underline break-all inline-block mt-0.5"
                        >
                          {project.wpAdmin.url}
                        </a>
                      ) : (
                        <span className="text-slate-200 font-medium">N/A</span>
                      )}
                    </div>
                    <div>
                      <span className="text-slate-500 block">Username/Email</span>
                      <span className="text-slate-200 font-medium">{project.wpAdmin?.username || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Password</span>
                      {wpAdminPass === '__LOCKED__' ? (
                        <span className="text-amber-500 italic font-semibold">🔒 Locked</span>
                      ) : wpAdminPass === '__BAD_KEY__' ? (
                        <span className="text-red-500 italic font-semibold">❌ Decryption Failed</span>
                      ) : wpAdminPass ? (
                        <div className="flex items-center justify-between bg-slate-900 border border-slate-800 p-1.5 pl-2.5 rounded-lg text-slate-200 font-mono mt-1">
                          <span>{showPlainPasswords.wpAdmin ? wpAdminPass : '••••••••'}</span>
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setShowPlainPasswords(prev => ({ ...prev, wpAdmin: !prev.wpAdmin }))}
                              className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                            >
                              {showPlainPasswords.wpAdmin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleCopy(wpAdminPass, 'wpAdmin')}
                              className="p-1 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                              title="Copy Password"
                            >
                              {copiedField === 'wpAdmin' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">No password saved</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes Card */}
          <div className="bg-slate-950 border border-slate-800/60 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-brand-400">Project Notes</h3>
            <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-normal">
              {project.notes || <span className="text-slate-500 italic">No additional notes added for this project.</span>}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800 flex items-center justify-end text-xs text-slate-500 bg-slate-950/40 rounded-b-2xl">
          <span>Project created: {new Date(project.createdAt).toLocaleDateString()} • Last updated: {new Date(project.updatedAt).toLocaleDateString()}</span>
        </div>
      </div>
  );
}
