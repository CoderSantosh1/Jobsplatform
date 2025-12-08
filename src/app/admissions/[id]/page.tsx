'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from "next/navigation";

interface Admission {
  _id: string;
  title: string;
  organization: string;
  examDate: string;
  category: string;
  downloadLink: string;
  description: string;
  content: string;
  status: string;
  createdAt: string;
}

export default function AdmissionDetails() {
  const params = useParams() as { id: string };
  const [admission, setAdmission] = useState<Admission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  useEffect(() => {
    const fetchAdmission = async () => {
      if (!params.id) {
        setError('Invalid parameters');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/admissions/${params.id}`);
        if (!response.ok) {
          throw new Error('Admission not found');
        }
        const data = await response.json();
        setAdmission(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch admission');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAdmission();
    }
  }, [params]);

  if (loading) {
    return <div className="text-center p-8">Loading admission details...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-500 mb-4">{error}</div>
        <Link href="/admissions">
          <Button variant="outline">Back to Admissions</Button>
        </Link>
      </div>
    );
  }

  if (!admission) {
    return (
      <div className="p-8">
        <div className="text-black-500 mb-4">Admission not found</div>
        <Link href="/admissions">
          <Button variant="outline">Back to Admissions</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {admission.title}
        </h1>

        <div className="grid gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-black-700">
              Organization
            </h2>
            <p className="text-gray-600">{admission.organization}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-black-700">Category</h2>
            <p className="text-gray-600">{admission.category}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-black-700">Exam Date</h2>
            <p className="text-gray-600">
              {new Date(admission.examDate).toLocaleDateString()}
            </p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-black-700">
              Description
            </h2>
            <p className="text-gray-600">{admission.description}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-black-700">Content</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="whitespace-pre-wrap text-black-600">
                {admission.content}
              </pre>
            </div>
          </div>

          {admission.downloadLink && (
            <div>
              <h2 className="text-lg font-semibold text-black-700">Download</h2>
              <a
                href={admission.downloadLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Download Admission Document
              </a>
            </div>
          )}
            {/* joined telegram whatsapp and insta section */}
          <div className="mt-4 p-4 border border-blue-700 bg-white rounded">
            <p className="text-sm font-medium text-gray-800 mb-3">
              Join our community for more updates:
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="https://t.me/sarkariresultsnow"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full sm:w-auto text-blue-600 border border-blue-600 px-4 py-2 rounded font-semibold hover:bg-blue-600 hover:text-white transition text-center"
              >
                Telegram
              </a>

              <a
                href="https://chat.whatsapp.com/BA5S3uiul7iHKwi4jIeuuf"
                className="w-full sm:w-auto text-green-600 border border-green-600 px-4 py-2 rounded font-semibold hover:bg-green-600 hover:text-white transition"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
              <a
                href="https://www.instagram.com/sarkariresultsnow/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto text-pink-600 border border-pink-600 px-4 py-2 rounded font-semibold hover:bg-pink-600 hover:text-white transition"
              >
                Instagram
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="outline" size="sm">
                ← Back to Admissions
              </Button>
            </Link>
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                admission.status === "published"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {admission.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}