const Project = require('../models/Project');
const Task = require('../models/Task');
const Deliverable = require('../models/Deliverable');
const User = require('../models/User');
const Client = require('../models/Client');

// @desc    Get reports and analytics dashboard metrics
// @route   GET /api/reports
// @access  Private
exports.getReports = async (req, res) => {
  try {
    // 1. Project Completion Rate
    const totalProjects = await Project.countDocuments();
    const completedProjects = await Project.countDocuments({ status: 'Completed' });
    const projectCompletionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

    // 2. Client Satisfaction Index (calculated by Deliverables Approval Rate)
    // Formula: (Approved Deliverables / (Approved + Rejected Deliverables)) * 100
    const approvedDeliverables = await Deliverable.countDocuments({ status: 'Approved' });
    const rejectedDeliverables = await Deliverable.countDocuments({ status: 'Rejected' });
    const totalReviewed = approvedDeliverables + rejectedDeliverables;
    const clientSatisfaction = totalReviewed > 0 ? Math.round((approvedDeliverables / totalReviewed) * 100) : 95; // Default fallback to 95% if empty

    // 3. Task Completion Time
    // We fetch completed tasks and calculate the average time difference between creation date and completion status update.
    const completedTasks = await Task.find({ status: 'Completed' });
    let totalCompletionTimeMs = 0;
    let countedTasks = 0;

    for (const task of completedTasks) {
      const completionLog = task.history.find(log => log.action === 'Status Changed' && log.details.includes('Completed'));
      const completionTime = completionLog ? completionLog.createdAt : task.dueDate || task.createdAt; // fallback if log is missing
      const durationMs = new Date(completionTime) - new Date(task.createdAt);
      if (durationMs > 0) {
        totalCompletionTimeMs += durationMs;
        countedTasks++;
      }
    }

    // Convert milliseconds to average days
    const averageDaysToComplete = countedTasks > 0 
      ? parseFloat((totalCompletionTimeMs / (1000 * 60 * 60 * 24) / countedTasks).toFixed(1)) 
      : 3.5; // Default fallback to 3.5 days

    // 4. Team Productivity Data (Completed vs Total Tasks)
    const teamMembers = await User.find({ role: { $ne: 'Client' } });
    const teamProductivity = await Promise.all(
      teamMembers.map(async (member) => {
        const totalTasks = await Task.countDocuments({ assignee: member._id });
        const completedCount = await Task.countDocuments({ assignee: member._id, status: 'Completed' });
        return {
          name: member.name,
          department: member.department,
          totalTasks,
          completedTasks: completedCount,
          efficiency: member.performance ? member.performance.efficiency : 90,
        };
      })
    );

    // 5. Resource Allocation (Active Tasks per Department)
    const departments = ['Design', 'Development', 'Marketing', 'Management', 'QA', 'General'];
    const resourceAllocation = await Promise.all(
      departments.map(async (dept) => {
        // Count users in this department
        const usersInDept = await User.find({ department: dept }).select('_id');
        const userIds = usersInDept.map(u => u._id);
        // Count pending tasks assigned to these users
        const taskCount = await Task.countDocuments({ 
          assignee: { $in: userIds },
          status: { $ne: 'Completed' }
        });
        return {
          department: dept,
          activeTasksCount: taskCount,
          memberCount: userIds.length,
        };
      })
    );

    // 6. Monthly Progress Metrics (simulated month-over-month task counts for chart purposes)
    const monthlyProgress = [
      { month: 'Jan', completed: 15, active: 10 },
      { month: 'Feb', completed: 22, active: 14 },
      { month: 'Mar', completed: 30, active: 18 },
      { month: 'Apr', completed: 38, active: 20 },
      { month: 'May', completed: 45, active: 25 },
      { month: 'Jun', completed: completedTasks.length || 50, active: (await Task.countDocuments({ status: { $ne: 'Completed' } })) || 15 },
    ];

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalProjects,
          completedProjects,
          projectCompletionRate,
          clientSatisfaction,
          averageDaysToComplete,
          pendingTasksCount: await Task.countDocuments({ status: { $ne: 'Completed' } }),
          activeProjectsCount: await Project.countDocuments({ status: 'Active' }),
        },
        teamProductivity,
        resourceAllocation,
        monthlyProgress,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
