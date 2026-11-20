import mongoose from 'mongoose';
import '../mongoose-config';

const quizAttemptSchema = new mongoose.Schema(
  {
    quizId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Quiz',
      required: [true, 'Quiz ID is required'],
    },
    userId: {
      type: String,
      required: [true, 'User ID is required'],
    },
    answers: [{
      type: Number,
      required: [true, 'Answers are required'],
    }],
    score: {
      type: Number,
      required: [true, 'Score is required'],
      min: [0, 'Score cannot be negative'],
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    // Set by the browser for one attempt, so a retry or refresh cannot save it twice.
    clientAttemptId: {
      type: String,
    },
    // Reported by the browser for information only; never used for scoring.
    clientStartedAt: {
      type: Date,
    },
    clientSubmittedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Partial index: older attempts and tests without this id are not affected.
quizAttemptSchema.index(
  { userId: 1, quizId: 1, clientAttemptId: 1 },
  { unique: true, partialFilterExpression: { clientAttemptId: { $type: 'string' } } }
);

export default mongoose.models.QuizAttempt || mongoose.model('QuizAttempt', quizAttemptSchema); 