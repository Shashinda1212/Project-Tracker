import React, { useState } from 'react';
import { Search, Plus, Filter, Calendar, ChevronRight, GripVertical } from 'lucide-react';
import ProjectForm from './ProjectForm';
import ProjectDetail from './ProjectDetail';

export default function ProjectsTab({
  projects,
  selectedProject,
  setSelectedProject,
  isFormOpen,
  setIsFormOpen,
  editingProject,
  setEditingProject,
  masterKey,
  onPromptMasterKey,
  onSaveProject,
  onReorderProjects
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Drag and Drop States
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    onReorderProjects(draggedIndex, index, filteredProjects);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'finished':
        return <span className="w-2 h-2 rounded-full bg-emerald-400 block" />;
      case 'cancelled':
        return <span className="w-2 h-2 rounded-full bg-red-400 block" />;
      default:
        return <span className="w-2 h-2 rounded-full bg-amber-400 block animate-pulse" />;
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

  // Search & Filtering
  const filteredProjects = projects.filter(project => {
    const matchesSearch =
      project.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.clientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (project.contactName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || project.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleEditClick = (project) => {
    setEditingProject(project);
    setIsFormOpen(true);
  };

  // Rendering logic
  if (isFormOpen) {
    return (
      <div className="animate-fadeIn">
        <ProjectForm
          project={editingProject}
          onSubmit={onSaveProject}
          onCancel={() => {
            setIsFormOpen(false);
            setEditingProject(null);
          }}
          masterKey={masterKey}
          onPromptMasterKey={onPromptMasterKey}
        />
      </div>
    );
  }

  if (selectedProject) {
    return (
      <div className="animate-fadeIn">
        <ProjectDetail
          project={selectedProject}
          onEdit={(proj) => {
            handleEditClick(proj);
          }}
          onClose={() => setSelectedProject(null)}
          masterKey={masterKey}
          onPromptMasterKey={onPromptMasterKey}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Search & Filters */}
      <div className="bg-slate-900/60 border border-slate-900 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4">
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
          onClick={() => {
            setEditingProject(null);
            setIsFormOpen(true);
          }}
          className="w-full md:w-auto bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm py-2.5 px-6 rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-brand-500/10 transition-all hover:shadow-brand-500/20 cursor-pointer whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Projects Ledger Table */}
      <div className="bg-slate-900 border border-slate-900 rounded-2xl shadow-xl overflow-hidden">
        <div className="border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
          <h2 className="text-sm font-bold tracking-wider text-slate-400 uppercase">Project Ledger Records</h2>
          <span className="text-xs text-slate-500">Showing {filteredProjects.length} of {projects.length} entries</span>
        </div>

        {filteredProjects.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/40 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-4 w-12 text-center"></th>
                  <th className="px-6 py-4">Project Name / Client</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Delivery Deadline</th>
                  <th className="px-6 py-4 text-right">Outstanding Balance</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProjects.map((project, index) => {
                  const due = getProjectOutstandingBalance(project);
                  return (
                    <tr
                      key={project.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                      onDrop={(e) => handleDrop(e, index)}
                      onClick={() => setSelectedProject(project)}
                      className={`hover:bg-slate-800/25 transition-all cursor-pointer border-l-2 ${
                        draggedIndex === index
                          ? 'opacity-40 bg-slate-800/50 border-l-brand-500'
                          : dragOverIndex === index
                          ? 'border-l-brand-400 bg-slate-800/10'
                          : 'border-l-transparent'
                      }`}
                    >
                      <td className="px-4 py-4 w-12 text-center text-slate-600 group-hover:text-slate-400 cursor-grab active:cursor-grabbing" onClick={(e) => e.stopPropagation()}>
                        <GripVertical className="w-4 h-4 mx-auto" />
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="font-bold text-slate-100 group-hover:text-brand-300 transition-colors text-sm">
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
      </div>
    </div>
  );
}
