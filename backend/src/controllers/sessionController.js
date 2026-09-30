import { sessionRepo } from '../models/sessionRepo.js';
import { userRepo } from '../models/userRepo.js';

export async function getSessions(req, res, next) {
  try {
    const userId = req.user ? (req.user._id || req.user.id) : null;
    const { guestId } = req.query;

    const sessions = await sessionRepo.findByUserOrGuest(userId, guestId);

    // Provide summary projection
    const sanitized = sessions.map(s => ({
      id: s._id || s.id,
      title: s.title,
      contentType: s.contentType,
      summary: s.summary,
      difficultyLevel: s.difficultyLevel,
      actionCount: s.requiredActions?.length || 0,
      completedActionCount: s.requiredActions?.filter(a => a.completed).length || 0,
      createdAt: s.createdAt,
      activeLanguage: s.activeLanguage || 'en',
    }));

    res.status(200).json({
      success: true,
      sessions: sanitized,
    });
  } catch (error) {
    next(error);
  }
}

function isAuthorizedForSession(session, req) {
  if (!session) return false;
  const requestingUserId = req.user ? (req.user._id || req.user.id)?.toString() : null;
  const requestingGuestId = req.query.guestId || req.headers['x-guest-id'] || req.body?.guestId;

  if (session.userId) {
    return requestingUserId && session.userId.toString() === requestingUserId;
  }
  if (session.guestId && requestingGuestId) {
    return session.guestId === requestingGuestId;
  }
  return true;
}

export async function getSessionById(req, res, next) {
  try {
    const { id } = req.params;
    const session = await sessionRepo.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Accessibility session not found.',
      });
    }

    if (!isAuthorizedForSession(session, req)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to view this session.',
      });
    }

    res.status(200).json({
      success: true,
      session,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateChecklist(req, res, next) {
  try {
    const { id } = req.params;
    const { actionId, completed } = req.body;
    const userId = req.user ? (req.user._id || req.user.id) : null;

    const session = await sessionRepo.findById(id);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Accessibility session not found.',
      });
    }

    if (!isAuthorizedForSession(session, req)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to modify this session.',
      });
    }

    const actions = session.requiredActions || [];
    let updatedAction = null;

    const updatedActions = actions.map(act => {
      if (act.id === actionId) {
        updatedAction = { ...act, completed };
        return updatedAction;
      }
      return act;
    });

    await sessionRepo.update(id, { requiredActions: updatedActions });

    if (userId && completed) {
      await userRepo.incrementStat(userId, 'actionsCompleted', 1);
    }

    res.status(200).json({
      success: true,
      message: 'Checklist updated successfully.',
      action: updatedAction,
      requiredActions: updatedActions,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteSession(req, res, next) {
  try {
    const { id } = req.params;
    const session = await sessionRepo.findById(id);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or already deleted.',
      });
    }

    if (!isAuthorizedForSession(session, req)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied: You do not have permission to delete this session.',
      });
    }

    const success = await sessionRepo.delete(id);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Session not found or already deleted.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Accessibility session deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
}

export async function getUserStats(req, res, next) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(200).json({
        success: true,
        stats: {
          documentsAnalyzed: 0,
          questionsAnswered: 0,
          actionsCompleted: 0,
          translationsCount: 0,
        },
      });
    }

    res.status(200).json({
      success: true,
      stats: user.stats || {
        documentsAnalyzed: 0,
        questionsAnswered: 0,
        actionsCompleted: 0,
        translationsCount: 0,
      },
    });
  } catch (error) {
    next(error);
  }
}
