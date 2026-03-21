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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Navbar from "../../../components/Header";
import Footer from "../../../components/Footer";
import { off } from 'process';
interface Result {
  _id: string;
  title: string;
  description: string;
  postDate: string;
  organization: string;
  category: string;
  status: string;
  downloadLink1?: string;
  downloadLink2?: string;
  downloadLink3?: string;
  createdAt: string;
  updatedAt: string;
  officalwebsites: string[];
  youtubeLink: string;
  downloadnotificationresultlis: string[];
}

export default function ResultDetails() {
  const params = useParams() as { id: string };
  const { id } = params;
  const router = useRouter();
  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const downloadLinks = [
    result?.downloadLink1,
    result?.downloadLink2,
    result?.downloadLink3,
  ].filter(Boolean) as string[];
  const isUrl = (value: string) => /^https?:\/\//i.test(value);

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
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Back btn section */}
        {/* <Box sx={{ mb: 2 }}>
          <IconButton
            onClick={() => router.back()}
            sx={{
              color: "text.secondary",
              "&:hover": { color: "primary.main" },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box> */}
        <Paper className="p-6">
          <div className="text-red-500 font-[600] text-[20px] lg:text-[24px] ">
            {result.title}
          </div>
          <Divider sx={{ my: 2 }} />

          <Grid container>
            <Grid item xs={12} sm={6}>
              <div className="text-red-500 font-[600] text-[14px]">
                Organization
              </div>
              <Typography variant="body1">{result.organization}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <div className="text-red-500 font-[600] text-[14px]">
                Category
              </div>
              <Typography variant="body1">{result.category}</Typography>
            </Grid>
            {/* Status section */}
            {/* <Grid item xs={12} sm={6}>
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
            </Grid> */}
            <Grid item xs={12} sm={6}>
              <div className="text-red-500 font-[600] text-[14px]">
                Posted Date
              </div>
              <Typography variant="body1">
                {new Date(result.createdAt).toLocaleDateString()}
              </Typography>
            </Grid>
          </Grid>

          <div className="text-red-500 font-[600] text-[14px] mt-2">
            Description
          </div>
          <Typography
            variant="body1"
            paragraph
            sx={{ mb: 3, whiteSpace: "pre-line" }}
          >
            {result.description || "No description available"}
          </Typography>
          {/* download link section */}
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table
              sx={{
                "& .MuiTableCell-root": {
                  border: "1px solid #ddd",
                  padding: "16px",
                },
              }}
            >
              <TableBody>
                {/* Green heading row */}
                <TableRow>
                  <TableCell
                    colSpan={2}
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      fontSize: "22px",
                      color: "green",
                    }}
                  >
                    Useful Important Links:
                  </TableCell>
                </TableRow>

                {downloadLinks.length > 0 && (
                  <TableRow>
                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        color: "magenta",
                      }}
                    >
                      Download Results
                    </TableCell>

                    <TableCell
                      align="center"
                      sx={{
                        fontWeight: "bold",
                        fontSize: "14px",
                        color: "magenta",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 1,
                        }}
                      >
                        {downloadLinks.map((link, index) => (
                          <Box
                            key={`${link}-${index}`}
                            component="span"
                            sx={{ display: "inline-flex", alignItems: "center" }}
                          >
                            {index > 0 && (
                              <Box component="span" sx={{ color: "#222", mx: 1 }}>|</Box>
                            )}
                            {isUrl(link) ? (
                              <a
                                href={link}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ textDecoration: "none", color: "blue" }}
                              >
                                {`Link ${index + 1}`}
                              </a>
                            ) : (
                              <span style={{ color: "blue" }}>{link}</span>
                            )}
                          </Box>
                        ))}
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
                {/* Notification download link */}
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      fontSize: "14px",
                      color: "magenta",
                    }}
                  >
                    Download Notification
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      fontSize: "14px",
                      color: "magenta",
                    }}
                  >
                    {result.downloadnotificationresultlis?.length ? (
                      <a
                        href={result.downloadnotificationresultlis[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "none", color: "blue" }}
                      >
                        Click Here
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                </TableRow>
                {/*You tube link*/}
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      fontSize: "14px",
                      color: "magenta",
                    }}
                  >
                    How to Download Results
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      fontSize: "14px",
                      color: "magenta",
                    }}
                  >
                    {result.youtubeLink ? (
                      <a
                        href={result.youtubeLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "none", color: "blue" }}
                      >
                        Click Here
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      fontSize: "14px",
                      color: "magenta",
                    }}
                  >
                    Official Website
                  </TableCell>
                  <TableCell
                    align="center"
                    sx={{
                      fontWeight: "bold",
                      fontSize: "14px",
                      color: "magenta",
                    }}
                  >
                    {result.officalwebsites?.length ? (
                      <a
                        href={result.officalwebsites[0]}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ textDecoration: "none", color: "blue" }}
                      >
                        Click Here
                      </a>
                    ) : (
                      "N/A"
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
          {/* joined telegram whatsapp and insta section */}
          <div className="mt-4 p-4 border border-blue-700 bg-white rounded">
            <p className="text-sm font-medium text-gray-800 mb-3">
              Join our Social Media for more updates:
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
                className="inline-block w-full sm:w-auto text-green-600 border border-green-600 px-4 py-2 rounded font-semibold hover:bg-green-600 hover:text-white transition text-center"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp
              </a>
              <a
                href="https://www.instagram.com/sarkariresultsnow/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full sm:w-auto text-pink-600 border border-pink-600 px-4 py-2 rounded font-semibold hover:bg-pink-600 hover:text-white transition text-center"
              >
                Instagram
              </a>
            </div>
          </div>
        </Paper>
      </div>
      <Footer />
    </>
  );
}
