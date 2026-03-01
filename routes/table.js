import express from 'express';
import {getTables, getTable, createTable, updateTable, deleteTable} from '../controllers/tables.js';

const router = express.Router();

import {protect, authorize} from '../middleware/auth.js';

router.route('/').get(getTables).post(protect, authorize('admin'), createTable);
router.route('/:id').get(getTable).put(protect, authorize('admin'), updateTable).delete(protect, authorize('admin'), deleteTable);

export default router;