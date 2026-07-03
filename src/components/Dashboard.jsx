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
  Coins
} from 'lucide-react';

export default function Dashboard({ projects, onSelectProject, onCreateProject }) {
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

  const totalDue = totalValue - totalPaid;

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
    if (!name) return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    const colors = [
      'bg-purple-500/10 text-purple-400 border-purple-500/20',
      'bg-amber-500/10 text-amber-450 border-amber-500/20 text-amber-400',
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
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {/* Active Projects Stat */}
        <div className="bg-[#0b1329]/60 backdrop-blur-md border border-purple-500/20 rounded-2xl p-5 shadow-[0_0_20px_-3px_rgba(168,85,247,0.12)] flex items-center gap-4 relative overflow-hidden group hover:border-purple-500/40 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 flex-shrink-0">
            <Folder className="w-5 h-5" />
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Projects</span>
              <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 py-0.5 px-2.5 rounded-full font-bold uppercase tracking-wider">
                {ongoingProjects} / {totalProjects}
              </span>
            </div>
            <div className="text-2xl font-bold text-white mt-1">
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
        <div className="bg-[#0b1329]/60 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-5 shadow-[0_0_20px_-3px_rgba(16,185,129,0.12)] flex items-center gap-4 relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Booked Value</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-500/40" />
            </div>
            <div className="text-2xl font-bold text-white mt-1">
              LKR {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Combined value of all projects
            </div>
          </div>
        </div>

        {/* Collected Revenue Stat */}
        <div className="bg-[#0b1329]/60 backdrop-blur-md border border-sky-500/20 rounded-2xl p-5 shadow-[0_0_20px_-3px_rgba(14,165,233,0.12)] flex items-center gap-4 relative overflow-hidden group hover:border-sky-500/40 transition-all duration-300">
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
        <div className="bg-[#0b1329]/60 backdrop-blur-md border border-amber-500/20 rounded-2xl p-5 shadow-[0_0_20px_-3px_rgba(245,158,11,0.12)] flex items-center gap-4 relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
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

        {/* Overall Net Profit Stat */}
        <div className="bg-[#0b1329]/60 backdrop-blur-md border border-fuchsia-500/20 rounded-2xl p-5 shadow-[0_0_20px_-3px_rgba(217,70,239,0.12)] flex items-center gap-4 relative overflow-hidden group hover:border-fuchsia-500/40 transition-all duration-300">
          <div className="w-12 h-12 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center text-fuchsia-400 flex-shrink-0">
            <Coins className="w-5 h-5" />
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Overall Net Profit</span>
              <DollarSign className="w-3.5 h-3.5 text-fuchsia-500/40" />
            </div>
            <div className="text-2xl font-bold text-fuchsia-400 mt-1">
              LKR {totalNetProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Excluding LKR {totalExpenses.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} cost
            </div>
          </div>
        </div>
      </section>

      {/* Main Dashboard Sub-grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Table (Left columns) */}
        <div className="lg:col-span-2 bg-[#0b1329]/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-850">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
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
                                <span className="font-bold text-white group-hover:text-brand-300 transition-colors block text-sm truncate max-w-[160px] sm:max-w-[240px]">
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
        <div className="bg-[#0b1329]/50 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-4 border-b border-slate-850">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
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
                        <span className="font-bold text-white text-sm group-hover:text-brand-300 transition-colors truncate">
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
