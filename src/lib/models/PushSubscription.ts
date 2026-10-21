import mongoose from 'mongoose';

// One row per browser that opted in to exam alerts. The Firebase Installation ID (FID) is an anonymous,
// per-browser identifier; nothing else about the visitor is stored.
const pushSubscriptionSchema = new mongoose.Schema(
  {
    fid: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    lastSeenAt: {
      type: Date,
      default: Date.now,
    },
    // Delivery history for the admin subscriber list (filled in by sendPushToAll).
    receivedCount: { type: Number, default: 0 },
    lastReceivedAt: { type: Date },
    lastFailedAt: { type: Date },
    lastError: { type: String },
  },
  {
    timestamps: true,
  }
);

const PushSubscription =
  mongoose.models.PushSubscription || mongoose.model('PushSubscription', pushSubscriptionSchema);

export default PushSubscription;
