import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut, Bar, Radar } from 'react-chartjs-2';
import { 
  Folder, 
  CheckCircle2, 
  Clock, 
  Users, 
  Activity, 
  Star, 
  AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [reportsRes, activitiesRes] = await Promise.all([
          axios.get('/api/reports'),
          axios.get('/api/activities'),
        ]);

        if (reportsRes.data.success) {
          setData(reportsRes.data.data);
        }
        if (activitiesRes.data.success) {
          setActivities(activitiesRes.data.data.slice(0, 5)); // show latest 5
        }
      } catch (err) {
        console.error('Error loading dashboard datasets:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  const stats = data?.stats || {
    totalProjects: 0,
    completedProjects: 0,
    projectCompletionRate: 0,
    clientSatisfaction: 95,
    averageDaysToComplete: 3,
    pendingTasksCount: 0,
    activeProjectsCount: 0,
  };

  // 1. Monthly Progress Line Chart Configuration
  const lineChartData = {
    labels: data?.monthlyProgress?.map(m => m.month) || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Completed Tasks',
        data: data?.monthlyProgress?.map(m => m.completed) || [10, 15, 22, 28, 35, 42],
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99, 102, 241, 0.08)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Active Tasks',
        data: data?.monthlyProgress?.map(m => m.active) || [8, 12, 10, 15, 14, 18],
        borderColor: '#a78bfa',
        backgroundColor: 'transparent',
        borderDash: [5, 5],
        tension: 0.4,
      }
    ],
  };

  // 2. Task Distribution Doughnut Chart Configuration
  const doughnutChartData = {
    labels: ['Backlog', 'To Do', 'In Progress', 'Review', 'Completed'],
    datasets: [
      {
        data: [5, 12, 18, 7, 20],
        backgroundColor: [
          '#3f3f46', // Backlog - Zinc
          '#f59e0b', // To Do - Amber
          '#3b82f6', // In Progress - Blue
          '#8b5cf6', // Review - Violet
          '#10b981', // Completed - Emerald
        ],
        borderWidth: 0,
      },
    ],
  };

  // 3. Resource Allocation Bar Chart (Active Tasks by Department)
  const barChartData = {
    labels: data?.resourceAllocation?.map(r => r.department) || ['Dev', 'Design', 'Marketing', 'QA', 'Management'],
    datasets: [
      {
        label: 'Active Tasks Count',
        data: data?.resourceAllocation?.map(r => r.activeTasksCount) || [12, 8, 5, 4, 2],
        backgroundColor: '#6366f1',
        borderRadius: 8,
      },
      {
        label: 'Team Members count',
        data: data?.resourceAllocation?.map(r => r.memberCount) || [5, 3, 3, 3, 2],
        backgroundColor: '#e4e4e7',
        borderRadius: 8,
      }
    ],
  };

  // 4. Team Productivity Radar Chart
  const radarChartData = {
    labels: data?.teamProductivity?.slice(0, 6)?.map(t => t.name.split(' ')[0]) || ['James', 'Sophia', 'Robert', 'Scarlett', 'Chris', 'Mark'],
    datasets: [
      {
        label: 'Tasks Assigned',
        data: data?.teamProductivity?.slice(0, 6)?.map(t => t.totalTasks) || [10, 8, 12, 7, 9, 6],
        backgroundColor: 'rgba(99, 102, 241, 0.15)',
        borderColor: '#6366f1',
        borderWidth: 1,
      },
      {
        label: 'Tasks Completed',
        data: data?.teamProductivity?.slice(0, 6)?.map(t => t.completedTasks) || [8, 6, 9, 5, 8, 4],
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: '#10b981',
        borderWidth: 1,
      }
    ],
  };

  return (
    <div className="space-y-6">
      {/* Welcome Message */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-display">
            Welcome back, {user?.name}
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Here is a snapshot of your agency projects and deliverable pipelines today.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-855 px-3 py-1.5 rounded-lg shrink-0">
          <Activity className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
          <span>Realtime Connection Established</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Projects Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-indigo-500/5 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Active Projects</span>
            <Folder className="h-5 w-5 text-indigo-500" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {stats.activeProjectsCount}
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              of {stats.totalProjects} total
            </span>
          </div>
        </div>

        {/* Pending Tasks Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-amber-500/5 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Pending Tasks</span>
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {stats.pendingTasksCount}
            </span>
            <span className="text-xs font-semibold text-amber-500">Action Required</span>
          </div>
        </div>

        {/* Project Completion Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-855 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-emerald-500/5 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Completion Rate</span>
            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {stats.projectCompletionRate}%
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              {stats.completedProjects} delivered
            </span>
          </div>
        </div>

        {/* Client Satisfaction Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-violet-500/5 group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Client Satisfaction</span>
            <Star className="h-5 w-5 text-violet-500 fill-violet-500" />
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <span className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              {stats.clientSatisfaction}%
            </span>
            <span className="text-xs font-semibold text-zinc-400">Approval rating</span>
          </div>
        </div>
      </div>

      {/* Main Charts & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Progress Line Chart */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-5 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider mb-4">Monthly Delivery Progress</h3>
          <div className="h-72">
            <Line
              data={lineChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 10 } } } },
                scales: {
                  y: { grid: { color: 'rgba(200, 200, 200, 0.08)' }, ticks: { font: { size: 9 } } },
                  x: { grid: { display: false }, ticks: { font: { size: 9 } } }
                }
              }}
            />
          </div>
        </div>

        {/* Task status doughnut distribution */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-855 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider mb-4">Task Status Allocations</h3>
          <div className="h-72 flex items-center justify-center">
            <Doughnut
              data={doughnutChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 9 } } } },
                cutout: '65%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Secondary Charts and Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department resource allocation */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider mb-4">Resource Capacity</h3>
          <div className="h-64">
            <Bar
              data={barChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  y: { grid: { color: 'rgba(200, 200, 200, 0.08)' }, ticks: { font: { size: 9 } } },
                  x: { grid: { display: false }, ticks: { font: { size: 9 } } }
                }
              }}
            />
          </div>
        </div>

        {/* Team productivity Radar */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider mb-4">Team Performance Loads</h3>
          <div className="h-64 flex items-center justify-center">
            <Radar
              data={radarChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                  r: {
                    grid: { color: 'rgba(200, 200, 200, 0.08)' },
                    angleLines: { color: 'rgba(200, 200, 200, 0.08)' },
                    ticks: { display: false },
                    pointLabels: { font: { size: 8 } }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          <h3 className="font-bold text-sm text-zinc-400 uppercase tracking-wider mb-4">Recent Workspace Activity</h3>
          <div className="flow-root h-64 overflow-y-auto">
            <ul className="-mb-8">
              {activities.length === 0 && (
                <li className="text-zinc-500 text-xs py-4 text-center">No recent activity logs logged.</li>
              )}
              {activities.map((log, logIdx) => (
                <li key={log._id}>
                  <div className="relative pb-8">
                    {logIdx !== activities.length - 1 ? (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-zinc-200 dark:bg-zinc-800" aria-hidden="true" />
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-zinc-100 dark:bg-zinc-850 flex items-center justify-center ring-8 ring-white dark:ring-zinc-900 text-xs shrink-0">
                          {logIdx % 2 === 0 ? '💻' : '⚡'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 pt-1.5">
                        <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                          {log.action}{' '}
                          <span className="font-normal text-zinc-500 dark:text-zinc-400">
                            by {log.userName}
                          </span>
                        </p>
                        <p className="text-[10px] text-zinc-400 mt-0.5 truncate">{log.details}</p>
                        <span className="text-[9px] text-zinc-500 block mt-1">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
