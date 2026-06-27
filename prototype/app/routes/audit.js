'use strict';

const express = require('express');
const router = express.Router();

const { requireAuth, requireRole } = require('../middleware/auth');
const auditLog = require('../services/auditLog');

// Governance report — clinicians only in this prototype.
router.use(requireAuth, requireRole('clinician'));

router.get('/', (req, res) => {
  res.render('audit/report', {
    title: 'Audit & accountability',
    events: auditLog.recent(200),
    sessions: auditLog.recentSessions(100),
  });
});

module.exports = router;
