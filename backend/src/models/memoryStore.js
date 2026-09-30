import crypto from 'crypto';

class MemoryStore {
  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.visionSessions = new Map();
    this.voiceInteractions = [];
  }

  // User operations
  createUser(userData) {
    const id = crypto.randomUUID();
    const now = new Date();
    const user = {
      _id: id,
      id,
      ...userData,
      stats: userData.stats || {
        documentsAnalyzed: 0,
        questionsAnswered: 0,
        actionsCompleted: 0,
        translationsCount: 0,
        visionScansCompleted: 0,
      },
      accessibilityPreferences: userData.accessibilityPreferences || {
        textSize: 'normal',
        highContrast: 'none',
        readingMode: false,
        reducedMotion: false,
        simplifiedInterface: false,
        voiceMode: false,
        blindMode: false,
      },
      createdAt: now,
      updatedAt: now,
      toJSON() {
        const copy = { ...this };
        delete copy.passwordHash;
        return copy;
      },
    };
    this.users.set(id, user);
    return user;
  }

  findUserByEmail(email) {
    const normalized = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase().trim() === normalized) {
        return user;
      }
    }
    return null;
  }

  findUserById(id) {
    return this.users.get(String(id)) || null;
  }

  updateUser(id, updates) {
    const user = this.findUserById(id);
    if (!user) return null;
    const updated = {
      ...user,
      ...updates,
      updatedAt: new Date(),
    };
    this.users.set(String(id), updated);
    return updated;
  }

  // Session operations
  createSession(sessionData) {
    const id = crypto.randomUUID();
    const now = new Date();
    const session = {
      _id: id,
      id,
      ...sessionData,
      qnaHistory: sessionData.qnaHistory || [],
      translations: sessionData.translations || [],
      createdAt: now,
      updatedAt: now,
    };
    this.sessions.set(id, session);
    return session;
  }

  findSessionById(id) {
    return this.sessions.get(String(id)) || null;
  }

  findSessionsByUserOrGuest(userId, guestId) {
    const results = [];
    for (const session of this.sessions.values()) {
      if (userId && String(session.userId) === String(userId)) {
        results.push(session);
      } else if (!userId && guestId && session.guestId === guestId) {
        results.push(session);
      }
    }
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  updateSession(id, updates) {
    const session = this.findSessionById(id);
    if (!session) return null;
    const updated = {
      ...session,
      ...updates,
      updatedAt: new Date(),
    };
    this.sessions.set(String(id), updated);
    return updated;
  }

  deleteSession(id) {
    return this.sessions.delete(String(id));
  }

  // Vision Session operations
  createVisionSession(visionData) {
    const id = crypto.randomUUID();
    const now = new Date();
    const session = {
      _id: id,
      id,
      ...visionData,
      visibleText: visionData.visibleText || [],
      importantInformation: visionData.importantInformation || [],
      objects: visionData.objects || [],
      possibleActions: visionData.possibleActions || [],
      warnings: visionData.warnings || [],
      qnaHistory: visionData.qnaHistory || [],
      translations: visionData.translations || [],
      createdAt: now,
      updatedAt: now,
    };
    this.visionSessions.set(id, session);
    return session;
  }

  findVisionSessionById(id) {
    return this.visionSessions.get(String(id)) || null;
  }

  findVisionSessionsByUserOrGuest(userId, guestId) {
    const results = [];
    for (const session of this.visionSessions.values()) {
      if (userId && String(session.userId) === String(userId)) {
        results.push(session);
      } else if (!userId && guestId && session.guestId === guestId) {
        results.push(session);
      }
    }
    return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  updateVisionSession(id, updates) {
    const session = this.findVisionSessionById(id);
    if (!session) return null;
    const updated = {
      ...session,
      ...updates,
      updatedAt: new Date(),
    };
    this.visionSessions.set(String(id), updated);
    return updated;
  }

  deleteVisionSession(id) {
    return this.visionSessions.delete(String(id));
  }

  // Voice Interaction operations
  createVoiceInteraction(data) {
    const id = crypto.randomUUID();
    const interaction = {
      _id: id,
      id,
      ...data,
      timestamp: new Date(),
      createdAt: new Date(),
    };
    this.voiceInteractions.push(interaction);
    return interaction;
  }
}

export const memoryStore = new MemoryStore();
