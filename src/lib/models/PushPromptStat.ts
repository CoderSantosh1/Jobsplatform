import mongoose from 'mongoose';

// One row per IST day with counters for the "Get exam alerts" popup (see PUSH_PROMPT_EVENTS in lib/push-stats).
// Only counts are stored: no visitor IDs, IPs or device details.
const counter = { type: Number, default: 0 };

const pushPromptStatSchema = new mongoose.Schema(
  {
    day: { type: String, required: true, unique: true },
    shown: counter,
    enabled: counter,
    notNow: counter,
    closed: counter,
    blocked: counter,
    ignored: counter,
    failed: counter,
  },
  {
    timestamps: true,
  }
);

const PushPromptStat =
  mongoose.models.PushPromptStat || mongoose.model('PushPromptStat', pushPromptStatSchema);

export default PushPromptStat;
