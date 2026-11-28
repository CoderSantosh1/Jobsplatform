import mongoose from 'mongoose';
import '../mongoose-config';

// Admin decisions on SEO recommendations (new, separate collection "seoreviews"; existing content is not touched).
// Approved "redirect" decisions for post URLs (/jobs/…, /results/…, /admit-cards/…, /answer-keys/…, /admissions/…)
// are served live by src/lib/live-redirects.ts; every other decision is a record only.
const seoReviewSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['noindex', 'redirect', 'canonical'], required: true },
    path: { type: String, required: true, trim: true },
    decision: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    /** Redirect destination or preferred canonical path. */
    target: { type: String, default: '', trim: true },
    note: { type: String, default: '', trim: true, maxlength: 1000 },
    decidedBy: { type: String, default: '' },
  },
  { timestamps: true }
);

seoReviewSchema.index({ kind: 1, path: 1 }, { unique: true });

const SeoReview = mongoose.models.SeoReview || mongoose.model('SeoReview', seoReviewSchema);

export default SeoReview;
