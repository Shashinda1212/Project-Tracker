import React from 'react';
import { 
  Folder, 
  DollarSign, 
  TrendingUp, 
  Wallet, 
  Calendar, 
  FileText, 
  Target, 
  ChevronRight, 
  AlertCircle, 
  ArrowRight, 
  Plus,
  Coins,
  Globe,
  Server
} from 'lucide-react';

export default function Dashboard({ projects, onSelectProject, onCreateProject }) {
  const getProjectOutstandingBalance = (p) => {
    const full = p.fullValue || 0;
    const adv = p.advancePayment || 0;
    const other = (p.paymentsList || []).reduce((s, pay) => s + pay.amount, 0);
    return full - (adv + other);
  };

  // Calculations & Aggregates
  const totalProjects = projects.length;
  const ongoingProjects = projects.filter(p => p.status === 'ongoing').length;
  const finishedProjects = projects.filter(p => p.status === 'finished').length;
  const cancelledProjects = projects.filter(p => p.status === 'cancelled').length;

  const totalValue = projects.reduce((sum, p) => sum + (p.fullValue || 0), 0);

  const totalPaid = projects.reduce((sum, p) => {
    const adv = p.advancePayment || 0;
    const additional = (p.paymentsList || []).reduce((s, pay) => s + pay.amount, 0);
    return sum + adv + additional;
  }, 0);

  const nonCancelledProjects = projects.filter(p => p.status !== 'cancelled');
  const cancelledProjectsList = projects.filter(p => p.status === 'cancelled');

  const totalDue = nonCancelledProjects.reduce((sum, p) => sum + getProjectOutstandingBalance(p), 0);
  const totalCancelledDue = cancelledProjectsList.reduce((sum, p) => sum + getProjectOutstandingBalance(p), 0);

  const totalExpenses = projects.reduce((sum, p) => {
    const domainCost = p.domainPlatform?.cost || 0;
    const hostingCost = p.hostingPlatform?.cost || 0;
    const themeCost = p.themeCost || 0;
    const pluginsCost = (p.pluginsUsed || []).reduce((s, pl) => s + pl.cost, 0);
    return sum + domainCost + hostingCost + themeCost + pluginsCost;
  }, 0);

  const totalNetProfit = totalValue - totalExpenses;

  // Find nearest ongoing project deadlines (top 3)
  const upcomingDeadlines = projects
    .filter(p => p.status === 'ongoing' && p.deliveryDate)
    .sort((a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate))
    .slice(0, 3);

  // Find top 5 most recently updated projects
  const recentProjects = projects
    .sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt))
    .slice(0, 5);

  // Find expiring assets (domains, and hosting platforms if type is shared hosting)
  const expiringAlerts = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

  projects.forEach(p => {
    // 1. Check Domain Platform Expiration
    if (p.domainPlatform?.expirationDate) {
      const expiryDateStr = p.domainPlatform.expirationDate;
      const expiryDate = new Date(expiryDateStr);
      if (!isNaN(expiryDate.getTime()) && expiryDate <= thirtyDaysFromNow) {
        const diffTime = expiryDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        expiringAlerts.push({
          type: 'domain',
          project: p,
          projectName: p.projectName,
          itemName: p.domainPlatform.platformName || 'Domain',
          expiryDate: expiryDateStr,
          daysLeft,
          isExpired: daysLeft <= 0
        });
      }
    }

    // 2. Check Hosting Platform Expiration (if shared hosting)
    if (p.hostingPlatform?.type === 'shared' && p.hostingPlatform?.expirationDate) {
      const expiryDateStr = p.hostingPlatform.expirationDate;
      const expiryDate = new Date(expiryDateStr);
      if (!isNaN(expiryDate.getTime()) && expiryDate <= thirtyDaysFromNow) {
        const diffTime = expiryDate.getTime() - today.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        expiringAlerts.push({
          type: 'hosting',
          project: p,
          projectName: p.projectName,
          itemName: p.hostingPlatform.provider || 'Hosting',
          expiryDate: expiryDateStr,
          daysLeft,
          isExpired: daysLeft <= 0
        });
      }
    }
  });

  // Sort by expired first, then days remaining
  expiringAlerts.sort((a, b) => {
    if (a.isExpired && !b.isExpired) return -1;
    if (!a.isExpired && b.isExpired) return 1;
    return a.daysLeft - b.daysLeft;
  });

  const getStatusTextClass = (status) => {
    switch (status) {
      case 'finished': return 'text-emerald-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-amber-400';
    }
  };

  const getProjectInitials = (name) => {
    if (!name) return '??';
    return name
      .split(' ')
      .filter(Boolean)
      .map(word => word[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const getProjectColorClass = (name) => {
    if (!name) return 'bg-brand-500/10 text-brand-400 border-brand-500/20';
    const colors = [
      'bg-brand-500/10 text-brand-400 border-brand-500/20',
      'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'bg-sky-500/10 text-sky-400 border-sky-500/20',
      'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'bg-rose-500/10 text-rose-400 border-rose-500/20'
    ];
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    return colors[sum % colors.length];
  };

  return (
    <div className="relative space-y-8 animate-fadeIn">
      {/* Background Decorative Ambient Flows */}
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* Stat Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Active Projects Stat */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-brand-500/20 rounded-2xl p-5 shadow-[0_0_20px_-3px_rgba(59,130,246,0.15)] flex items-center gap-4 relative overflow-hidden group hover:border-brand-500/40 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
            <Folder className="w-5 h-5" />
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Projects</span>
              <span className="text-xs bg-brand-500/10 text-brand-400 border border-brand-500/20 py-0.5 px-2.5 rounded-full font-bold uppercase tracking-wider">
                {ongoingProjects} / {totalProjects}
              </span>
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              {ongoingProjects} <span className="text-sm font-semibold text-slate-400">Ongoing</span>
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
              <span>Finished: <strong className="text-slate-300">{finishedProjects}</strong></span>
              <span>•</span>
              <span>Cancelled: <strong className="text-slate-300">{cancelledProjects}</strong></span>
            </div>
          </div>
        </div>

        {/* Booked Value Stat */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-5 shadow-[0_0_20px_-3px_rgba(16,185,129,0.12)] flex items-center gap-4 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booked Value</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-500/40" />
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-1">
              LKR {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Combined value of all projects
            </div>
          </div>
        </div>

        {/* Collected Revenue Stat */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-sky-500/20 rounded-2xl p-5 shadow-[0_0_20px_-3px_rgba(14,165,233,0.12)] flex items-center gap-4 relative overflow-hidden group hover:border-sky-500/40 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Collected Revenue</span>
              <DollarSign className="w-3.5 h-3.5 text-sky-500/40" />
            </div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              LKR {totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Advance deposits + logged payments
            </div>
          </div>
        </div>

        {/* Outstanding Dues Stat */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-amber-500/20 rounded-2xl p-5 shadow-[0_0_20px_-3px_rgba(245,158,11,0.12)] flex items-center gap-4 relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 flex-shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Outstanding Dues</span>
              <DollarSign className="w-3.5 h-3.5 text-amber-500/40" />
            </div>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              LKR {totalDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1 flex items-center space-x-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Next Target: <strong className="font-semibold text-slate-300">{upcomingDeadlines[0]?.deliveryDate || 'N/A'}</strong></span>
            </div>
          </div>
        </div>

        {/* Cancelled Outstanding Stat */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-red-500/20 rounded-2xl p-5 shadow-[0_0_20px_-3px_rgba(239,68,68,0.12)] flex items-center gap-4 relative overflow-hidden group hover:border-red-500/40 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 flex-shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cancelled Outstanding</span>
              <DollarSign className="w-3.5 h-3.5 text-red-500/40" />
            </div>
            <div className="text-2xl font-bold text-red-400 mt-1">
              LKR {totalCancelledDue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Balances from cancelled projects
            </div>
          </div>
        </div>

        {/* Overall Net Profit Stat */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-brand-500/20 rounded-2xl p-5 shadow-[0_0_20px_-3px_rgba(59,130,246,0.15)] flex items-center gap-4 relative overflow-hidden group hover:border-brand-500/40 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 flex-shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Net Profit</span>
              <DollarSign className="w-3.5 h-3.5 text-brand-500/40" />
            </div>
            <div className="text-2xl font-bold text-brand-400 mt-1">
              LKR {totalNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Excluding LKR {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} cost
            </div>
          </div>
        </div>
      </section>      {/* Expiring Assets Alert */}
      {expiringAlerts.length > 0 && (
        <section className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-6 shadow-[0_0_20px_-3px_rgba(245,158,11,0.1)] space-y-4">
          <div className="flex items-center space-x-3 pb-3 border-b border-amber-500/10">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400">Asset Renewal Alerts</h3>
              <p className="text-xs text-slate-400 mt-0.5">The following domains or shared hosting platforms are expired or expiring within the next 30 days.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {expiringAlerts.map(({ type, project, projectName, itemName, expiryDate, daysLeft, isExpired }) => (
              <div 
                key={`${project.id}-${type}`}
                onClick={() => onSelectProject(project)}
                className="bg-slate-950/55 hover:bg-slate-950/80 border border-amber-500/10 hover:border-amber-500/30 p-4 rounded-xl cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="min-w-0 flex-grow">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-slate-100 group-hover:text-brand-300 transition-colors text-sm truncate max-w-[130px] sm:max-w-[180px]">
                      {projectName}
                    </span>
                    <span className={`text-[9px] font-bold uppercase py-0.5 px-2 rounded-full border flex items-center gap-1 ${
                      type === 'domain' 
                        ? 'bg-sky-500/10 border-sky-500/20 text-sky-400' 
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    }`}>
                      {type === 'domain' ? <Globe className="w-2.5 h-2.5" /> : <Server className="w-2.5 h-2.5" />}
                      <span>{type}</span>
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block mt-1 font-medium truncate max-w-[180px]">
                    Platform: {itemName || 'N/A'}
                  </span>
                  <span className="text-xs text-slate-500 block mt-0.5 font-medium">
                    Expiry Date: {expiryDate}
                  </span>
                </div>
                <div className="flex-shrink-0 text-right ml-4">
                  {isExpired ? (
                    <span className="text-xs font-bold uppercase py-1 px-3 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 animate-pulse">
                      Expired
                    </span>
                  ) : (
                    <span className={`text-xs font-bold uppercase py-1 px-3 rounded-full flex items-center gap-1.5 border ${
                      daysLeft <= 7 
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-450 animate-pulse' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    }`}>
                      {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Dashboard Sub-grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Table (Left columns) */}
        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-850">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Recent Updates</h3>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-medium tracking-wide">Last 5 active projects</span>
            </div>

            {recentProjects.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-850/60 bg-transparent text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 pr-4 pl-0">Project</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Outstanding</th>
                      <th className="py-3 pl-4 pr-0"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40">
                    {recentProjects.map((project) => {
                      const due = getProjectOutstandingBalance(project);
                      const initials = getProjectInitials(project.projectName);
                      const colorClass = getProjectColorClass(project.projectName);
                      return (
                        <tr
                          key={project.id}
                          onClick={() => onSelectProject(project)}
                          className="hover:bg-slate-850/40 transition-colors cursor-pointer group"
                        >
                          <td className="py-3.5 pr-4 pl-0">
                            <div className="flex items-center space-x-3">
                              <div className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-extrabold ${colorClass} flex-shrink-0 shadow-sm`}>
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-slate-100 group-hover:text-brand-300 transition-colors block text-sm truncate max-w-[160px] sm:max-w-[240px]">
                                  {project.projectName}
                                </span>
                                <span className="text-xs text-slate-500 block mt-0.5 font-medium truncate max-w-[160px] sm:max-w-[240px]">{project.clientName || 'No Client'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center space-x-1.5 font-bold text-xs uppercase tracking-wider">
                              <span className={`w-1.5 h-1.5 rounded-full ${project.status === 'finished' ? 'bg-emerald-400' : project.status === 'cancelled' ? 'bg-red-400' : 'bg-amber-400 animate-pulse'}`} />
                              <span className={getStatusTextClass(project.status)}>{project.status}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-sm whitespace-nowrap">
                            {due > 0 ? (
                              <span className="text-amber-400 font-semibold">LKR {due.toFixed(2)}</span>
                            ) : due === 0 && (project.fullValue || 0) > 0 ? (
                              <span className="text-emerald-400">Paid</span>
                            ) : (
                              <span className="text-slate-600">—</span>
                            )}
                          </td>
                          <td className="py-3.5 pl-4 pr-0 text-right">
                            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-brand-400 transition-all inline" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs italic">No projects logged yet.</div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-850/60 flex items-center justify-center">
            <button
              onClick={() => onSelectProject(null)}
              className="text-slate-400 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest flex items-center space-x-2 cursor-pointer"
            >
              <span>View Full Project Ledger</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Upcoming Deadlines (Right column) */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-850">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-white">Upcoming Targets</h3>
                </div>
              </div>
              <span className="text-xs text-slate-500 font-medium tracking-wide">Nearest milestones</span>
            </div>

            {upcomingDeadlines.length > 0 ? (
              <div className="space-y-3.5">
                {upcomingDeadlines.map((project) => {
                  const deadlineDate = new Date(project.deliveryDate);
                  const isOverdue = deadlineDate < new Date() && project.status === 'ongoing';
                  return (
                    <div
                      key={project.id}
                      onClick={() => onSelectProject(project)}
                      className={`bg-slate-950/40 p-4 rounded-xl transition-all cursor-pointer space-y-2.5 border group ${
                        isOverdue
                          ? 'border-red-500/30 shadow-[0_0_12px_-3px_rgba(239,68,68,0.25)] hover:border-red-500/50'
                          : 'border-slate-850 hover:border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-bold text-slate-100 text-sm group-hover:text-brand-300 transition-colors truncate">
                          {project.projectName}
                        </span>
                        {isOverdue && (
                          <span className="flex-shrink-0 text-xs bg-red-500/10 border border-red-500/20 text-red-400 font-bold uppercase py-0.5 px-2 rounded-full flex items-center gap-1 tracking-wider">
                            <AlertCircle className="w-3 h-3" /> Overdue
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-xs text-slate-550">
                        <span className="text-slate-500">Client: <strong className="text-slate-400 font-medium">{project.clientName || 'N/A'}</strong></span>
                        <span className={`font-semibold flex items-center gap-1.5 ${isOverdue ? 'text-red-400 font-extrabold animate-pulse' : 'text-slate-400'}`}>
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {project.deliveryDate}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs italic">No ongoing projects scheduled.</div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-850/60 flex items-center justify-center">
            <button
              onClick={onCreateProject}
              className="text-slate-400 hover:text-white transition-colors font-bold text-xs uppercase tracking-widest flex items-center space-x-2.5 cursor-pointer"
            >
              <span>Add New Project</span>
              <div className="w-6 h-6 border border-slate-800 hover:border-slate-700 rounded bg-slate-950 flex items-center justify-center text-slate-400">
                <Plus className="w-3.5 h-3.5" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
