const express = require('express');
const {
  getMilestones,
  createMilestone,
  updateMilestone,
  deleteMilestone,
} = require('../controllers/milestoneController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(getMilestones)
  .post(authorize('Admin', 'Project Manager'), createMilestone);

router
  .route('/:id')
  .put(authorize('Admin', 'Project Manager'), updateMilestone)
  .delete(authorize('Admin', 'Project Manager'), deleteMilestone);

module.exports = router;
