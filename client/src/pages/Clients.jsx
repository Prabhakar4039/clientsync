import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Search, Plus, Edit3, Trash2, X, Filter, Phone, Mail, Building, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Clients = () => {
  const { user } = useAuth();
  
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states for creating/editing
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    industry: 'Technology',
    status: 'Active',
  });

  const isPMOrAdmin = user?.role === 'Admin' || user?.role === 'Project Manager';

  const fetchClients = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (industryFilter) params.industry = industryFilter;

      const res = await axios.get('/api/clients', { params });
      if (res.data.success) {
        setClients(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err.message);
      setError('Failed to load clients list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search, statusFilter, industryFilter]);

  const handleOpenCreateModal = () => {
    setEditingClient(null);
    setFormData({
      name: '',
      company: '',
      email: '',
      phone: '',
      industry: 'Technology',
      status: 'Active',
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      company: client.company,
      email: client.email,
      phone: client.phone || '',
      industry: client.industry || 'Technology',
      status: client.status || 'Active',
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingClient) {
        const res = await axios.put(`/api/clients/${editingClient._id}`, formData);
        if (res.data.success) {
          setSuccess('Client details updated successfully!');
          setTimeout(() => setModalOpen(false), 1000);
          fetchClients();
        }
      } else {
        const res = await axios.post('/api/clients', formData);
        if (res.data.success) {
          setSuccess('New client added successfully!');
          setTimeout(() => setModalOpen(false), 1000);
          fetchClients();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save client.');
    }
  };

  const handleDelete = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client? This will remove all mapping configurations.')) {
      return;
    }
    setError('');
    setSuccess('');

    try {
      const res = await axios.delete(`/api/clients/${clientId}`);
      if (res.data.success) {
        setSuccess('Client account deleted.');
        fetchClients();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete client.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-display">Clients Management</h1>
          <p className="text-sm text-zinc-500 mt-1">Add, update, or audit client company information directories.</p>
        </div>
        {isPMOrAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 px-4.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/15 hover:bg-indigo-500 transition-colors"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Add Client</span>
          </button>
        )}
      </div>

      {/* Status banners */}
      {success && (
        <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs rounded-xl p-3">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-xl p-3 flex items-center space-x-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters & Search row */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-4 rounded-2xl">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by client name, email, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none pr-8 cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>

          <div className="relative">
            <select
              value={industryFilter}
              onChange={(e) => setIndustryFilter(e.target.value)}
              className="text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none pr-8 cursor-pointer"
            >
              <option value="">All Industries</option>
              <option value="Technology">Technology</option>
              <option value="Manufacturing">Manufacturing</option>
              <option value="Logistics">Logistics</option>
              <option value="Software">Software</option>
              <option value="Robotics">Robotics</option>
              <option value="Energy">Energy</option>
              <option value="Media">Media</option>
              <option value="Biotech">Biotech</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Client Cards */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : clients.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-850 rounded-2xl">
          <Building className="mx-auto h-10 w-10 text-zinc-400" />
          <p className="text-sm font-semibold mt-4 text-zinc-900 dark:text-white">No clients found</p>
          <p className="text-xs text-zinc-500 mt-1">Try adjusting your filters or search options.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clients.map((client) => (
            <div
              key={client._id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Company Name & Status */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-extrabold text-base text-zinc-900 dark:text-white font-display">
                      {client.company}
                    </h3>
                    <span className="text-[10px] text-zinc-400 mt-0.5 block">{client.industry}</span>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      client.status === 'Active'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-zinc-200 dark:bg-zinc-855 text-zinc-500'
                    }`}
                  >
                    {client.status}
                  </span>
                </div>

                {/* Main Client Contact */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 space-y-2 text-xs text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{client.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="truncate">{client.email}</span>
                  </div>
                  {client.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-3.5 w-3.5 text-zinc-400" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action row (PM/Admin only) */}
              {isPMOrAdmin && (
                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-end space-x-2.5">
                  <button
                    onClick={() => handleOpenEditModal(client)}
                    className="rounded-lg p-1.5 text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-indigo-500 transition-colors"
                    title="Edit Client details"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  {user?.role === 'Admin' && (
                    <button
                      onClick={() => handleDelete(client._id)}
                      className="rounded-lg p-1.5 text-zinc-450 hover:bg-zinc-150 dark:hover:bg-zinc-855 hover:text-red-500 transition-colors"
                      title="Delete Client record"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Slide-over Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 px-6 py-4 bg-zinc-50 dark:bg-zinc-950/50">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white font-display">
                {editingClient ? 'Edit Client Details' : 'Add New Client Profile'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Client Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="e.g. Acme Corp"
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Industry
                  </label>
                  <select
                    value={formData.industry}
                    onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Technology">Technology</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Logistics">Logistics</option>
                    <option value="Software">Software</option>
                    <option value="Robotics">Robotics</option>
                    <option value="Energy">Energy</option>
                    <option value="Media">Media</option>
                    <option value="Biotech">Biotech</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  Client Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="client@company.com"
                  className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="123-456-7890"
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-950"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-indigo-600/10"
                >
                  {editingClient ? 'Update Details' : 'Add Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
