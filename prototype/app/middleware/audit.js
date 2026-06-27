'use strict';

const auditLog = require('../services/auditLog');

/**
 * Attaches req.audit(action, { targetPatientId, detail, breakGlass }) so routes
 * can emit audit events with the current user/session context filled in.
 */
function auditMiddleware(req, res, next) {
  req.audit = (action, opts = {}) => {
    auditLog.record({
      userId: req.session.userId,
      userRole: req.session.role,
      sessionId: req.sessionID,
      action,
      targetPatientId: opts.targetPatientId,
      detail: opts.detail,
      ip: req.ip,
      breakGlass: opts.breakGlass,
    });
  };
  next();
}

module.exports = { auditMiddleware };
