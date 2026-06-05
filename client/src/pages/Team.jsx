import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Users, Mail, ShieldAlert, Plus, Edit3, Trash2, X, Briefcase, 
  Building, CheckSquare, BarChart, PlusCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Team = () => {
  const { user } = useAuth();
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Team Member',
    department: 'Development',
    efficiency: 90,
  });

  const isAdmin = user?.role === 'Admin';

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/team');
      if (res.data.success) {
        setTeam(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching team list:', err.message);
      setError('Failed to fetch team members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeam();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingMember(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'Team Member',
      department: 'Development',
      efficiency: 90,
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (member) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      email: member.email,
      password: '', // blank during edit
      role: member.role || 'Team Member',
      department: member.department || 'Development',
      efficiency: member.performance?.efficiency || 90,
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
      if (editingMember) {
        // Update role, department, name, email, and efficiency
        const res = await axios.put(`/api/team/${editingMember._id}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
          department: formData.department,
          performance: {
            ...editingMember.performance,
            efficiency: Number(formData.efficiency),
          },
        });
        if (res.data.success) {
          setSuccess('Team member updated successfully!');
          setTimeout(() => setModalOpen(false), 1000);
          fetchTeam();
        }
      } else {
        // Create user
        if (!formData.password) return setError('Password is required');
        const res = await axios.post('/api/team', formData);
        if (res.data.success) {
          setSuccess('Team member created successfully!');
          setTimeout(() => setModalOpen(false), 1000);
          fetchTeam();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save team member.');
    }
  };

  const handleDelete = async (memberId) => {
    if (!window.confirm('Are you sure you want to delete this team member? All assigned tasks will be unassigned.')) {
      return;
    }
    setError('');

    try {
      const res = await axios.delete(`/api/team/${memberId}`);
      if (res.data.success) {
        setSuccess('Team member account deleted.');
        fetchTeam();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete team member.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-display flex items-center space-x-2">
            <Users className="h-6 w-6 text-indigo-500" />
            <span>Internal Agency Team</span>
          </h1>
          <p className="text-sm text-zinc-550 mt-1">Audit task loads, department allocations, and staff efficiencies.</p>
        </div>
        {isAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 px-4.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/15 hover:bg-indigo-500 transition-colors"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            <span>Add Team Member</span>
          </button>
        )}
      </div>

      {/* Status banners */}
      {success && (
        <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-350 text-xs rounded-xl p-3">
          {success}
        </div>
      )}
      {error && (
        <div className="bg-red-950/40 border border-red-800 text-red-300 text-xs rounded-xl p-3 flex items-center space-x-2">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid of Team Member profiles */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {team.map((member) => (
            <div
              key={member._id}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-5 shadow-sm hover:shadow hover:border-zinc-350 dark:hover:border-zinc-750 transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* Profile Avatar / Initials */}
                <div className="flex items-center space-x-3">
                  <img
                    src={member.avatar}
                    alt={member.name}
                    className="h-12 w-12 rounded-xl object-cover bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white font-display truncate">
                      {member.name}
                    </h3>
                    <span className="text-[10px] text-indigo-500 uppercase font-semibold tracking-wider">{member.role}</span>
                  </div>
                </div>

                {/* Info and statistics */}
                <div className="pt-3.5 border-t border-zinc-100 dark:border-zinc-850 space-y-2.5 text-xs text-zinc-550 dark:text-zinc-400">
                  <div className="flex items-center space-x-2">
                    <Mail className="h-3.5 w-3.5 text-zinc-400" />
                    <span className="truncate">{member.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Building className="h-3.5 w-3.5 text-zinc-400" />
                    <span>{member.department} Department</span>
                  </div>
                  
                  {/* Task counts */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-150 dark:border-zinc-850 text-center">
                      <span className="block text-[8px] font-bold text-zinc-400 uppercase">Active Tasks</span>
                      <span className="font-black text-sm text-zinc-850 dark:text-white mt-0.5 block">
                        {member.stats?.pendingTasks || 0}
                      </span>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-950 p-2 rounded-lg border border-zinc-150 dark:border-zinc-850 text-center">
                      <span className="block text-[8px] font-bold text-zinc-400 uppercase">Efficiency</span>
                      <span className="font-black text-sm text-emerald-500 mt-0.5 block">
                        {member.performance?.efficiency || 90}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action row (Admin only) */}
              {isAdmin && member._id !== user._id && (
                <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-end space-x-2.5">
                  <button
                    onClick={() => handleOpenEditModal(member)}
                    className="rounded-lg p-1.5 text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-indigo-500 transition-colors"
                    title="Edit Role/Department"
                  >
                    <Edit3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(member._id)}
                    className="rounded-lg p-1.5 text-zinc-450 hover:bg-zinc-150 dark:hover:bg-zinc-855 hover:text-red-500 transition-colors"
                    title="Delete Account"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 px-6 py-4 bg-zinc-50 dark:bg-zinc-950/50">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white font-display">
                {editingMember ? 'Modify Member Profile' : 'Add Team Member'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Email Address *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="name@company.com"
                  className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                />
              </div>
              {!editingMember && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Password *</label>
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="•••••••• (Min 6 chars)"
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                    minLength="6"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Agency Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value="Admin">Admin</option>
                    <option value="Project Manager">Project Manager</option>
                    <option value="Team Member">Team Member</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Department</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value="Development">Development</option>
                    <option value="Design">Design</option>
                    <option value="Marketing">Marketing</option>
                    <option value="QA">QA</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Performance Efficiency (%) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  max="100"
                  value={formData.efficiency}
                  onChange={(e) => setFormData({ ...formData, efficiency: e.target.value })}
                  placeholder="e.g. 90"
                  className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                />
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-855 flex items-center justify-end space-x-3">
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
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Team;
