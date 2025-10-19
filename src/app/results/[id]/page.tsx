"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  CircularProgress,
  Container,
  Paper,
  Typography,
  Box,
  Divider,
  Grid,
  Chip,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Navbar from "../../../components/Header";
import Footer from "../../../components/Footer";
import AdInjector from "@/components/AdInjectorheader";

interface Result {
  _id: string;
  title: string;
  description: string;
  postDate: string;
  organization: string;
  category: string;
  status: string;
  downloadLink: string;
  createdAt: string;
  updatedAt: string;
}

export default function ResultDetails() {
  const params = useParams() as { id: string };
  const { id } = params;
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const response = await fetch(`/api/results/${id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch result");
        }

        setResult(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchResult();
    }
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ mb: 2 }}>
          <IconButton
            onClick={() => router.back()}
            sx={{
              color: "text.secondary",
              "&:hover": { color: "primary.main" },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="50vh"
        >
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ mb: 2 }}>
          <IconButton
            onClick={() => router.back()}
            sx={{
              color: "text.secondary",
              "&:hover": { color: "primary.main" },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>
        <Paper sx={{ p: 3, backgroundColor: "#ffebee" }}>
          <Typography color="error" variant="h6" gutterBottom>
            Error
          </Typography>
          <Typography>{error}</Typography>
        </Paper>
      </Container>
    );
  }

  if (!result) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ mb: 2 }}>
          <IconButton
            onClick={() => router.back()}
            sx={{
              color: "text.secondary",
              "&:hover": { color: "primary.main" },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">Result not found</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <>
      <Navbar />
        {/* DYNAMIC AD SLOT (only dynamic ad) */}
              <div className="w-full flex justify-center my-4">
              {/* Visual container where the script will be appended */}
                <div
                id="ad-slot"
                className="inline-block  "
                >
                {/* leaving empty; ad script will inject here */}
                </div>
                {/* Inject the dynamic ad script (no static image) */}
                <AdInjector
                slotId="ad-slot"
                keyId="c1d632aae5a0b2db240c187ea66230df"
                />

              </div>
      <div className="max-w-full mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom sx={{ color: "primary.main" }}>
            {result.title}
          </Typography>
          <Divider sx={{ my: 2 }} />

          <Grid container>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Organization
              </Typography>
              <Typography variant="body1">{result.organization}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Category
              </Typography>
              <Typography variant="body1">{result.category}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={result.status}
                color={
                  result.status.toLowerCase() === "published"
                    ? "success"
                    : "default"
                }
                size="small"
                sx={{ mt: 0.5 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Posted Date
              </Typography>
              <Typography variant="body1">
                {new Date(result.createdAt).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Description
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ mb: 3, whiteSpace: "pre-line" }}
          >
            {result.description || "No description available"}
          </Typography>

          {result.downloadLink && (
            <div className=" mt-4 border border-blue-700 bg-white rounded-lg shadow w-max">
              <table className="border-collapse">
                <tbody>
                  {/* First row: Telegram Channel */}
                  <tr className="border-b border-blue-700 ">
                    <td className="py-3 px-4 text-sm font-medium text-gray-800 whitespace-nowrap">
                      Click Now to Apply:
                    </td>
                    <td className="py-3 px-4 border-l border-blue-700">
                      <a
                        onClick={() => router.push(result.downloadLink)}
                        className="text-red-500 hover:underline cursor-pointer transition-colors duration-200 hover:text-blue-700 font-semibold"
                      >
                        Apply Now
                      </a>
                    </td>
                  </tr>

                  {/* Second row: Apply Job */}

                  <tr>
                    <td className="py-3 px-4 text-sm font-medium text-gray-800 whitespace-nowrap">
                      Join Telegram Channel:
                    </td>
                    <td className="py-3 px-4 border-l border-blue-700">
                      <a
                        href="https://t.me/sarkariresultsnow"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-500 hover:underline cursor-pointer transition-colors duration-200 hover:text-blue-700 font-semibold"
                      >
                        Join Now
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </Paper>
        {/* Back Button */}
        <div className="flex justify-between items-center mt-8">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Home
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}
