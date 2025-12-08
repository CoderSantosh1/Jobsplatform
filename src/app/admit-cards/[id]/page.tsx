'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CircularProgress, Container, Paper, Typography, Box, Divider, Grid, Chip, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Navbar from "../../../components/Header";
import Footer from "../../../components/Footer";
interface AdmitCard {
  _id: string;
  title: string;
  description: string;
  issueDate: string;
  organization: string;
  category: string;
  status: string;
  location: string;
  downloadAdmitcardLink: string;
  requirements: string[];
}

export default function AdmitCardDetails() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [admitCard, setAdmitCard] = useState<AdmitCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { id } = params;

  useEffect(() => {
    const fetchAdmitCard = async () => {
       try {
        const response = await fetch(`/api/admit-cards/${params.id}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch admit card');
        }

        setAdmitCard(data.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAdmitCard();
    }
  }, [id]);

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ mb: 2 }}>
          <IconButton
            onClick={() => router.back()}
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
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
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>
        <Paper sx={{ p: 3, backgroundColor: '#ffebee' }}>
          <Typography color="error" variant="h6" gutterBottom>
            Error
          </Typography>
          <Typography>{error}</Typography>
        </Paper>
      </Container>
    );
  }

  if (!admitCard) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box sx={{ mb: 2 }}>
          <IconButton
            onClick={() => router.back()}
            sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
          >
            <ArrowBackIcon />
          </IconButton>
        </Box>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6">Admit card not found</Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-[#00000] mb-4">
              {admitCard.title}
            </h1>
            <div className="flex items-center text-[#00000] mb-6">
              <span>{admitCard.location}</span>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Job Description
              </h2>
              <p className="text-gray-700 whitespace-pre-line">
                {admitCard.description}
              </p>
            </div>

            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Requirements
              </h2>
              <ul className="list-disc list-inside text-gray-700">
                {admitCard.requirements.map((requirement, index) => (
                  <li key={index} className="mb-2">
                    {requirement}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between items-center">
              {admitCard.downloadAdmitcardLink && (
                <button
                  onClick={() =>
                    window.open(admitCard.downloadAdmitcardLink, "_blank")
                  }
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Download Admit Card
                </button>
              )}
            </div>
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
          </div>
        </div>
      </div>
      {/* <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box sx={{ mb: 2 }}>   <IconButton
          onClick={() => router.back()}
          sx={{ color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
        >
          <ArrowBackIcon />
        </IconButton>

     </Box> <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
          {admitCard.title}
        </Typography>
        <Divider sx={{ my: 2 }} />

        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Organization</Typography>
            <Typography variant="body1">{admitCard.organization}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Category</Typography>
            <Typography variant="body1">{admitCard.category}</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Status</Typography>
            <Chip
              label={admitCard.status}
              color={admitCard.status.toLowerCase() === 'published' ? 'success' : 'default'}
              size="small"
              sx={{ mt: 0.5 }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Typography variant="subtitle2" color="text.secondary">Issue Date</Typography>
            <Typography variant="body1">{new Date(admitCard.issueDate).toLocaleDateString()}</Typography>
          </Grid>
        </Grid>

        <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
          Description
        </Typography>
        <Typography variant="body1" paragraph sx={{ mb: 3 }}>
          {admitCard.description}
        </Typography>

        {admitCard.downloadLink && (
          <Box sx={{ mt: 3 }}>
            <a
              href={admitCard.downloadLink}
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Chip
                label="Download Admit Card"
                color="primary"
                clickable
                sx={{ '&:hover': { backgroundColor: 'primary.dark' } }}
              />
            </a>
          </Box>
        )}
      </Paper>
    </Container> */}
      <Footer />
    </>
  );
}
