import { User } from './User.js';
import { memoryStore } from './memoryStore.js';
import { getDBStatus } from '../config/db.js';

export const userRepo = {
  async findByEmail(email) {
    if (getDBStatus().isConnected) {
      return await User.findOne({ email: email.toLowerCase().trim() });
    }
    return memoryStore.findUserByEmail(email);
  },

  async findById(id) {
    if (getDBStatus().isConnected) {
      return await User.findById(id);
    }
    return memoryStore.findUserById(id);
  },

  async create(userData) {
    if (getDBStatus().isConnected) {
      const user = new User(userData);
      return await user.save();
    }
    return memoryStore.createUser(userData);
  },

  async updatePreferences(id, preferences) {
    if (getDBStatus().isConnected) {
      return await User.findByIdAndUpdate(
        id,
        { $set: { accessibilityPreferences: preferences } },
        { new: true }
      );
    }
    return memoryStore.updateUser(id, { accessibilityPreferences: preferences });
  },

  async incrementStat(id, statName, count = 1) {
    if (!id) return;
    if (getDBStatus().isConnected) {
      const update = {};
      update[`stats.${statName}`] = count;
      await User.findByIdAndUpdate(id, { $inc: update });
    } else {
      const user = memoryStore.findUserById(id);
      if (user) {
        user.stats = user.stats || {};
        user.stats[statName] = (user.stats[statName] || 0) + count;
        memoryStore.updateUser(id, { stats: user.stats });
      }
    }
  },
};
