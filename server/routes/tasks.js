const express = require('express');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  addTaskComment,
} = require('../controllers/taskController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getTasks)
  .post(authorize('Admin', 'Project Manager'), createTask);

router
  .route('/:id')
  .get(getTask)
  .put(updateTask) // Role logic inside controller: Team Member can only update status
  .delete(authorize('Admin', 'Project Manager'), deleteTask);

router.post('/:id/comments', addTaskComment);

module.exports = router;
