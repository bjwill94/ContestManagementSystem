import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  PeopleAlt as PeopleIcon,
  Category as CategoryIcon,
  Event as EventIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const API_URL = 'http://localhost:8000';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const theme = useTheme();

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard/stats`);
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      const data = await response.json();
      setStats(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <Paper
      sx={{
        p: 2,
        display: 'flex',
        flexDirection: 'column',
        height: 140,
        bgcolor: color,
        color: 'white',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Icon sx={{ mr: 1 }} />
        <Typography variant="h6" component="div">
          {title}
        </Typography>
      </Box>
      <Typography variant="h3" component="div">
        {value}
      </Typography>
    </Paper>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">Error: {error}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Statistics Cards */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={CategoryIcon}
            title="Categories"
            value={stats.total_categories}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={EventIcon}
            title="Total Events"
            value={stats.total_events}
            color={theme.palette.secondary.main}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={PeopleIcon}
            title="Participants"
            value={stats.total_participants}
            color="#2e7d32" // Green
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            icon={CheckCircleIcon}
            title="Completed Events"
            value={stats.completed_events}
            color="#ed6c02" // Orange
          />
        </Grid>

        {/* Category Stats Chart */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Category-wise Participants
            </Typography>
            <ResponsiveContainer>
              <BarChart
                data={stats.category_stats}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 60,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="category"
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="participant_count" fill={theme.palette.primary.main} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Recent Participants */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 400 }}>
            <Typography variant="h6" gutterBottom>
              Recent Participants
            </Typography>
            <List sx={{ overflow: 'auto', flex: 1 }}>
              {stats.recent_participants.map((participant, index) => (
                <React.Fragment key={participant.id}>
                  <ListItem>
                    <ListItemText
                      primary={participant.name}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {participant.chest_number}
                          </Typography>
                          {` - ${participant.category}`}
                          <br />
                          {`Events: ${participant.events.join(', ')}`}
                        </>
                      }
                    />
                  </ListItem>
                  {index < stats.recent_participants.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Popular Events */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Popular Events
            </Typography>
            <Grid container spacing={2}>
              {stats.popular_events.map((event) => (
                <Grid item xs={12} sm={6} md={4} key={event.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        {event.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {event.participant_count} Participants
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Dashboard;
