'use client';

import React from 'react';
import { Container, Box, Typography, Button, Card, CardContent, Switch, Stack } from '@mui/material';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { useThemeMode } from '@/theme/ThemeProvider';

export default function HomeContent() {
  const { mode, toggleTheme } = useThemeMode();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <Box
        component="header"
        sx={{
          bgcolor: 'primary.main',
          color: 'white',
          py: 3,
          px: 2,
          boxShadow: 1,
        }}
      >
        <Container maxWidth="lg">
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700 }}>
              Pathology Lab Management System
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                {mode === 'light' ? (
                  <LightModeIcon />
                ) : (
                  <DarkModeIcon />
                )}
                <Switch
                  checked={mode === 'dark'}
                  onChange={toggleTheme}
                  color="default"
                />
              </Stack>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ flex: 1, py: 6 }}>
        <Typography
          variant="h3"
          component="h2"
          sx={{ mb: 4, fontWeight: 600, textAlign: 'center' }}
        >
          Welcome to Your Lab Management Solution
        </Typography>

        <Typography
          variant="body1"
          sx={{ mb: 6, textAlign: 'center', color: 'text.secondary', fontSize: '1.1rem' }}
        >
          A comprehensive system for managing pathology lab operations, patient data, and test results.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
            gap: 3,
            mb: 6,
          }}
        >
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography color="primary" variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                📋 Patient Management
              </Typography>
              <Typography color="textSecondary" variant="body2">
                Manage patient records, history, and medical information efficiently.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography color="primary" variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                🧪 Test Management
              </Typography>
              <Typography color="textSecondary" variant="body2">
                Track and manage various pathology tests and their results.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography color="primary" variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                📊 Analytics
              </Typography>
              <Typography color="textSecondary" variant="body2">
                View comprehensive analytics and reports on lab performance.
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1 }}>
              <Typography color="primary" variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                ⚙️ Settings
              </Typography>
              <Typography color="textSecondary" variant="body2">
                Configure lab settings and user preferences.
              </Typography>
            </CardContent>
          </Card>
        </Box>

        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
            Get Started
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button variant="contained" size="large" color="primary">
              Dashboard
            </Button>
            <Button variant="outlined" size="large" color="primary">
              Documentation
            </Button>
          </Stack>
        </Box>
      </Container>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          py: 4,
          px: 2,
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
            <Typography variant="body2" color="textSecondary">
              © 2026 Pathology Lab Management System. All rights reserved.
            </Typography>
            <Stack direction="row" spacing={3}>
              <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                Privacy Policy
              </Typography>
              <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                Terms of Service
              </Typography>
              <Typography variant="body2" color="primary" sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                Contact
              </Typography>
            </Stack>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
