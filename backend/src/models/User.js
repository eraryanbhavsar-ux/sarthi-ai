import mongoose from 'mongoose';

const accessibilityPreferencesSchema = new mongoose.Schema(
  {
    textSize: {
      type: String,
      enum: ['normal', 'large', 'xlarge'],
      default: 'normal',
    },
    highContrast: {
      type: String,
      enum: ['none', 'dark', 'light'],
      default: 'none',
    },
    readingMode: {
      type: Boolean,
      default: false,
    },
    reducedMotion: {
      type: Boolean,
      default: false,
    },
    simplifiedInterface: {
      type: Boolean,
      default: false,
    },
    voiceMode: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const userStatsSchema = new mongoose.Schema(
  {
    documentsAnalyzed: { type: Number, default: 0 },
    questionsAnswered: { type: Number, default: 0 },
    actionsCompleted: { type: Number, default: 0 },
    translationsCount: { type: Number, default: 0 },
    visionScansCompleted: { type: Number, default: 0 },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    preferredLanguage: {
      type: String,
      default: 'en',
    },
    accessibilityPreferences: {
      type: accessibilityPreferencesSchema,
      default: () => ({}),
    },
    stats: {
      type: userStatsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model('User', userSchema);
