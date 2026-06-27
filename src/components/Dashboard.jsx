import React, { useState } from 'react';
import { Search, Plus, Filter, Key, LogOut, CheckCircle, Clock, XCircle, TrendingUp, DollarSign, Calendar, ChevronRight, Settings, ShieldAlert, ShieldCheck } from 'lucide-react';

export default function Dashboard({ projects, onSelectProject, onCreateProject, onLogout, masterKey, onSetMasterKey, dbError, onChangeMasterKeyClick }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Local master key input state for the header input field
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [showKeyConfirm, setShowKeyConfirm] = useState(false);

  const handleMasterKeySubmit = (e) => {
    e.preventDefault();
    if (masterKeyInput.trim()) {
      onSetMasterKey(masterKeyInput);
      setShowKeyConfirm(true);
      setTimeout(() => setShowKeyConfirm(false), 2000);
    }
  };

  const handleClearMasterKey = () => {
    onSetMasterKey('');
    setMasterKeyInput('');
  };

  // 1. Calculations & Aggregates
  const totalProjects = projects.length;
  const ongoingProjects = projects.filter(p => p.status === 'ongoing').length;
  const finishedProjects = projects.filter(p => p.status === 'finished').length;
  const cancelledProjects = projects.filter(p => p.status === 'cancelled').length;

  const totalValue = projects.reduce((sum, p) => sum + (p.fullValue || 0), 0);

  // Calculate total paid across all projects
  const totalPaid = projects.reduce((sum, p) => {
    const adv = p.advancePayment || 0;
    const additional = (p.paymentsList || []).reduce((s, pay) => s + pay.amount, 0);
    return sum + adv + additional;
  }, 0);

  const totalDue = totalValue - totalPaid;

  // Find nearest ongoing project deadline
  const upcomingDeadline = projects
    .filter(p => p.status === 'ongoing' && p.deliveryDate)
    .map(p => new Date(p.deliveryDate))
    .sort((a, b) => a - b)[0];

  const formattedDeadline = upcomingDeadline
    ? upcomingDeadline.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    : 'None scheduled';

  // 2. Search & Filtering
  const filteredProjects = projects.filter(project => {
    const matchesSearch =
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.contactName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'finished':
        return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-amber-400 animate-pulse" />;
    }
  };

  const getStatusTextClass = (status) => {
    switch (status) {
      case 'finished': return 'text-emerald-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-amber-400';
    }
  };

  const getProjectOutstandingBalance = (p) => {
    const full = p.fullValue || 0;
    const adv = p.advancePayment || 0;
    const other = (p.paymentsList || []).reduce((s, pay) => s + pay.amount, 0);
    return full - (adv + other);
  };

  return (
    <div className="min-h-screen bg-slate-950 pb-12">
      {/* Top Navigation */}
      <header className="border-b border-slate-900 bg-slate-900/40 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/25">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">AgencyTracker</h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase">Project Ledger</p>
            </div>
          </div>

          {/* Master Key input console */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <form onSubmit={handleMasterKeySubmit} className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 focus-within:border-brand-500/50 transition-all max-w-[280px] w-full">
              <Key className={`w-4 h-4 mr-2 ${masterKey ? 'text-emerald-400' : 'text-slate-500'}`} />
              <input
                type="password"
                placeholder={masterKey ? "Master Key Configured" : "Enter Master Key"}
                value={masterKeyInput}
                onChange={(e) => setMasterKeyInput(e.target.value)}
                disabled={!!masterKey}
                className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 w-full focus:ring-0 focus:border-none focus:outline-none"
              />
              {masterKey ? (
                <button
                  type="button"
                  onClick={handleClearMasterKey}
                  className="text-[10px] text-red-400 hover:text-red-300 font-semibold uppercase tracking-wider ml-2 cursor-pointer"
                >
                  Lock
                </button>
              ) : (
                <button
                  type="submit"
                  className="text-[10px] text-brand-400 hover:text-brand-300 font-semibold uppercase tracking-wider ml-2 cursor-pointer"
                >
                  Apply
                </button>
              )}
            </form>

            {masterKey && (
              <button
                type="button"
                onClick={onChangeMasterKeyClick}
                className="text-[10px] bg-slate-950 border border-slate-800 hover:border-slate-700 text-brand-400 font-bold py-2 px-3.5 rounded-xl transition-all cursor-pointer shadow-sm uppercase tracking-wider whitespace-nowrap"
              >
                Change Key
              </button>
            )}

            {/* Shield Indicator */}
            <div className="flex-shrink-0" title={masterKey ? "Master Key is active. Passwords will decrypt dynamically." : "Master Key is locked. Sensitive credentials cannot be viewed."}>
              {masterKey ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400 animate-pulse" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-amber-500" />
              )}
            </div>

            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-white p-2 hover:bg-slate-900 rounded-xl transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Dashboard */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-8">
        
        {dbError && (
          <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-200 text-sm rounded-2xl flex items-start space-x-3 shadow-lg">
            <span className="font-semibold flex-shrink-0 text-red-400 text-lg">⚠️</span>
            <div className="flex-grow">
              <strong className="block font-bold mb-0.5 text-white">Database Sync Connection Refused:</strong>
              <p className="text-xs text-red-300/80 leading-relaxed">
                {dbError}. Please verify that your Cloud Firestore Security Rules permit reading/writing to the <code className="font-mono bg-slate-950 px-1 py-0.2 rounded border border-red-900/30">projects</code> collection.
              </p>
            </div>
          </div>
        )}

        {/* Stat Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Projects</span>
              <span className="text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 py-0.5 px-2 rounded-full font-bold">
                {ongoingProjects} / {totalProjects}
              </span>
            </div>
            <div className="text-2xl font-black text-white mt-3">{ongoingProjects} <span className="text-sm font-semibold text-slate-500">Ongoing</span></div>
            <div className="text-xs text-slate-400 mt-2 flex items-center space-x-3">
              <span>Finished: <strong className="text-slate-200">{finishedProjects}</strong></span>
              <span>Cancelled: <strong className="text-slate-200">{cancelledProjects}</strong></span>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booked Value</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white mt-3">LKR {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-400 mt-2">Combined value of all projects</p>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collected Revenue</span>
              <DollarSign className="w-4 h-4 text-sky-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 mt-3">LKR {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <p className="text-xs text-slate-400 mt-2">
              Advance deposits + logged payments
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding Dues</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 mt-3">LKR {totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-xs text-slate-400 mt-2 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Next Deadline: <strong className="text-brand-300">{formattedDeadline}</strong></span>
            </div>
          </div>
        </section>

        {/* Action Controls & Filters */}
        <section className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-grow max-w-3xl">
            {/* Search Input */}
            <div className="relative flex-grow">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects, clients, contacts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 text-sm focus:border-brand-500 focus:ring-1 focus:ring-brand-500/10 placeholder-slate-600"
              />
            </div>

            {/* Category Filter */}
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-300 text-sm w-full sm:w-44 focus:border-brand-500 focus:ring-0 appearance-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="web">Web Projects</option>
                <option value="pos">POS Systems</option>
                <option value="other">Other Software</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl py-2.5 px-4 text-slate-300 text-sm w-full sm:w-40 focus:border-brand-500 focus:ring-0 appearance-none cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="ongoing">Ongoing</option>
                <option value="finished">Finished</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <button
            onClick={onCreateProject}
            className="w-full md:w-auto bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm py-2.5 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/10 transition-all hover:shadow-brand-500/20 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
          </button>
        </section>

        {/* Project List */}
        <section className="bg-slate-900 border border-slate-900 rounded-2xl shadow-xl overflow-hidden">
          <div className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
            <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase">Project Ledger Records</h2>
            <span className="text-xs text-slate-500">Showing {filteredProjects.length} of {projects.length} entries</span>
          </div>

          {filteredProjects.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="px-6 py-4">Project Name / Client</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Delivery Deadline</th>
                    <th className="px-6 py-4 text-right">Outstanding Balance</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredProjects.map((project) => {
                    const due = getProjectOutstandingBalance(project);
                    return (
                      <tr
                        key={project.id}
                        onClick={() => onSelectProject(project)}
                        className="hover:bg-slate-800/25 transition-colors cursor-pointer group"
                      >
                        <td className="px-6 py-4.5">
                          <div className="font-bold text-white group-hover:text-brand-300 transition-colors text-sm">
                            {project.projectName}
                          </div>
                          <div className="text-xs text-slate-400 mt-1 font-medium flex items-center space-x-1">
                            <span>{project.clientName || 'No Client'}</span>
                            {project.contactName && (
                              <>
                                <span>•</span>
                                <span>{project.contactName}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="flex flex-col items-start gap-1">
                            <span className="text-xs text-slate-200 capitalize font-medium">
                              {project.category === 'web' ? 'Web System' : project.category === 'pos' ? 'Point of Sale' : 'Other Code'}
                            </span>
                            {project.category === 'web' && (
                              <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-800 py-0.5 px-2 rounded-full font-bold uppercase tracking-wider">
                                {project.webType === 'wordpress' ? 'WordPress' : 'Custom Code'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4.5">
                          <div className="flex items-center space-x-2 font-bold text-xs uppercase tracking-wider">
                            {getStatusIcon(project.status)}
                            <span className={getStatusTextClass(project.status)}>{project.status}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4.5 text-slate-300 font-semibold text-xs">
                          {project.deliveryDate ? (
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-500" />
                              {project.deliveryDate}
                            </span>
                          ) : (
                            <span className="text-slate-500 italic">Unscheduled</span>
                          )}
                        </td>
                        <td className="px-6 py-4.5 text-right font-mono font-bold text-sm">
                          {due > 0 ? (
                            <span className="text-amber-400">LKR {due.toFixed(2)}</span>
                          ) : due === 0 && (project.fullValue || 0) > 0 ? (
                            <span className="text-emerald-400">Paid</span>
                          ) : (
                            <span className="text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4.5 text-right">
                          <button className="text-slate-500 group-hover:text-brand-400 transition-colors p-1.5 hover:bg-slate-850 rounded-lg cursor-pointer">
                            <ChevronRight className="w-5 h-5 transform group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <p className="text-sm font-medium">No projects match the selected search filters.</p>
              <button
                onClick={() => { setSearchQuery(''); setStatusFilter('all'); setCategoryFilter('all'); }}
                className="mt-4 text-xs font-bold text-brand-400 hover:text-brand-300 underline cursor-pointer"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
