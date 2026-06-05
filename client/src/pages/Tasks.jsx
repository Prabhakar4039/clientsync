import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import { 
  Plus, Search, Filter, Calendar, MessageSquare, Tag, 
  Trash2, X, PlusCircle, User, Clock, CheckCircle2, ShieldAlert
} from 'lucide-react';

const Tasks = () => {
  const socket = useSocket();
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [search, setSearch] = useState('');
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Selected task detail slideover
  const [selectedTask, setSelectedTask] = useState(null);
  const [detailTaskData, setDetailTaskData] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);

  // Task form modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    project: '',
    assignee: '',
    priority: 'Medium',
    dueDate: '',
    status: 'To Do',
    tags: '',
  });

  const columns = ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'];
  const isPMOrAdmin = user?.role === 'Admin' || user?.role === 'Project Manager';

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedProjectId) params.project = selectedProjectId;
      if (assigneeFilter) params.assignee = assigneeFilter;
      if (search) params.search = search;

      const res = await axios.get('/api/tasks', { params });
      if (res.data.success) {
        setTasks(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjectsAndTeam = async () => {
    try {
      const [projRes, teamRes] = await Promise.all([
        axios.get('/api/projects'),
        axios.get('/api/team'),
      ]);
      if (projRes.data.success) {
        setProjects(projRes.data.data);
        if (projRes.data.data.length > 0 && !selectedProjectId) {
          setSelectedProjectId(projRes.data.data[0]._id);
        }
      }
      if (teamRes.data.success) {
        setTeamMembers(teamRes.data.data);
      }
    } catch (err) {
      console.error('Error loading tasks selectors:', err.message);
    }
  };

  useEffect(() => {
    fetchProjectsAndTeam();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      fetchTasks();
    }
  }, [selectedProjectId, assigneeFilter, search]);

  // Realtime Socket listener for Kanban board syncing
  useEffect(() => {
    if (!socket || !selectedProjectId) return;

    socket.emit('join_project', selectedProjectId);

    socket.on('task_moved_update', ({ taskId, fromStatus, toStatus, taskTitle }) => {
      console.log(`Realtime Kanban Sync: task ${taskTitle} moved to ${toStatus}`);
      setTasks((prevTasks) =>
        prevTasks.map((t) => (t._id === taskId ? { ...t, status: toStatus } : t))
      );
      if (selectedTask && selectedTask._id === taskId) {
        handleOpenDetails(selectedTask);
      }
    });

    return () => {
      socket.off('task_moved_update');
    };
  }, [socket, selectedProjectId, selectedTask]);

  // HTML5 Drag and Drop handlers
  const handleDragStart = (e, taskId, status) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.setData('fromStatus', status);
  };

  const handleDrop = async (e, toStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    const fromStatus = e.dataTransfer.getData('fromStatus');

    if (fromStatus === toStatus) return;

    // Optimistically update status locally
    setTasks((prev) =>
      prev.map((t) => (t._id === taskId ? { ...t, status: toStatus } : t))
    );

    try {
      const res = await axios.put(`/api/tasks/${taskId}`, { status: toStatus });
      if (res.data.success) {
        const updatedTask = res.data.data;
        // Emit Socket event to sync other users
        if (socket) {
          socket.emit('task_moved', {
            projectId: selectedProjectId,
            taskId,
            fromStatus,
            toStatus,
            taskTitle: updatedTask.title,
          });
        }
      }
    } catch (err) {
      console.error('Failed to update task status:', err.message);
      // Revert change
      fetchTasks();
    }
  };

  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setFormData({
      title: '',
      description: '',
      project: selectedProjectId,
      assignee: '',
      priority: 'Medium',
      dueDate: '',
      status: 'To Do',
      tags: '',
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description || '',
      project: task.project?._id || selectedProjectId,
      assignee: task.assignee?._id || '',
      priority: task.priority || 'Medium',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      status: task.status || 'To Do',
      tags: task.tags ? task.tags.join(', ') : '',
    });
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const formattedTags = formData.tags
      ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

    const payload = {
      ...formData,
      tags: formattedTags,
    };

    try {
      if (editingTask) {
        const res = await axios.put(`/api/tasks/${editingTask._id}`, payload);
        if (res.data.success) {
          setSuccess('Task updated successfully!');
          setTimeout(() => setModalOpen(false), 1000);
          fetchTasks();
          if (selectedTask?._id === editingTask._id) {
            handleOpenDetails(editingTask);
          }
        }
      } else {
        const res = await axios.post('/api/tasks', payload);
        if (res.data.success) {
          setSuccess('Task created successfully!');
          setTimeout(() => setModalOpen(false), 1000);
          fetchTasks();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task.');
    }
  };

  const handleOpenDetails = async (task) => {
    setSelectedTask(task);
    setDetailLoading(true);
    try {
      const res = await axios.get(`/api/tasks/${task._id}`);
      if (res.data.success) {
        setDetailTaskData(res.data.data);
      }
    } catch (err) {
      console.error('Error loading task details:', err.message);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      const res = await axios.post(`/api/tasks/${selectedTask._id}/comments`, {
        text: commentText,
      });
      if (res.data.success) {
        setDetailTaskData((prev) => ({
          ...prev,
          comments: res.data.data,
        }));
        setCommentText('');
        // Re-fetch tasks to update comment counts
        fetchTasks();
      }
    } catch (err) {
      console.error('Failed to post comment:', err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await axios.delete(`/api/tasks/${taskId}`);
      if (res.data.success) {
        setSelectedTask(null);
        fetchTasks();
      }
    } catch (err) {
      console.error('Failed to delete task:', err.message);
    }
  };

  return (
    <div className="space-y-5 h-full relative">
      {/* Header controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3.5">
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-lg font-bold bg-transparent border-0 font-display text-zinc-900 dark:text-white focus:outline-none focus:ring-0 cursor-pointer pr-8"
          >
            {projects.map((p) => (
              <option key={p._id} value={p._id} className="bg-white dark:bg-zinc-950 font-sans text-sm">
                📁 {p.name}
              </option>
            ))}
          </select>
        </div>

        {isPMOrAdmin && (
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 px-4.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/15 hover:bg-indigo-500 transition-colors shrink-0"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Create Task</span>
          </button>
        )}
      </div>

      {/* Search & Assignee Filters bar */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-4 rounded-2xl">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search tasks by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-10 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="relative shrink-0">
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none pr-8 cursor-pointer"
          >
            <option value="">Filter by Assignee</option>
            {teamMembers.map((member) => (
              <option key={member._id} value={member._id}>
                {member.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Kanban Board Grid */}
      {loading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {columns.map((colStatus) => {
            const columnTasks = tasks.filter((t) => t.status === colStatus);
            return (
              <div
                key={colStatus}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => handleDrop(e, colStatus)}
                className="bg-zinc-100/50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-850/70 p-3 rounded-2xl flex flex-col kanban-column shrink-0 w-72 md:w-auto"
              >
                {/* Column Title and Badges */}
                <div className="flex items-center justify-between mb-3.5 px-1">
                  <span className="text-xs font-bold text-zinc-800 dark:text-zinc-350">{colStatus}</span>
                  <span className="rounded-full bg-zinc-200/80 dark:bg-zinc-800 px-2 py-0.5 text-[10px] font-bold text-zinc-650 dark:text-zinc-400">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Tasks List */}
                <div className="flex-1 space-y-3 overflow-y-auto">
                  {columnTasks.map((task) => (
                    <div
                      key={task._id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task._id, task.status)}
                      onClick={() => handleOpenDetails(task)}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 hover:border-zinc-300 dark:hover:border-zinc-750 p-4 rounded-xl shadow-sm cursor-grab active:cursor-grabbing hover:shadow transition-all space-y-3"
                    >
                      {/* Title */}
                      <h4 className="text-xs font-bold text-zinc-850 dark:text-white line-clamp-2 leading-relaxed">
                        {task.title}
                      </h4>

                      {/* Tag list */}
                      {task.tags && task.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-[8px] font-semibold bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Details row */}
                      <div className="flex items-center justify-between pt-1 text-[10px] text-zinc-500">
                        {/* Assignee Avatar */}
                        <div className="flex items-center space-x-1.5 min-w-0">
                          <img
                            src={task.assignee?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${task.assignee?.name}`}
                            alt={task.assignee?.name || 'Unassigned'}
                            className="h-5 w-5 rounded-full object-cover bg-zinc-800"
                            title={task.assignee?.name || 'Unassigned'}
                          />
                          <span className="truncate max-w-[70px]">{task.assignee?.name.split(' ')[0] || 'Unassigned'}</span>
                        </div>

                        {/* Due date or comment count */}
                        <div className="flex items-center space-x-2 shrink-0">
                          {task.comments?.length > 0 && (
                            <span className="flex items-center space-x-0.5" title="Comments">
                              <MessageSquare className="h-3 w-3" />
                              <span>{task.comments.length}</span>
                            </span>
                          )}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                              task.priority === 'High' ? 'bg-red-500/10 text-red-500' :
                              task.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                              'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task details side-over panel (Slide-in from right) */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 flex justify-end bg-zinc-950/40 backdrop-blur-xs">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-200">
            {/* Top Close Row */}
            <div className="flex h-16 items-center justify-between px-6 border-b border-zinc-150 dark:border-zinc-800">
              <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest">
                Task Details Info
              </span>
              <div className="flex items-center space-x-2">
                {isPMOrAdmin && (
                  <button
                    onClick={() => handleOpenEditModal(selectedTask)}
                    className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-semibold mr-2"
                  >
                    Edit Task
                  </button>
                )}
                <button
                  onClick={() => setSelectedTask(null)}
                  className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Content Feed */}
            {detailLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
              </div>
            ) : detailTaskData ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white font-display leading-snug">
                    {detailTaskData.title}
                  </h2>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span className="text-[10px] font-bold uppercase bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-500">
                      {detailTaskData.status}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                      detailTaskData.priority === 'High' ? 'bg-red-500/10 text-red-500' :
                      detailTaskData.priority === 'Medium' ? 'bg-amber-500/10 text-amber-500' :
                      'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                    }`}>
                      {detailTaskData.priority} Priority
                    </span>
                    {detailTaskData.tags?.map((t) => (
                      <span key={t} className="text-[10px] font-medium bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded">
                        #{t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Description</h4>
                  <p className="text-xs text-zinc-700 dark:text-zinc-350 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-3.5 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                    {detailTaskData.description || 'No description provided.'}
                  </p>
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl text-xs">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-zinc-450 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-zinc-400 font-semibold uppercase">Assignee</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {detailTaskData.assignee?.name || 'Unassigned'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-zinc-450 shrink-0" />
                    <div>
                      <span className="block text-[10px] text-zinc-400 font-semibold uppercase">Due Date</span>
                      <span className="font-semibold text-zinc-850 dark:text-zinc-200">
                        {detailTaskData.dueDate ? new Date(detailTaskData.dueDate).toLocaleDateString() : 'No Deadline'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tab layout: Comments & History */}
                <div>
                  <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3.5 flex items-center space-x-1">
                    <MessageSquare className="h-4 w-4 text-indigo-500" />
                    <span>Activity Feed & Comments ({detailTaskData.comments?.length || 0})</span>
                  </h3>

                  {/* Comment input Form */}
                  <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
                    <input
                      type="text"
                      placeholder="Add a task comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      className="flex-1 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3.5 py-2 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!commentText.trim()}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 rounded-xl disabled:opacity-40"
                    >
                      Post
                    </button>
                  </form>

                  {/* Comments feed */}
                  <div className="space-y-3 max-h-56 overflow-y-auto">
                    {detailTaskData.comments?.length === 0 && (
                      <p className="text-xs text-zinc-500 italic py-2">No comments posted yet.</p>
                    )}
                    {detailTaskData.comments?.map((comment) => (
                      <div key={comment._id} className="p-3 bg-zinc-55 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850/60 rounded-xl space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-zinc-450">
                          <span className="font-semibold text-zinc-700 dark:text-zinc-300">{comment.user?.name}</span>
                          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-zinc-800 dark:text-zinc-300">{comment.text}</p>
                      </div>
                    ))}
                  </div>

                  {/* History audit log */}
                  <div className="mt-6">
                    <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">History logs:</h4>
                    <div className="text-[10px] text-zinc-500 space-y-1.5 max-h-36 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-150 dark:border-zinc-850">
                      {detailTaskData.history?.map((h, index) => (
                        <div key={index} className="flex justify-between">
                          <span>{h.action} - {h.details}</span>
                          <span className="text-[9px] text-zinc-400">{new Date(h.createdAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Delete button (PM/Admin only) */}
                {isPMOrAdmin && (
                  <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                    <button
                      onClick={() => handleDeleteTask(detailTaskData._id)}
                      className="flex items-center space-x-1.5 py-2 px-3 border border-red-500/20 hover:bg-red-500/10 text-red-500 rounded-xl text-xs font-semibold"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                      <span>Delete Task</span>
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Task Creation/Editing Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 px-6 py-4 bg-zinc-50 dark:bg-zinc-950/50">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white font-display">
                {editingTask ? 'Edit Task Info' : 'Create New Task'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {error && (
                <div className="bg-red-950/50 border border-red-800 text-red-200 text-xs rounded-xl p-3 flex items-center space-x-2">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-250 text-xs rounded-xl p-3">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Task Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Code auth integration"
                  className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Define task deliverables, prerequisites, or implementation directions..."
                  rows="3"
                  className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 rounded-xl text-zinc-900 dark:text-white focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Assign Team Member</label>
                  <select
                    value={formData.assignee}
                    onChange={(e) => setFormData({ ...formData, assignee: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value="">-- Unassigned --</option>
                    {teamMembers.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="w-full text-xs px-3.5 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Priority</label>
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
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                  >
                    {columns.map((col) => (
                      <option key={col} value={col}>{col}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Tags (Comma Sep)</label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                    placeholder="e.g. Design, Frontend"
                    className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Action buttons */}
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
                  {editingTask ? 'Save Updates' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
