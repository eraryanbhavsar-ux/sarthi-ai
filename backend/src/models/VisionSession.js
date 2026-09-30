import mongoose from 'mongoose';

const formFieldSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    label: { type: String, required: true },
    explanation: { type: String, required: true },
    isRequired: { type: Boolean, default: false },
    fieldIndex: { type: Number, default: 0 },
  },
  { _id: false }
);

const visionQnaSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const visionTranslationSchema = new mongoose.Schema(
  {
    language: { type: String, required: true },
    description: { type: String, required: true },
    importantInformation: [{ type: String }],
    translatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const visionSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    guestId: {
      type: String,
      default: null,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    visibleText: [{ type: String }],
    importantInformation: [{ type: String }],
    objects: [{ type: String }],
    possibleActions: [{ type: String }],
    warnings: [{ type: String }],
    isDocument: {
      type: Boolean,
      default: false,
    },
    spatialLayout: {
      type: String,
      default: '',
    },
    detectedForm: {
      hasForm: { type: Boolean, default: false },
      fields: [formFieldSchema],
    },
    qnaHistory: [visionQnaSchema],
    translations: [visionTranslationSchema],
    fileMetadata: {
      fileName: { type: String, default: '' },
      fileType: { type: String, default: '' },
      fileSize: { type: Number, default: 0 },
      capturedViaCamera: { type: Boolean, default: false },
    },
    activeLanguage: {
      type: String,
      default: 'en',
    },
  },
  {
    timestamps: true,
  }
);

visionSessionSchema.index({ createdAt: -1 });

export const VisionSession = mongoose.model('VisionSession', visionSessionSchema);
