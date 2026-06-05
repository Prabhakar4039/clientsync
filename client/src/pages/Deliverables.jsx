import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  FileUp, Search, Calendar, User, FileText, CheckCircle2, 
  XCircle, Clock, ExternalLink, MessageSquare, X, PlusCircle, ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Deliverables = () => {
  const { user } = useAuth();
  
  const [deliverables, setDeliverables] = useState([]);
  const [projects, setProjects] = useState([]);
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Detail panel / feedback slideover
  const [selectedDeliv, setSelectedDeliv] = useState(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [reviewStatus, setReviewStatus] = useState(''); // 'Approved' | 'Rejected'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Upload modal states
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    title: '',
    description: '',
    project: '',
    fileType: 'Design',
    externalUrl: '',
  });
  const [fileToUpload, setFileToUpload] = useState(null);

  const isClient = user?.role === 'Client';

  const fetchDeliverables = async () => {
    try {
      setLoading(true);
      const params = {};
      if (projectFilter) params.project = projectFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await axios.get('/api/deliverables', { params });
      if (res.data.success) {
        setDeliverables(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching deliverables:', err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await axios.get('/api/projects');
      if (res.data.success) {
        setProjects(res.data.data);
        if (res.data.data.length > 0) {
          setUploadData(prev => ({ ...prev, project: res.data.data[0]._id }));
        }
      }
    } catch (err) {
      console.error('Error fetching project filter list:', err.message);
    }
  };

  useEffect(() => {
    fetchDeliverables();
    fetchProjects();
  }, [projectFilter, statusFilter]);

  const handleOpenUploadModal = () => {
    setUploadData({
      title: '',
      description: '',
      project: projects.length > 0 ? projects[0]._id : '',
      fileType: 'Design',
      externalUrl: '',
    });
    setFileToUpload(null);
    setError('');
    setSuccess('');
    setUploadModalOpen(true);
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!uploadData.project) {
      return setError('Please select a project');
    }

    if (!fileToUpload && !uploadData.externalUrl) {
      return setError('Please upload a file or provide a Figma/External URL link');
    }

    try {
      const config = {
        headers: { 'Content-Type': 'multipart/form-data' },
      };

      const formData = new FormData();
      formData.append('title', uploadData.title);
      formData.append('description', uploadData.description);
      formData.append('project', uploadData.project);
      formData.append('fileType', uploadData.fileType);

      if (fileToUpload) {
        formData.append('file', fileToUpload);
      } else {
        formData.append('externalUrl', uploadData.externalUrl);
      }

      const res = await axios.post('/api/deliverables', formData, config);
      if (res.data.success) {
        setSuccess('Deliverable submitted successfully for client review!');
        setTimeout(() => setUploadModalOpen(false), 1000);
        fetchDeliverables();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit deliverable.');
    }
  };

  const handleReviewAction = async (status) => {
    setError('');
    setSuccess('');

    try {
      const res = await axios.put(`/api/deliverables/${selectedDeliv._id}/status`, {
        status,
        feedbackText,
      });

      if (res.data.success) {
        setSuccess(`Deliverable marked as ${status}!`);
        setSelectedDeliv(res.data.data);
        setFeedbackText('');
        fetchDeliverables();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review.');
    }
  };

  const handleAddFeedbackComment = async (e) => {
    e.preventDefault();
    if (!feedbackText.trim()) return;

    try {
      const res = await axios.post(`/api/deliverables/${selectedDeliv._id}/feedback`, {
        text: feedbackText,
      });
      if (res.data.success) {
        setSelectedDeliv(prev => ({
          ...prev,
          feedback: res.data.data,
        }));
        setFeedbackText('');
        fetchDeliverables();
      }
    } catch (err) {
      console.error('Failed to post feedback comment:', err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-display">Deliverables & Approvals</h1>
          <p className="text-sm text-zinc-500 mt-1">Submit visual mockups, PDFs, and reports, and manage client approvals.</p>
        </div>
        {!isClient && (
          <button
            onClick={handleOpenUploadModal}
            className="flex items-center justify-center space-x-2 rounded-xl bg-indigo-600 px-4.5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/15 hover:bg-indigo-500 transition-colors"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            <span>Submit Deliverable</span>
          </button>
        )}
      </div>

      {/* Grid structure: Left side = deliverables cards, Right side = details/review panel */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        {/* Deliverables index (2/3 width) */}
        <div className="xl:col-span-2 space-y-5">
          {/* Filters bar */}
          <div className="flex flex-col sm:flex-row gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-4 rounded-2xl">
            <div className="flex-1 relative">
              <select
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
                className="w-full text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-3 py-2.5 text-zinc-700 dark:text-zinc-350 focus:outline-none appearance-none pr-8 cursor-pointer"
              >
                <option value="">Filter by Project</option>
                {projects.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 rounded-xl px-3 py-2.5 text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer appearance-none pr-6"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending Review</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>
          </div>

          {/* Cards feed */}
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
            </div>
          ) : deliverables.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl">
              <FileText className="mx-auto h-12 w-12 text-zinc-400" />
              <p className="text-sm font-semibold mt-4 text-zinc-900 dark:text-white">No deliverables found</p>
              <p className="text-xs text-zinc-500 mt-1">Files submitted for client review will list here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {deliverables.map((deliv) => {
                const isSelected = selectedDeliv?._id === deliv._id;
                return (
                  <div
                    key={deliv._id}
                    onClick={() => { setSelectedDeliv(deliv); setError(''); setSuccess(''); }}
                    className={`bg-white dark:bg-zinc-900 border rounded-2xl p-5 shadow-sm cursor-pointer hover:shadow hover:border-zinc-300 dark:hover:border-zinc-750 transition-all space-y-4 ${
                      isSelected ? 'border-indigo-500 ring-1 ring-indigo-500' : 'border-zinc-200 dark:border-zinc-850'
                    }`}
                  >
                    {/* Status & file icon */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded uppercase">
                        {deliv.fileType}
                      </span>
                      <span className={`inline-flex items-center space-x-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        deliv.status === 'Approved' ? 'bg-emerald-500/10 text-emerald-500' :
                        deliv.status === 'Rejected' ? 'bg-red-500/10 text-red-500' :
                        'bg-amber-500/10 text-amber-500' // Pending
                      }`}>
                        {deliv.status === 'Approved' && <CheckCircle2 className="h-3 w-3" />}
                        {deliv.status === 'Rejected' && <XCircle className="h-3 w-3" />}
                        {deliv.status === 'Pending' && <Clock className="h-3 w-3" />}
                        <span>{deliv.status === 'Pending' ? 'Pending Review' : deliv.status}</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white font-display line-clamp-1">
                        {deliv.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                        {deliv.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-between text-[10px] text-zinc-500">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <img
                          src={deliv.submittedBy?.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${deliv.submittedBy?.name}`}
                          alt={deliv.submittedBy?.name}
                          className="h-5 w-5 rounded-full bg-zinc-800 object-cover"
                        />
                        <span className="truncate">{deliv.submittedBy?.name}</span>
                      </div>
                      <span className="shrink-0">{new Date(deliv.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Deliverable detail panel (1/3 width) */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-5 shadow-sm min-h-[300px]">
          {selectedDeliv ? (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{selectedDeliv.project?.name}</span>
                  <h3 className="text-base font-extrabold text-zinc-900 dark:text-white font-display mt-0.5 leading-snug">
                    {selectedDeliv.title}
                  </h3>
                </div>
                <button onClick={() => setSelectedDeliv(null)} className="rounded-lg p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-550">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Status Alert Banners */}
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

              <div>
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Description</h4>
                <p className="text-xs text-zinc-700 dark:text-zinc-350 bg-zinc-50 dark:bg-zinc-950 p-3.5 border border-zinc-150 dark:border-zinc-850 rounded-xl leading-relaxed">
                  {selectedDeliv.description || 'No description provided.'}
                </p>
              </div>

              {/* Access file button */}
              <div className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-xl p-3.5 flex items-center justify-between">
                <div className="min-w-0 flex-1 pr-3">
                  <span className="block text-[10px] text-zinc-400 font-semibold uppercase">Attachment Details</span>
                  <span className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate mt-0.5">
                    {selectedDeliv.fileName}
                  </span>
                </div>
                <a
                  href={selectedDeliv.fileUrl.startsWith('http') ? selectedDeliv.fileUrl : `${window.location.origin}${selectedDeliv.fileUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 rounded-xl transition-colors shrink-0"
                >
                  <span>Open URL</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>

              {/* Client review actions (Only visible for client role if Pending, or PM/Admin if needed) */}
              {isClient && selectedDeliv.status === 'Pending' && (
                <div className="space-y-4 bg-zinc-50 dark:bg-zinc-950 border border-indigo-500/10 p-4 rounded-xl">
                  <h4 className="text-xs font-semibold text-zinc-500 uppercase">Review Submission</h4>
                  
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Review Comments / Feedback:
                    </label>
                    <textarea
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      placeholder="Add design recommendations, request changes, or approve..."
                      rows="2.5"
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleReviewAction('Approved')}
                      className="flex-1 bg-emerald-650 hover:bg-emerald-500 text-white py-2 px-3.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReviewAction('Rejected')}
                      className="flex-1 bg-red-650 hover:bg-red-500 text-white py-2 px-3.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center space-x-1"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Feedback feed */}
              <div className="space-y-3.5">
                <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <MessageSquare className="h-4 w-4 text-indigo-500" />
                  <span>Review Comments & Feedbacks ({selectedDeliv.feedback?.length || 0})</span>
                </h4>

                {/* If deliverable status not pending and user is client, or if user is agency staff, let them add comments */}
                {(!isClient || selectedDeliv.status !== 'Pending') && (
                  <form onSubmit={handleAddFeedbackComment} className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add comment feedback..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      className="flex-1 text-xs bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-850 rounded-xl px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-500 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!feedbackText.trim()}
                      className="bg-indigo-650 hover:bg-indigo-500 text-white text-xs font-semibold px-4 rounded-xl disabled:opacity-40"
                    >
                      Post
                    </button>
                  </form>
                )}

                <div className="space-y-3 max-h-52 overflow-y-auto">
                  {selectedDeliv.feedback?.length === 0 && (
                    <p className="text-xs text-zinc-500 italic py-2">No review feedback comments left.</p>
                  )}
                  {selectedDeliv.feedback?.map((comment) => (
                    <div key={comment._id} className="p-3 bg-zinc-55 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850/60 rounded-xl space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-zinc-450">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{comment.user?.name}</span>
                        <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-zinc-800 dark:text-zinc-300">{comment.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-zinc-500">
              <FileText className="mx-auto h-10 w-10 text-zinc-300 mb-4" />
              <p className="text-xs font-medium">Select a deliverable record to review files, see approvals, or post comments.</p>
            </div>
          )}
        </div>
      </div>

      {/* Submit deliverable Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-150 dark:border-zinc-800 px-6 py-4 bg-zinc-50 dark:bg-zinc-950/50">
              <h3 className="font-bold text-base text-zinc-900 dark:text-white font-display">
                Submit Project Deliverable
              </h3>
              <button onClick={() => setUploadModalOpen(false)} className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-950/50 border border-red-800 text-red-200 text-xs rounded-xl p-3 flex items-center space-x-2">
                  <ShieldAlert className="h-4.5 w-4.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-emerald-950/50 border border-emerald-800 text-emerald-250 text-xs rounded-xl p-3">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Deliverable Title *</label>
                <input
                  type="text"
                  required
                  value={uploadData.title}
                  onChange={(e) => setUploadData({ ...uploadData, title: e.target.value })}
                  placeholder="e.g. Stark Grid Dashboard Figma v1"
                  className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Description</label>
                <textarea
                  value={uploadData.description}
                  onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                  placeholder="Provide context regarding changes, design choices, or feedback instructions..."
                  rows="2.5"
                  className="w-full text-xs px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 rounded-xl text-zinc-900 dark:text-white focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Linked Project *</label>
                  <select
                    value={uploadData.project}
                    onChange={(e) => setUploadData({ ...uploadData, project: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                  >
                    {projects.map((proj) => (
                      <option key={proj._id} value={proj._id}>{proj.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Deliverable Type</label>
                  <select
                    value={uploadData.fileType}
                    onChange={(e) => setUploadData({ ...uploadData, fileType: e.target.value })}
                    className="w-full text-xs px-3 py-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-855 rounded-xl text-zinc-900 dark:text-white focus:outline-none"
                  >
                    <option value="Design">Design Mockup</option>
                    <option value="PDF">PDF Document</option>
                    <option value="Report">Report Document</option>
                    <option value="Other">Other Asset</option>
                  </select>
                </div>
              </div>

              {/* Toggle upload vs external link */}
              <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl p-3.5 bg-zinc-50 dark:bg-zinc-950/40">
                <span className="block text-xs font-semibold text-zinc-550 mb-2">Upload Asset Option:</span>
                
                <div className="space-y-3">
                  {/* File Upload Input */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Upload Local Document / File:
                    </label>
                    <input
                      type="file"
                      onChange={(e) => {
                        setFileToUpload(e.target.files[0]);
                        setUploadData({ ...uploadData, externalUrl: '' }); // clear link if uploading file
                      }}
                      className="w-full text-xs text-zinc-500 file:mr-4 file:py-1.5 file:px-3.5 file:rounded-xl file:border-0 file:text-[11px] file:font-semibold file:bg-zinc-200 dark:file:bg-zinc-800 file:text-zinc-700 dark:file:text-zinc-300 hover:file:opacity-90"
                    />
                  </div>

                  <div className="flex items-center justify-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest py-1">-- OR --</div>

                  {/* External Link Input */}
                  <div>
                    <label className="block text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                      Provide Figma/External Asset Link:
                    </label>
                    <input
                      type="url"
                      value={uploadData.externalUrl}
                      onChange={(e) => {
                        setUploadData({ ...uploadData, externalUrl: e.target.value });
                        setFileToUpload(null); // clear file if typing link
                      }}
                      placeholder="https://figma.com/file/... or https://google.drive/..."
                      className="w-full text-xs px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-550 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setUploadModalOpen(false)}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 px-4 py-2.5 text-xs font-semibold text-zinc-500 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/10"
                >
                  Submit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Deliverables;
