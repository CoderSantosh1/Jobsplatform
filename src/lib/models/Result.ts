import mongoose from 'mongoose';
import '../mongoose-config';

const ResultSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide an title"],
    trim: true,
  },
  description: {
    type: String,
    required: [true, "Please provide a description"],
    trim: true,
  },

  organization: {
    type: String,
    required: [true, "Please provide an organization name"],
    trim: true,
  },
  resultDate: {
    type: Date,
    required: [true, "Please provide a result date"],
    validate: {
      validator: function (value: Date) {
        const now = new Date();
        return value instanceof Date && !isNaN(value.getTime()) && value <= now;
      },
      message: "Result date must be a valid date not in the future",
    },
  },
  category: {
    type: String,
    required: [true, "Please provide a result category"],
    enum: {
      values: ["government", "private", "education", "other"],
      message: "Category must be one of: government, private, education, other",
    },
  },
  downloadLink: {
    type: String,
    required: false,
    validate: {
      validator: function (value: string) {
        if (!value) return true;
        return true;
      },
      message: "Download link can be a URL or plain text",
    },
  },
  downloadLink1: {
    type: String,
    required: false,
    validate: {
      validator: function (value: string) {
        if (!value) return true;
        return true;
      },
      message: "Download link 1 can be a URL or plain text",
    },
  },
  downloadLink2: {
    type: String,
    required: false,
    validate: {
      validator: function (value: string) {
        if (!value) return true;
        return true;
      },
      message: "Download link 2 can be a URL or plain text",
    },
  },
  downloadLink3: {
    type: String,
    required: false,
    validate: {
      validator: function (value: string) {
        if (!value) return true;
        return true;
      },
      message: "Download link 3 can be a URL or plain text",
    },
  },
  youtubeLink: {
    type: String,
    required: false,
    validate: {
      validator: function (value: string) {
        if (!value) return true; // Allow empty values
        return /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/.test(value);
      },
      message: "Please provide a valid YouTube URL",
    },
  },
  officalwebsites: {
    type: [String],
    default: [],
    validate: {
      validator: function (arr: any[]) {
        if (!Array.isArray(arr)) return false;
        const urlRe = /^(https?):\/\/[^\s/$.?#].[^\s]*$/i;
        return arr.every((v) => typeof v === "string" && urlRe.test(v.trim()));
      },
      message: "Each official website must be a valid URL (http/https).",
    },
  },
  downloadnotificationresultlis: {
    type: [String],
    default: [],
  },
  status: {
    type: String,
    enum: ["draft", "published", "closed"],
    default: "draft",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const existingResultModel = mongoose.models.Result as mongoose.Model<any> | undefined;

if (existingResultModel) {
  existingResultModel.schema.add({
    downloadLink1: ResultSchema.obj.downloadLink1,
    downloadLink2: ResultSchema.obj.downloadLink2,
    downloadLink3: ResultSchema.obj.downloadLink3,
  });
}

const Result: mongoose.Model<any> =
  existingResultModel || mongoose.model<any>('Result', ResultSchema);

export default Result;
