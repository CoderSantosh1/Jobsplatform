"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { adminFetch } from "@/lib/admin-fetch";

/* ================= TYPES ================= */

interface Category {
  _id: string;
  name: string;
  subcategories: { name: string; icon?: string }[];
}

interface Question {
  _id?: string;
  text: string;
  options: string[];
  correctAnswer: number;
}

interface Quiz {
  _id: string;
  title: string;
  description: string;
  timeLimit: number;
  totalMarks: number;
  questions: Question[];
  category?: string;
  subcategory?: string;
  status?: "published" | "draft";
}

/* ================= COMPONENT ================= */

export default function EditQuiz({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // ✅ FIX: unwrap params (Next.js 14)
  const { id } = use(params);

  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategoryOptions, setSubcategoryOptions] = useState<string[]>([]);

  /* ================= FETCH ================= */

  useEffect(() => {
    fetchQuiz();
    fetchCategories();
  }, [id]);

  useEffect(() => {
    if (quiz && categories.length > 0 && quiz.category) {
      const found = categories.find((cat) => cat.name === quiz.category);
      setSubcategoryOptions(
        found
          ? found.subcategories.map((sub) =>
              typeof sub === "object" && sub !== null ? sub.name : sub
            )
          : []
      );
    }
  }, [quiz, categories]);

  const fetchQuiz = async () => {
    try {
      const response = await adminFetch(`/api/quizzes/${id}`);
      if (!response.ok) throw new Error();
      const data = await response.json();
      setQuiz(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch quiz");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await adminFetch("/api/quiz-categories");
      if (!response.ok) throw new Error();
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch categories");
    }
  };

  /* ================= HANDLERS ================= */

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    setQuiz((prev) =>
      prev
        ? { ...prev, [name]: type === "number" ? Number(value) : value }
        : null
    );
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setQuiz((prev) =>
      prev ? { ...prev, category: value, subcategory: "" } : null
    );

    const found = categories.find((cat) => cat.name === value);
    setSubcategoryOptions(
      found
        ? found.subcategories.map((sub) =>
            typeof sub === "object" && sub !== null ? sub.name : sub
          )
        : []
    );
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setQuiz((prev) => (prev ? { ...prev, subcategory: e.target.value } : null));
  };

  const handleQuestionChange = (
    index: number,
    field: string,
    value: string
  ) => {
    setQuiz((prev) => {
      if (!prev) return null;
      const questions = [...prev.questions];
      questions[index] = { ...questions[index], [field]: value };
      return { ...prev, questions };
    });
  };

  const handleOptionChange = (
    qIndex: number,
    oIndex: number,
    value: string
  ) => {
    setQuiz((prev) => {
      if (!prev) return null;
      const questions = [...prev.questions];
      questions[qIndex].options[oIndex] = value;
      return { ...prev, questions };
    });
  };

  const handleCorrectAnswerChange = (qIndex: number, value: number) => {
    setQuiz((prev) => {
      if (!prev) return null;
      const questions = [...prev.questions];
      questions[qIndex].correctAnswer = value;
      return { ...prev, questions };
    });
  };

  const addQuestion = () => {
    setQuiz((prev) =>
      prev
        ? {
            ...prev,
            questions: [
              ...prev.questions,
              { text: "", options: ["", "", "", ""], correctAnswer: 0 },
            ],
          }
        : null
    );
  };

  const removeQuestion = (index: number) => {
    setQuiz((prev) => {
      if (!prev) return null;
      const questions = [...prev.questions];
      questions.splice(index, 1);
      return { ...prev, questions };
    });
  };

  /* ================= SUBMIT ================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quiz) return;

    try {
      setSaving(true);
      const response = await adminFetch(`/api/quizzes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quiz),
      });

      if (!response.ok) throw new Error();

      toast.success("Quiz updated successfully");
      router.push("/admin/quizzes");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update quiz");
    } finally {
      setSaving(false);
    }
  };

  /* ================= UI ================= */

  if (loading)
    return <div className="container mx-auto py-8 text-center">Loading...</div>;

  if (!quiz)
    return (
      <div className="container mx-auto py-8 text-center text-red-500">
        Quiz not found
      </div>
    );

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Edit Quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={quiz.title}
                  onChange={handleInputChange}
                  placeholder="Enter quiz title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={quiz.description}
                  onChange={handleInputChange}
                  placeholder="Enter quiz description"
                  required
                />
              </div>

              {/* Category Dropdown */}
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  name="category"
                  value={quiz.category || ""}
                  onChange={handleCategoryChange}
                  className="w-full border rounded p-2"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((cat) => (
                    <option
                      key={cat._id}
                      value={typeof cat.name === "string" ? cat.name : ""}
                    >
                      {typeof cat.name === "string"
                        ? cat.name
                        : "[Invalid name]"}
                    </option>
                  ))}
                </select>
              </div>

              {/* Subcategory Dropdown */}
              <div>
                <Label htmlFor="subcategory">Subcategory</Label>
                <select
                  id="subcategory"
                  name="subcategory"
                  value={quiz.subcategory || ""}
                  onChange={handleSubcategoryChange}
                  className="w-full border rounded p-2"
                  required
                >
                  <option value="">Select subcategory</option>
                  {subcategoryOptions.map((sub) => (
                    <option
                      key={typeof sub === "string" ? sub : ""}
                      value={typeof sub === "string" ? sub : ""}
                    >
                      {typeof sub === "string" ? sub : "[Invalid name]"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
                <Input
                  id="timeLimit"
                  name="timeLimit"
                  type="number"
                  value={quiz.timeLimit}
                  onChange={handleInputChange}
                  min="1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="totalMarks">Total Marks</Label>
                <Input
                  id="totalMarks"
                  name="totalMarks"
                  type="number"
                  value={quiz.totalMarks}
                  onChange={handleInputChange}
                  min="0"
                  required
                />
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  name="status"
                  value={quiz.status === "published" ? "published" : "draft"}
                  onChange={(e) =>
                    setQuiz((prev) =>
                      prev ? { ...prev, status: e.target.value === "published" ? "published" : "draft" } : null
                    )
                  }
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">Only published quizzes can be sent as push notifications.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Questions</h3>
              </div>

              {quiz.questions.map((question, questionIndex) => (
                <div
                  key={questionIndex}
                  className="p-4 border rounded-lg space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <Label>Question {questionIndex + 1}</Label>
                      <Textarea
                        value={question.text}
                        onChange={(e) =>
                          handleQuestionChange(
                            questionIndex,
                            "text",
                            e.target.value
                          )
                        }
                        placeholder="Enter question"
                        className="mt-1"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeQuestion(questionIndex)}
                      className="ml-4"
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Options</Label>
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className="flex items-center gap-2"
                      >
                        <Input
                          value={option}
                          onChange={(e) =>
                            handleOptionChange(
                              questionIndex,
                              optionIndex,
                              e.target.value
                            )
                          }
                          placeholder={`Option ${optionIndex + 1}`}
                        />
                        <input
                          type="radio"
                          name={`correctAnswer-${questionIndex}`}
                          checked={
                            Number(question.correctAnswer) === optionIndex
                          }
                          onChange={() =>
                            handleCorrectAnswerChange(
                              questionIndex,
                              optionIndex
                            )
                          }
                          className="w-4 h-4"
                        />
                        <Label>Correct</Label>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" onClick={addQuestion} variant="outline">
                Add Question
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
