import { VisionSession } from './VisionSession.js';
import { VoiceInteraction } from './VoiceInteraction.js';
import { memoryStore } from './memoryStore.js';
import { getDBStatus } from '../config/db.js';

export const visionSessionRepo = {
  async create(visionData) {
    if (getDBStatus().isConnected) {
      const session = new VisionSession(visionData);
      return await session.save();
    }
    return memoryStore.createVisionSession(visionData);
  },

  async findById(id) {
    if (getDBStatus().isConnected) {
      try {
        return await VisionSession.findById(id);
      } catch {
        return null;
      }
    }
    return memoryStore.findVisionSessionById(id);
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
      return await VisionSession.find(query).sort({ createdAt: -1 }).limit(50);
    }
    return memoryStore.findVisionSessionsByUserOrGuest(userId, guestId);
  },

  async update(id, updates) {
    if (getDBStatus().isConnected) {
      try {
        return await VisionSession.findByIdAndUpdate(id, { $set: updates }, { new: true });
      } catch {
        return null;
      }
    }
    return memoryStore.updateVisionSession(id, updates);
  },

  async delete(id) {
    if (getDBStatus().isConnected) {
      try {
        const res = await VisionSession.findByIdAndDelete(id);
        return !!res;
      } catch {
        return false;
      }
    }
    return memoryStore.deleteVisionSession(id);
  },

  async recordVoiceInteraction(interactionData) {
    if (getDBStatus().isConnected) {
      try {
        const record = new VoiceInteraction(interactionData);
        return await record.save();
      } catch (e) {
        console.warn('Voice interaction DB save warning:', e.message);
      }
    }
    return memoryStore.createVoiceInteraction(interactionData);
  },
};
