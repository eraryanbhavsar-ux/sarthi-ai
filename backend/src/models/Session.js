import mongoose from 'mongoose';

const requiredActionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    explanation: { type: String, default: '' },
    deadline: { type: String, default: '' },
    completed: { type: Boolean, default: false },
  },
  { _id: false }
);

const stepSchema = new mongoose.Schema(
  {
    stepNumber: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    tip: { type: String, default: '' },
  },
  { _id: false }
);

const deadlineSchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    description: { type: String, required: true },
    urgency: { type: String, enum: ['high', 'medium', 'low', 'unknown'], default: 'medium' },
  },
  { _id: false }
);

const requiredDocumentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    purpose: { type: String, default: '' },
    isMandatory: { type: Boolean, default: true },
  },
  { _id: false }
);

const qnaItemSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const translationItemSchema = new mongoose.Schema(
  {
    language: { type: String, required: true },
    simpleExplanation: { type: String, default: '' },
    keyPoints: [{ type: String }],
    requiredActions: [requiredActionSchema],
    translatedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: true,
      trim: true,
    },
    contentType: {
      type: String,
      enum: ['pdf', 'image', 'text', 'voice'],
      required: true,
    },
    summary: {
      type: String,
      required: true,
    },
    simpleExplanation: {
      type: String,
      required: true,
    },
    evenSimplerExplanation: {
      type: String,
      default: '',
    },
    keyPoints: [{ type: String }],
    requiredActions: [requiredActionSchema],
    steps: [stepSchema],
    deadlines: [deadlineSchema],
    requiredDocuments: [requiredDocumentSchema],
    importantWarnings: [{ type: String }],
    missingInformation: [{ type: String }],
    visualDescription: {
      type: String,
      default: '',
    },
    difficultyLevel: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    suggestedQuestions: [{ type: String }],
    originalText: {
      type: String,
      default: '',
    },
    fileMetadata: {
      fileName: { type: String, default: '' },
      fileType: { type: String, default: '' },
      fileSize: { type: Number, default: 0 },
      pageCount: { type: Number, default: 1 },
    },
    qnaHistory: [qnaItemSchema],
    translations: [translationItemSchema],
    activeLanguage: {
      type: String,
      default: 'en',
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ createdAt: -1 });

export const Session = mongoose.model('Session', sessionSchema);
