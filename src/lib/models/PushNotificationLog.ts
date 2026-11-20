import mongoose from 'mongoose';
import '../mongoose-config';

// History of push notifications sent from the admin dashboard, used to warn before re-sending the same item.
const pushNotificationLogSchema = new mongoose.Schema(
  {
    contentType: { type: String, required: true },
    contentId: { type: String, required: true },
    title: { type: String, required: true },
    body: { type: String, required: true },
    url: { type: String, required: true },
    sentBy: { type: String, required: true },
    status: {
      type: String,
      enum: ['sending', 'sent', 'failed'],
      default: 'sending',
    },
    subscriberCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    failureCount: { type: Number, default: 0 },
    removedCount: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

pushNotificationLogSchema.index({ contentType: 1, contentId: 1, createdAt: -1 });

const PushNotificationLog =
  mongoose.models.PushNotificationLog || mongoose.model('PushNotificationLog', pushNotificationLogSchema);

export default PushNotificationLog;
