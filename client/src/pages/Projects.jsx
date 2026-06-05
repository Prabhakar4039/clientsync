import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Folder, Plus, Calendar, DollarSign, Edit3, Trash2, X, Search, 
  Flag, CheckSquare, Target, User, ShieldAlert, Award, FolderOpen
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Projects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [clients, setClients] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');

  // Selected details drawer
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailProjectData, setDetailProjectData] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    priority: 'Medium',
    status: 'Planning',
    client: '',
    team: [],
  });

  const isPMOrAdmin = user?.role === 'Admin' || user?.role === 'Project Manager';
  const isAdmin = user?.role === 'Admin';

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (priorityFilter) params.priority = priorityFilter;

      const res = await axios.get('/api/projects', { params });
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching projects:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [clientsRes, teamRes] = await Promise.all([
        axios.get('/api/clients'),
        axios.get('/api/team'),
      ]);
      if (clientsRes.data.success) setClients(clientsRes.data.data);
      if (teamRes.data.success) setTeamMembers(teamRes.data.data);
    } catch (err) {
      console.error('Error loading dropdown dependencies:', err.message);
    }
  };

  useEffect(() => {
    fetchProjects();
    if (isPMOrAdmin) {
      fetchDependencies();
    }
  }, [search, statusFilter, priorityFilter]);

  const handleOpenCreateModal = () => {
    setEditingProject(null);
    setFormData({
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      budget: '',
      priority: 'Medium',
      status: 'Planning',
      client: clients.length > 0 ? clients[0]._id : '',
      team: [],
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (project) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      startDate: project.startDate ? new Date(project.startDate).toISOString().split('T')[0] : '',
      endDate: project.endDate ? new Date(project.endDate).toISOString().split('T')[0] : '',
      budget: project.budget,
      priority: project.priority || 'Medium',
      status: project.status || 'Planning',
      client: project.client?._id || '',
      team: project.team ? project.team.map(t => t._id) : [],
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleToggleTeamSelection = (userId) => {
    setFormData(prev => {
      const isSelected = prev.team.includes(userId);
      const updatedTeam = isSelected 
        ? prev.team.filter(id => id !== userId)
        : [...prev.team, userId];
      return { ...prev, team: updatedTeam };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.client) {
      return setError('Please associate a client');
    }

    try {
      if (editingProject) {
        const res = await axios.put(`/api/projects/${editingProject._id}`, formData);
        if (res.data.success) {
          setSuccess('Project updated successfully!');
          setTimeout(() => setModalOpen(false), 1000);
          fetchProjects();
          if (selectedProject?._id === editingProject._id) {
            handleOpenDetails(editingProject);
          }
        }
      } else {
        const res = await axios.post('/api/projects', formData);
        if (res.data.success) {
          setSuccess('Project created successfully!');
          setTimeout(() => setModalOpen(false), 1000);
          fetchProjects();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project.');
    }
  };

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? All tasks and milestones will be deleted!')) {
      return;
    }
    setError('');

    try {
      const res = await axios.delete(`/api/projects/${projectId}`);
      if (res.data.success) {
        setSuccess('Project deleted successfully.');
        setSelectedProject(null);
        fetchProjects();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project.');
    }
  };

  const handleOpenDetails = async (project) => {
    setSelectedProject(project);
    setDetailLoading(true);
    try {
      const res = await axios.get(`/api/projects/${project._id}`);
      if (res.data.success) {
        setDetailProjectData(res.data.data);
      }
    } catch (err) {
      console.error('Error loading project details:', err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-display">Projects Workspace</h1>
          <p className="text-sm text-zinc-500 mt-1">Manage budgets, track team allocations, and verify deadlines.</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 px-4.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/15 hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Create Project</span>
          </button>
        )}
      </div>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Project Lists Panel */}
        <div className="xl:col-span-2 space-y-5">
          {/* Search/Filters bar */}
          <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-4 rounded-2xl">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search projects by name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 rounded-xl px-3 py-2.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer pr-6 appearance-none"
              >
                <option value="">All Statuses</option>
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="Review">Review</option>
                <option value="Completed">Completed</option>
                <option value="On Hold">On Hold</option>
              </select>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer pr-6 appearance-none"
              >
                <option value="">All Priorities</option>
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          {/* List display */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl">
              <FolderOpen className="mx-auto h-12 w-12 text-zinc-400" />
              <p className="text-sm font-semibold mt-4 text-zinc-900 dark:text-white">No projects found</p>
              <p className="text-xs text-zinc-500 mt-1">Get started by adding projects to this workspace.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {projects.map((project) => {
                const isSelected = selectedProject?._id === project._id;
                return (
                  <div
                    key={project._id}
                    onClick={() => handleOpenDetails(project)}
                    className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-sm cursor-pointer hover:shadow-md transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'border-indigo-500 dark:border-indigo-500 ring-1 ring-indigo-500' 
                        : 'border-zinc-200 dark:border-zinc-850'
                    }`}
                  >
                    <div>
                      {/* Priority, Client & Status */}
                      <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-450 uppercase mb-3">
                        <span className="truncate max-w-[65%] text-indigo-500">{project.client?.company || 'Internal Project'}</span>
                        <span className={`px-2 py-0.5 rounded-full ${
                          project.status === 'Completed' ? 'bg-emerald-500/10 text-emerald-500' :
                          project.status === 'Active' ? 'bg-blue-500/10 text-blue-500' :
                          project.status === 'Review' ? 'bg-violet-500/10 text-violet-500' :
                          project.status === 'On Hold' ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-550' :
                          'bg-amber-500/10 text-amber-500' // Planning
                        }`}>{project.status}</span>
                      </div>

                      <h3 className="font-extrabold text-base text-zinc-900 dark:text-white font-display mb-1.5 truncate">
                        {project.name}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mb-4">
                        {project.description}
                      </p>
                    </div>

                    <div className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-850">
                      {/* Budget and Deadline */}
                      <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
                          <span className="font-semibold text-zinc-900 dark:text-white">${project.budget.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3.5 w-3.5 text-zinc-400" />
                          <span>{project.endDate ? new Date(project.endDate).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'No date'}</span>
                        </div>
                      </div>

                      {/* Team Avatars */}
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-1.5 overflow-hidden">
                          {project.team?.slice(0, 4)?.map((member) => (
                            <img
                              key={member._id}
                              className="inline-block h-6.5 w-6.5 rounded-full bg-zinc-200 dark:bg-zinc-800 ring-2 ring-white dark:ring-zinc-900 object-cover"
                              src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                              alt={member.name}
                              title={member.name}
                            />
                          ))}
                          {project.team?.length > 4 && (
                            <span className="flex h-6.5 w-6.5 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-semibold text-zinc-300 ring-2 ring-white dark:ring-zinc-900">
                              +{project.team.length - 4}
                            </span>
                          )}
                        </div>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          project.priority === 'High' ? 'bg-red-500/10 text-red-500' :
                          project.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                          'bg-zinc-200 dark:bg-zinc-850 text-zinc-500'
                        }`}>
                          {project.priority} Priority
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Project Details Panel (1/3 Width) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-5 shadow-sm h-full">
          {selectedProject ? (
            detailLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
              </div>
            ) : detailProjectData ? (
              <div className="space-y-6">
                {/* Header Title / Close */}
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{detailProjectData.client?.company}</span>
                    <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white font-display mt-0.5">{detailProjectData.name}</h2>
                  </div>
                  <button onClick={() => setSelectedProject(null)} className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850">
                  <div className="flex items-center justify-between text-xs font-semibold mb-2">
                    <span className="text-zinc-500">Project Completion:</span>
                    <span className="text-indigo-500">{detailProjectData.stats?.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${detailProjectData.stats?.progress || 0}%` }}></div>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2">
                    <span>{detailProjectData.stats?.completedTasks} Completed tasks</span>
                    <span>{detailProjectData.stats?.totalTasks} Total tasks</span>
                  </div>
                </div>

                {/* Milestones list */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3.5 flex items-center space-x-1.5">
                    <Target className="h-4 w-4 text-indigo-500" />
                    <span>Project Milestones</span>
                  </h4>
                  <div className="space-y-3">
                    {detailProjectData.milestones?.length === 0 && (
                      <p className="text-xs text-zinc-500 italic py-2">No milestones set for this project.</p>
                    )}
                    {detailProjectData.milestones?.map((milestone) => (
                      <div key={milestone._id} className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-150 dark:border-zinc-850 flex items-center justify-between text-xs">
                        <div className="space-y-1 max-w-[70%]">
                          <span className="font-semibold text-zinc-850 dark:text-zinc-200 block truncate">{milestone.name}</span>
                          <span className="text-[10px] text-zinc-400 block">Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                        </div>
                        <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          milestone.completionPercent === 100 
                            ? 'bg-emerald-500/10 text-emerald-500' 
                            : 'bg-indigo-500/10 text-indigo-500'
                        }`}>{milestone.completionPercent}%</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team Directory list */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3 flex items-center space-x-1.5">
                    <User className="h-4 w-4 text-indigo-500" />
                    <span>Assigned Team ({detailProjectData.team?.length})</span>
                  </h4>
                  <div className="space-y-2.5">
                    {detailProjectData.team?.map((member) => (
                      <div key={member._id} className="flex items-center space-x-3">
                        <img
                          src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                          alt={member.name}
                          className="h-8 w-8 rounded-lg object-cover bg-zinc-200 dark:bg-zinc-800"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 block truncate">{member.name}</span>
                          <span className="text-[10px] text-zinc-400 block uppercase tracking-wider">{member.role}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Modify/Delete actions (PM/Admin only) */}
                {isPMOrAdmin && (
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-850 flex items-center gap-3">
                    <button
                      onClick={() => handleOpenEditModal(detailProjectData)}
                      className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-xl text-xs font-semibold text-zinc-700 dark:text-zinc-300 transition-colors"
                    >
                      <Edit3 className="h-4.5 w-4.5" />
                      <span>Edit details</span>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(detailProjectData._id)}
                        className="flex-1 flex items-center justify-center space-x-2 py-2 px-3 bg-red-650 hover:bg-red-500 text-white rounded-xl text-xs font-semibold transition-colors"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                        <span>Delete Project</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : null
          ) : (
            <div className="text-center py-20 text-zinc-500">
              <Folder className="mx-auto h-10 w-10 text-zinc-300 mb-4" />
              <p className="text-xs font-medium">Select a project card to view milestones, team directory, and completion progress.</p>
            </div>
          )}
        </div>
      </div>

      {/* Slide-over creation/edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 px-6 py-4 bg-zinc-50 dark:bg-zinc-950/50">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white font-display">
                {editingProject ? 'Edit Project Profile' : 'Create New Project'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {error && (
                <div className="bg-red-950/50 border border-red-800 text-red-200 text-xs rounded-xl p-3.5 flex items-center space-x-2">
                  <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-200 text-xs rounded-xl p-3.5">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Project Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Website Overhaul"
                  className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Project Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe project details, technology requirements, or scoping timelines..."
                  rows="3"
                  className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Associate Client *</label>
                  <select
                    value={formData.client}
                    onChange={(e) => setFormData({ ...formData, client: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value="">-- Choose Client Profile --</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.company} ({client.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Project Budget ($ USD) *</label>
                  <input
                    type="number"
                    required
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="e.g. 5000"
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Project Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Project Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value="Planning">Planning</option>
                    <option value="Active">Active</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                  </select>
                </div>
              </div>

              {/* Assign team members */}
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2.5">
                  Assign internal Team Members ({formData.team.length} selected)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border border-zinc-200 dark:border-zinc-850 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/50">
                  {teamMembers.map((member) => {
                    const isSelected = formData.team.includes(member._id);
                    return (
                      <div
                        key={member._id}
                        onClick={() => handleToggleTeamSelection(member._id)}
                        className={`flex items-center space-x-2.5 p-2 rounded-lg cursor-pointer border text-xs transition-colors ${
                          isSelected 
                            ? 'bg-indigo-600/15 border-indigo-500 text-indigo-500' 
                            : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 text-zinc-700 dark:text-zinc-300'
                        }`}
                      >
                        <img
                          src={member.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`}
                          alt={member.name}
                          className="h-6.5 w-6.5 rounded-md object-cover bg-zinc-200"
                        />
                        <div className="min-w-0 flex-1">
                          <span className="font-semibold block truncate">{member.name}</span>
                          <span className="text-[9px] text-zinc-500 block truncate">{member.department}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Action row */}
              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10"
                >
                  {editingProject ? 'Update Details' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
