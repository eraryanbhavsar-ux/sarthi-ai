import mongoose from 'mongoose';

const voiceInteractionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    sessionId: {
      type: String,
      default: null,
      index: true,
    },
    command: {
      type: String,
      required: true,
      trim: true,
    },
    response: {
      type: String,
      required: true,
    },
    actionTriggered: {
      type: String,
      default: 'GENERAL_QUERY',
    },
    language: {
      type: String,
      default: 'en',
    },
  },
  {
    timestamps: true,
  }
);

voiceInteractionSchema.index({ createdAt: -1 });

export const VoiceInteraction = mongoose.model('VoiceInteraction', voiceInteractionSchema);
