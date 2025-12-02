'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from "next/navigation";

interface AnswerKey {
  _id: string;
  title: string;
  organization: string;
  category: string;
  downloadLink: string;
  description: string;
  content: string;
  status: string;
  createdAt: string;
}

export default function AnswerKeyDetail() {
  const params = useParams() as { id: string };
  const [answerKey, setAnswerKey] = useState<AnswerKey | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchAnswerKey = async () => {
      if (!params.id) {
        setError('Invalid parameters');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/answer-keys/${params.id}`);
        if (!response.ok) {
          throw new Error('Answer key not found');
        }
        const data = await response.json();
        setAnswerKey(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch answer key');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchAnswerKey();
    }
  }, [params]);

  if (loading) {
    return <div className="text-center p-8">Loading answer key details...</div>;
  }

  if (error) {
    return (
      <div className="p-8">
        <div className="text-red-500 mb-4">{error}</div>
        <Link href="/">
          <Button variant="outline">Back to Answer Keys</Button>
        </Link>
      </div>
    );
  }

  if (!answerKey) {
    return (
      <div className="p-8">
        <div className="text-gray-500 mb-4">Answer key not found</div>
        <Link href="/">
          <Button variant="outline">Back to Answer Keys</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          {answerKey.title}
        </h1>

        <div className="grid gap-4 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-700">
              Organization
            </h2>
            <p className="text-gray-600">{answerKey.organization}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700">Category</h2>
            <p className="text-gray-600">{answerKey.category}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700">Description</h2>
            <p className="text-gray-600">{answerKey.description}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-700">Content</h2>
            <div className="bg-gray-50 p-4 rounded-md">
              <pre className="whitespace-pre-wrap text-gray-600">
                {answerKey.content}
              </pre>
            </div>
          </div>

          {answerKey.downloadLink && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Download</h2>
              <a
                href={answerKey.downloadLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 hover:underline"
              >
                Download Answer Key
              </a>
            </div>
          )}
          {/* joined telegram whatsapp and insta section */}
          <div className="mt-4 p-4 border border-blue-700 bg-white rounded">
            <p className="text-sm font-medium text-gray-800 mb-3">
              Join our community for more updates:
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push("https://t.me/sarkariresultsnow")}
                className="w-full sm:w-auto text-blue-600 border border-blue-600 px-4 py-2 rounded font-semibold hover:bg-blue-600 hover:text-white transition"
              >
                Telegram
              </button>

              <button
                onClick={() =>
                  router.push(
                    "https://chat.whatsapp.com/BA5S3uiul7iHKwi4jIeuuf"
                  )
                }
                className="w-full sm:w-auto text-green-600 border border-green-600 px-4 py-2 rounded font-semibold hover:bg-green-600 hover:text-white transition"
              >
                WhatsApp
              </button>

              <button
                onClick={() =>
                  router.push("https://www.instagram.com/sarkariresultsnow/")
                }
                className="w-full sm:w-auto text-pink-600 border border-pink-600 px-4 py-2 rounded font-semibold hover:bg-pink-600 hover:text-white transition"
              >
                Instagram
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Link href="/">
              <Button variant="outline" size="sm">
                ← Back to Home
              </Button>
            </Link>
            {/* <span
              className={`px-3 py-1 rounded-full text-sm ${
                answerKey.status === "published"
                  ? "bg-green-100 text-green-800"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              {answerKey.status}
            </span> */}
          </div>
        </div>
      </div>
    </div>
  );
}