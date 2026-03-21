export interface Result {
  _id: string;
  title: string;
  organization: string;
  resultDate: string;
  category: string;
  downloadLink1?: string;
  downloadLink2?: string;
  downloadLink3?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  description?: string;
  attachments?: string[];
  officalwebsites: string[];
}