'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import jsPDF from "jspdf";

interface Quiz {
  _id: string;
  title: string;
  description: string;
  timeLimit: number;
  questions: Array<{
    _id: string;
    text: string;
    options: string[];
    correctAnswer: number;
  }>;
  attempts?: Array<{
    _id: string;
    userId: string;
    score: number;
    completedAt: string;
  }>;
  createdAt?: string;
  updatedAt?: string;
  totalMarks?: number;
}

export default function QuizList() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    try {
      const response = await fetch('/api/quizzes');
      if (!response.ok) {
        throw new Error('Failed to fetch quizzes');
      }
      const data = await response.json();
      setQuizzes(data.data || []);
    } catch (error) {
      setError('Error loading quizzes');
      console.error('Error fetching quizzes:', error);
      toast.error('Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };
const handleDownloadCSV = (quiz: Quiz) => {
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    alert("No questions available");
    return;
  }

  // CSV header
  const headers = [
    "question",
    "option1",
    "option2",
    "option3",
    "option4",
    "correctAnswer",
  ];

  // Convert questions to rows
  const rows = quiz.questions.map((q) => {
    return [
      `"${q.text.replace(/"/g, '""')}"`,
      `"${q.options[0] ?? ""}"`,
      `"${q.options[1] ?? ""}"`,
      `"${q.options[2] ?? ""}"`,
      `"${q.options[3] ?? ""}"`,
      q.correctAnswer,
    ].join(",");
  });

  // Combine header + rows
  const csvContent = [headers.join(","), ...rows].join("\n");

  // Create CSV blob
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  // Trigger download
  const link = document.createElement("a");
  link.href = url;
  link.download = `${quiz.title.replace(/\s+/g, "_")}.csv`;
  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


  const handleEdit = (id: string) => {
    router.push(`/admin/quizzes/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/quizzes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete quiz');
      }

      toast.success('Quiz deleted successfully');
      setQuizzes(quizzes.filter(quiz => quiz._id !== id));
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 p-4 text-center">
        {error}
      </div>
    );
  }

  if (quizzes.length === 0) {
    return (
      <div className="text-center p-4 text-gray-500">
        No quizzes found. Create your first quiz!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quizzes.map((quiz) => (
        <Card key={quiz._id} className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold">{quiz.title}</h3>
              <p className="text-gray-600 mt-1">{quiz.description}</p>
              <div className="mt-2 text-sm text-gray-500">
                <p>Time Limit: {quiz.timeLimit} minutes</p>
                <p>Questions: {quiz.questions.length}</p>
                <p>Total Marks: {quiz.totalMarks || 0}</p>
                {quiz.createdAt && (
                  <p>
                    Created: {new Date(quiz.createdAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
            <div className="flex space-x-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDownloadCSV(quiz)}
              >
                Download CSV
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEdit(quiz._id)}
              >
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDelete(quiz._id)}
              >
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
