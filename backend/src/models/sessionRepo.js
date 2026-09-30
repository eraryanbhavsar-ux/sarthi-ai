import { Session } from './Session.js';
import { memoryStore } from './memoryStore.js';
import { getDBStatus } from '../config/db.js';

export const sessionRepo = {
  async create(sessionData) {
    if (getDBStatus().isConnected) {
      const session = new Session(sessionData);
      return await session.save();
    }
    return memoryStore.createSession(sessionData);
  },

  async findById(id) {
    if (getDBStatus().isConnected) {
      try {
        return await Session.findById(id);
      } catch {
        return null;
      }
    }
    return memoryStore.findSessionById(id);
  },

  async findByUserOrGuest(userId, guestId) {
    if (getDBStatus().isConnected) {
      const query = {};
      if (userId) {
        query.userId = userId;
      } else if (guestId) {
        query.guestId = guestId;
      } else {
        return [];
      }
      return await Session.find(query).sort({ createdAt: -1 }).limit(50);
    }
    return memoryStore.findSessionsByUserOrGuest(userId, guestId);
  },

  async update(id, updates) {
    if (getDBStatus().isConnected) {
      try {
        return await Session.findByIdAndUpdate(id, { $set: updates }, { new: true });
      } catch {
        return null;
      }
    }
    return memoryStore.updateSession(id, updates);
  },

  async delete(id) {
    if (getDBStatus().isConnected) {
      try {
        const res = await Session.findByIdAndDelete(id);
        return !!res;
      } catch {
        return false;
      }
    }
    return memoryStore.deleteSession(id);
  },
};
