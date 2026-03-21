'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { off } from 'process';

interface ResultFormData {
  title: string;
  organization: string;
  resultDate: string;
  category: string;
  downloadLink1: string;
  downloadLink2: string;
  downloadLink3: string;
  youtubeLink: string;
  description: string;
  status: string;
  officalwebsites: string;
  downloadnotificationresultlis: string;
}

interface ResultFormProps {
  initialData?: ResultFormData | null;
  onSubmit: (data: ResultFormData) => void;
  onCancel?: () => void;
}

export default function ResultForm({ initialData, onSubmit, onCancel }: ResultFormProps) {
  const [formData, setFormData] = useState<ResultFormData>({
    title: '',
    organization: '',
    resultDate: '',
    category: 'other',
    downloadLink1: '',
    downloadLink2: '',
    downloadLink3: '',
    youtubeLink: '',
    description: initialData?.description || '',
    status: 'draft',
    officalwebsites: '',
    downloadnotificationresultlis: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);

    if (!initialData) {
      setFormData({
        title: '',
        organization: '',
        resultDate: '',
        category: 'other',
        downloadLink1: '',
        downloadLink2: '',
        downloadLink3: '',
        youtubeLink: '',
        description: '',
        status: 'draft',
        officalwebsites: '',
        downloadnotificationresultlis: '',
      });
    }
  };

  return (
    <div className="h-screen overflow-auto p-4 bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto border border-orange-100">
        {/* <div className="mb-6 rounded-lg border border-orange-200 bg-orange-50 p-4"> */}
          <h2 className="text-2xl font-semibold mb-4">{initialData ? 'Edit Result' : 'Post New Result'}</h2>

        {/* </div> */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Exam Name</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Organization</label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="government">Government</option>
              <option value="private">Private</option>
              <option value="education">Education</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Result Date</label>
            <input
              type="date"
              value={formData.resultDate}
              onChange={(e) => setFormData({ ...formData, resultDate: e.target.value })}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Result Access Section</h3>
              <p className="mt-1 text-xs text-gray-600">
                All fields are optional. Use them for direct links, alternate links, or status text.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Download Link 1 / Text (Optional)</label>
            <input
              type="text"
              value={formData.downloadLink1}
              onChange={(e) => setFormData({ ...formData, downloadLink1: e.target.value })}
              className="w-full p-2 border rounded-md"
              placeholder="https://example.com/result-main or Coming Soon"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Download Link 2 / Text (Optional)</label>
            <input
              type="text"
              value={formData.downloadLink2}
              onChange={(e) => setFormData({ ...formData, downloadLink2: e.target.value })}
              className="w-full p-2 border rounded-md"
              placeholder="https://example.com/result-mirror or Coming Soon"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Download Link 3 / Text (Optional)</label>
            <input
              type="text"
              value={formData.downloadLink3}
              onChange={(e) => setFormData({ ...formData, downloadLink3: e.target.value })}
              className="w-full p-2 border rounded-md"
              placeholder="https://example.com/result-3 or Comming Soon-21/03/2026"
            />
            <p className="mt-2 text-xs text-gray-500">
              Example: official URL, alternate link, Coming Soon, or Comming Soon-21/03/2026.
            </p>
          </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">YouTube Video Link (Optional)</label>
            <input
              type="url"
              value={formData.youtubeLink}
              onChange={(e) => setFormData({ ...formData, youtubeLink: e.target.value })}
              className="w-full p-2 border rounded-md"
              placeholder="https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Download Notification (Optional)</label>
            <input
              type="text"
              value={formData.downloadnotificationresultlis}
              onChange={(e) => setFormData({ ...formData, downloadnotificationresultlis: e.target.value })}
              className="w-full p-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full p-2 border rounded-md h-32"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Official Websites (comma separated)</label>
            <input
              type="text"
              value={formData.officalwebsites}
              onChange={(e) => setFormData({ ...formData, officalwebsites: e.target.value })}
              className="w-full p-2 border rounded-md"
              placeholder="https://example1.com, https://example2.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full p-2 border rounded-md"
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1">
              {initialData ? 'Update Result' : 'Post Result'}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                Cancel
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
