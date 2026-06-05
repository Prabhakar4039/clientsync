import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  BarChart3, Download, FileSpreadsheet, FileText, TrendingUp, Users, 
  Clock, CheckCircle, Percent, Star, Sparkles
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { useAuth } from '../context/AuthContext';

const Reports = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/reports');
      if (res.data.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error('Error loading reports details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  const stats = data?.stats || {};
  const teamProductivity = data?.teamProductivity || [];
  const resourceAllocation = data?.resourceAllocation || [];
  const monthlyProgress = data?.monthlyProgress || [];

  // Export CSV Handler
  const handleExportCSV = () => {
    // 1. Prepare data rows
    const rows = [
      ['ClientSync - Agency Delivery Reports & Analytics'],
      ['Generated At', new Date().toLocaleString()],
      [],
      ['Metric Type', 'Value'],
      ['Total Projects Managed', stats.totalProjects],
      ['Completed Projects', stats.completedProjects],
      ['Project Completion Rate', `${stats.projectCompletionRate}%`],
      ['Client Approval Satisfaction', `${stats.clientSatisfaction}%`],
      ['Average Task Resolution Days', stats.averageDaysToComplete],
      ['Unresolved Active Tasks Count', stats.pendingTasksCount],
      [],
      ['Team Productivity Audits'],
      ['Name', 'Department', 'Total Tasks Assigned', 'Completed Tasks', 'Productivity Rate'],
      ...teamProductivity.map(t => [
        t.name,
        t.department,
        t.totalTasks,
        t.completedTasks,
        `${t.totalTasks > 0 ? Math.round((t.completedTasks / t.totalTasks) * 100) : 100}%`
      ])
    ];

    // 2. Convert to CSV string format
    const csvContent = "data:text/csv;charset=utf-8," 
      + rows.map(e => e.map(val => `"${val}"`).join(",")).join("\n");

    // 3. Trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `clientsync_delivery_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export PDF Handler (Using print stylesheet style)
  const handleExportPDF = () => {
    window.print();
  };

  // Chart configs
  const lineChartData = {
    labels: monthlyProgress.map(m => m.month),
    datasets: [
      {
        label: 'Delivered Tasks',
        data: monthlyProgress.map(m => m.completed),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        fill: true,
        tension: 0.35,
      }
    ]
  };

  const barChartData = {
    labels: teamProductivity.slice(0, 8).map(t => t.name),
    datasets: [
      {
        label: 'Tasks Completed',
        data: teamProductivity.slice(0, 8).map(t => t.completedTasks),
        backgroundColor: '#6366f1',
        borderRadius: 6,
      }
    ]
  };

  return (
    <div className="space-y-6 print:p-0 print:space-y-4">
      {/* Header buttons (hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 print:hidden">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-display flex items-center space-x-2">
            <BarChart3 className="h-6 w-6 text-indigo-500" />
            <span>Reports & Analytics</span>
          </h1>
          <p className="text-sm text-zinc-550 mt-1">Audit team efficiency metrics, delivery timelines, and budget burn-rates.</p>
        </div>
        <div className="flex items-center space-x-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-xl text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 transition-colors"
          >
            <FileSpreadsheet className="h-4.5 w-4.5 text-emerald-500" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center space-x-2 px-4.5 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <FileText className="h-4.5 w-4.5 text-indigo-200" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-4.5 shadow-sm text-center">
          <TrendingUp className="h-5 w-5 text-indigo-500 mx-auto mb-2" />
          <span className="block text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Completion Rate</span>
          <span className="text-xl font-black text-zinc-900 dark:text-white mt-1 block">
            {stats.projectCompletionRate}%
          </span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-4.5 shadow-sm text-center">
          <Star className="h-5 w-5 text-violet-500 fill-violet-500 mx-auto mb-2" />
          <span className="block text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Client Satisfaction</span>
          <span className="text-xl font-black text-zinc-900 dark:text-white mt-1 block">
            {stats.clientSatisfaction}%
          </span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-4.5 shadow-sm text-center">
          <Clock className="h-5 w-5 text-amber-500 mx-auto mb-2" />
          <span className="block text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Avg Task Duration</span>
          <span className="text-xl font-black text-zinc-900 dark:text-white mt-1 block">
            {stats.averageDaysToComplete} days
          </span>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-4.5 shadow-sm text-center">
          <Users className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
          <span className="block text-[10px] text-zinc-400 font-semibold uppercase tracking-wider">Active Resource Load</span>
          <span className="text-xl font-black text-zinc-900 dark:text-white mt-1 block">
            {stats.pendingTasksCount} tasks
          </span>
        </div>
      </div>

      {/* Main charts layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-xs text-zinc-450 uppercase tracking-wider mb-4">Cumulative Task Deliveries</h3>
          <div className="h-64">
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { grid: { color: 'rgba(200, 200, 200, 0.08)' } },
                  x: { grid: { display: false } }
                }
              }}
            />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-5 shadow-sm">
          <h3 className="font-bold text-xs text-zinc-450 uppercase tracking-wider mb-4">Team Task Achievements</h3>
          <div className="h-64">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { grid: { color: 'rgba(200, 200, 200, 0.08)' } },
                  x: { grid: { display: false } }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Team Productivity Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-zinc-150 dark:border-zinc-850">
          <h3 className="font-bold text-xs text-zinc-450 uppercase tracking-wider">Productivity Audit Ledger</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-950/40 text-zinc-550 border-b border-zinc-200 dark:border-zinc-850">
              <tr>
                <th className="p-4 font-semibold">Team Member</th>
                <th className="p-4 font-semibold">Department</th>
                <th className="p-4 font-semibold text-center">Assigned Tasks</th>
                <th className="p-4 font-semibold text-center">Completed Tasks</th>
                <th className="p-4 font-semibold text-center">Efficiency Rating</th>
                <th className="p-4 font-semibold text-center">Performance Indicator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-350">
              {teamProductivity.map((member, index) => {
                const rate = member.totalTasks > 0 
                  ? Math.round((member.completedTasks / member.totalTasks) * 100) 
                  : 100;
                return (
                  <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/20">
                    <td className="p-4 font-medium text-zinc-900 dark:text-white">{member.name}</td>
                    <td className="p-4">{member.department}</td>
                    <td className="p-4 text-center">{member.totalTasks}</td>
                    <td className="p-4 text-center text-emerald-500">{member.completedTasks}</td>
                    <td className="p-4 text-center font-semibold text-indigo-500">{member.efficiency}%</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        rate >= 80 ? 'bg-emerald-500/10 text-emerald-500' :
                        rate >= 50 ? 'bg-amber-500/10 text-amber-500' :
                        'bg-red-500/10 text-red-500'
                      }`}>
                        {rate >= 80 ? 'High Output' : rate >= 50 ? 'Balanced' : 'Overloaded'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
