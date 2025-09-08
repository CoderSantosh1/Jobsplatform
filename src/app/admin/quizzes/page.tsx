"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import SearchBar from "@/components/ui/SearchBar";

interface Quiz {
  _id: string;
  title: string;
  description: string;
  timeLimit: number;
  questions: Array<{
    _id: string;
    question: string;
    options: string[];
    correctAnswer: string;
  }>;
  // optional fields may exist (e.g. organization)
  [key: string]: any;
}

export default function QuizList() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  // you can keep searchFields if you want to parameterize which fields to search
  // const [searchFields, setSearchFields] = useState<string[]>(["title", "organization", "description"]);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const fetchQuizzes = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/quizzes");
      if (!response.ok) {
        throw new Error("Failed to fetch quizzes");
      }
      const data = await response.json();
      // assume API returns { data: [...] } as in your original code
      setQuizzes(
        Array.isArray(data.data) ? data.data : data.data ? [data.data] : []
      );
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      toast.error("Failed to fetch quizzes");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quiz?")) {
      return;
    }

    try {
      const response = await fetch(`/api/quizzes/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete quiz");
      }

      toast.success("Quiz deleted successfully");
      await fetchQuizzes();
    } catch (error) {
      console.error("Error deleting quiz:", error);
      toast.error("Failed to delete quiz");
    }
  };

  // Debug: uncomment if you want to see searchQuery updates in console
  // useEffect(() => { console.log("searchQuery:", searchQuery); }, [searchQuery]);

  // compute filtered list from searchQuery
  const q = (searchQuery || "").trim().toLowerCase();
  const filteredQuizzes = q
    ? quizzes.filter((quiz) => {
        // Combine fields you want to search
        const haystack = `${quiz.title || ""} ${quiz.description || ""} ${
          quiz.organization || ""
        }`.toLowerCase();

        // Also search inside question texts if you like:
        const questionsText = (quiz.questions || [])
          .map((qs) => qs.question || "")
          .join(" ")
          .toLowerCase();

        return haystack.includes(q) || questionsText.includes(q);
      })
    : quizzes;

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold">Quizzes</h1>
          <Link href="/admin/quizzes/create">
            <Button>Create New Quiz</Button>
          </Link>
        </div>

        <div className="flex items-center space-x-4">
          <SearchBar
            value={searchQuery}
            onChange={(q) => setSearchQuery(q)}
            placeholder="Search quizzes by title, description, or question..."
            delay={250}
          />
        </div>
      </div>

      {/* empty state when there are no quizzes at all */}
      {quizzes.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-gray-500">
              No quizzes found. Create your first quiz!
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Show message when no quizzes match the search */}
          {q && filteredQuizzes.length === 0 ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-gray-500">
                  No quizzes match your search for "
                  <span className="font-medium">{searchQuery}</span>"
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredQuizzes.map((quiz) => (
                <Card key={quiz._id}>
                  <CardHeader>
                    <CardTitle>{quiz.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-4">
                      {quiz.description}
                    </p>
                    <div className="space-y-2">
                      <p className="text-sm">
                        <span className="font-medium">Time Limit:</span>{" "}
                        {quiz.timeLimit} minutes
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Questions:</span>{" "}
                        {quiz.questions.length}
                      </p>
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                      <Link href={`/admin/quizzes/${quiz._id}/edit`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(quiz._id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
