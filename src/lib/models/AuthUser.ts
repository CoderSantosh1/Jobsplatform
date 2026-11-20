import mongoose from 'mongoose';
import '../mongoose-config';

// Accounts that log in with Google or email through Firebase. Kept apart from the older `users` collection, whose
// mobile field is required and unique. Passwords are held by Firebase, never here.
const authUserSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    provider: {
      type: String,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    lastLoginAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const AuthUser = mongoose.models.AuthUser || mongoose.model('AuthUser', authUserSchema);

export default AuthUser;
