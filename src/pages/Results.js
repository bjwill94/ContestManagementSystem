import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import { Save as SaveIcon, Download as DownloadIcon, Calculate as CalculateIcon } from '@mui/icons-material';
import * as XLSX from 'xlsx';

const API_URL = 'http://localhost:8000';

function Results() {
  const [categories, setCategories] = useState([]);
  const [events, setEvents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);
  const [marks, setMarks] = useState({});
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (selectedEvent && selectedCategory) {
      fetchParticipants();
    }
  }, [selectedEvent, selectedCategory]);

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories/`);
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showNotification('Error fetching categories', 'error');
    }
  };

  const fetchEvents = async (categoryId) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/events/?category_id=${categoryId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching events:', error);
      showNotification('Error fetching events', 'error');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchParticipants = async () => {
    if (!selectedCategory || !selectedEvent) return;
    
    setLoading(true);
    try {
      console.log('Fetching participants with:', {
        category_id: selectedCategory,
        event_id: selectedEvent
      });
      
      const response = await fetch(
        `${API_URL}/participants/?category_id=${selectedCategory}&event_id=${selectedEvent}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch participants: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Received participants data:', data);
      
      if (!Array.isArray(data)) {
        throw new Error('Expected array of participants but received: ' + typeof data);
      }
      
      if (data.length === 0) {
        showNotification('No participants found for the selected category and event', 'info');
        setParticipants([]);
        setMarks({});
        return;
      }
      
      // Initialize marks and set participants
      const initialMarks = {};
      data.forEach(participant => {
        initialMarks[participant.id] = {
          mark1: participant.mark1 || '',
          mark2: participant.mark2 || '',
          mark3: participant.mark3 || ''
        };
      });
      
      setMarks(initialMarks);
      setParticipants(data);
      
      // If we have any saved marks, show a success message
      if (data.some(p => p.mark1 || p.mark2 || p.mark3)) {
        showNotification('Loaded saved results successfully', 'success');
      }
    } catch (error) {
      console.error('Error fetching participants:', error);
      showNotification(`Error fetching participants: ${error.message}`, 'error');
      setParticipants([]);
      setMarks({});
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (event) => {
    const categoryId = event.target.value;
    setSelectedCategory(categoryId);
    setSelectedEvent('');
    setParticipants([]);
    setEvents([]);
    if (categoryId) {
      fetchEvents(categoryId);
    }
  };

  const handleEventChange = (event) => {
    setSelectedEvent(event.target.value);
    setParticipants([]);
  };

  const handleMarksChange = (participantId, field, value) => {
    setMarks(prevMarks => ({
      ...prevMarks,
      [participantId]: {
        ...prevMarks[participantId],
        [field]: value
      }
    }));
  };

  const calculateResults = () => {
    const updatedParticipants = participants.map(participant => {
      const participantMarks = marks[participant.id] || {};
      const mark1 = parseFloat(participantMarks.mark1) || 0;
      const mark2 = parseFloat(participantMarks.mark2) || 0;
      const mark3 = parseFloat(participantMarks.mark3) || 0;
      const totalMarks = parseFloat((mark1 + mark2 + mark3).toFixed(2));

      return {
        ...participant,
        mark1,
        mark2,
        mark3,
        totalMarks
      };
    });

    // Sort by total marks in descending order
    updatedParticipants.sort((a, b) => b.totalMarks - a.totalMarks);

    // Group participants by total marks
    const markGroups = {};
    updatedParticipants.forEach(participant => {
      const totalMarks = participant.totalMarks;
      if (!markGroups[totalMarks]) {
        markGroups[totalMarks] = [];
      }
      markGroups[totalMarks].push(participant);
    });

    // Assign ranks based on groups
    let currentPosition = 1;
    Object.keys(markGroups)
      .map(Number)
      .sort((a, b) => b - a) // Sort marks in descending order
      .forEach(totalMarks => {
        const participantsInGroup = markGroups[totalMarks];
        // Assign the same rank to all participants in the group
        participantsInGroup.forEach(participant => {
          participant.rank = currentPosition;
        });
        // Next rank will be after all participants in current group
        currentPosition += participantsInGroup.length;
      });

    setParticipants(updatedParticipants);
    showNotification('Results calculated successfully', 'success');
  };

  const saveResults = async () => {
    try {
      setLoading(true);
      const resultsData = participants.map(participant => ({
        participant_id: participant.id,
        event_id: parseInt(selectedEvent),
        judge1_marks: parseFloat(marks[participant.id]?.mark1) || 0,
        judge2_marks: parseFloat(marks[participant.id]?.mark2) || 0,
        judge3_marks: parseFloat(marks[participant.id]?.mark3) || 0
      }));

      console.log('Saving results:', resultsData); // Debug log

      const response = await fetch(`${API_URL}/results/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(resultsData),
      });

      const responseData = await response.json();
      console.log('Response:', response.status, responseData); // Debug log

      if (!response.ok) {
        throw new Error(responseData.detail || 'Failed to save results');
      }

      console.log('Results saved:', responseData); // Debug log
      showNotification('Results saved successfully', 'success');
      
      // Refresh the participants list to show updated marks
      fetchParticipants();
    } catch (error) {
      console.error('Error saving results:', error);
      // Extract the most meaningful error message
      const errorMessage = error.message || 'Unknown error occurred';
      showNotification(`Error saving results: ${errorMessage}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const downloadResults = () => {
    try {
      const selectedCategoryName = categories.find(c => c.id === selectedCategory)?.name || '';
      const selectedEventName = events.find(e => e.id === selectedEvent)?.name || '';

      const worksheet = XLSX.utils.json_to_sheet(
        participants.map(participant => ({
          'Chest Number': participant.chest_number,
          'Name': participant.name,
          'Category': selectedCategoryName,
          'Event': selectedEventName,
          'Mark 1': marks[participant.id]?.mark1 || 0,
          'Mark 2': marks[participant.id]?.mark2 || 0,
          'Mark 3': marks[participant.id]?.mark3 || 0,
          'Total Marks': participant.totalMarks || 0,
          'Rank': participant.rank || '-'
        }))
      );

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Results');

      // Generate filename with category and event names
      const filename = `Results_${selectedCategoryName}_${selectedEventName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      XLSX.writeFile(workbook, filename);
      showNotification('Results downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading results:', error);
      showNotification('Error downloading results', 'error');
    }
  };

  const showNotification = (message, severity) => {
    setNotification({ open: true, message, severity });
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Results Management
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <FormControl fullWidth>
            <InputLabel>Category</InputLabel>
            <Select
              value={selectedCategory}
              label="Category"
              onChange={handleCategoryChange}
            >
              <MenuItem value="">
                <em>Select a category</em>
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Event</InputLabel>
            <Select
              value={selectedEvent}
              label="Event"
              onChange={handleEventChange}
              disabled={!selectedCategory}
            >
              <MenuItem value="">
                <em>Select an event</em>
              </MenuItem>
              {events.map((event) => (
                <MenuItem key={event.id} value={event.id}>
                  {event.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
            <CircularProgress />
          </Box>
        ) : participants.length > 0 ? (
          <>
            <TableContainer component={Paper} sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Chest Number</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell align="right">Mark 1</TableCell>
                    <TableCell align="right">Mark 2</TableCell>
                    <TableCell align="right">Mark 3</TableCell>
                    <TableCell align="right">Total Marks</TableCell>
                    <TableCell align="right">Rank</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {participants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell>{participant.chest_number}</TableCell>
                      <TableCell>{participant.name}</TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={marks[participant.id]?.mark1 || ''}
                          onChange={(e) => handleMarksChange(participant.id, 'mark1', e.target.value)}
                          size="small"
                          inputProps={{ min: 0, max: 100, step: 0.1 }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={marks[participant.id]?.mark2 || ''}
                          onChange={(e) => handleMarksChange(participant.id, 'mark2', e.target.value)}
                          size="small"
                          inputProps={{ min: 0, max: 100, step: 0.1 }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <TextField
                          type="number"
                          value={marks[participant.id]?.mark3 || ''}
                          onChange={(e) => handleMarksChange(participant.id, 'mark3', e.target.value)}
                          size="small"
                          inputProps={{ min: 0, max: 100, step: 0.1 }}
                          sx={{ width: 100 }}
                        />
                      </TableCell>
                      <TableCell align="right">
                        {participant.totalMarks?.toFixed(2) || '-'}
                      </TableCell>
                      <TableCell align="right">
                        {participant.rank || '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={calculateResults}
                startIcon={<CalculateIcon />}
              >
                Calculate Results
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={saveResults}
                startIcon={<SaveIcon />}
                disabled={!participants.some(p => p.rank)}
              >
                Save Results
              </Button>
              <Button
                variant="contained"
                color="secondary"
                onClick={downloadResults}
                startIcon={<DownloadIcon />}
                disabled={!participants.some(p => p.rank)}
              >
                Download Results
              </Button>
            </Box>
          </>
        ) : (
          selectedCategory && selectedEvent && (
            <Alert severity="info" sx={{ mt: 2 }}>
              No participants found for the selected category and event.
            </Alert>
          )
        )}
      </Paper>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}

export default Results;
