import React, { useState, useEffect } from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  MenuItem,
  Box,
  FormControl,
  InputLabel,
  Select,
  Snackbar,
  Alert,
  FormHelperText,
  ListSubheader,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

function Participants() {
  const [open, setOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedEvent, setSelectedEvent] = useState('');
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchCategories();
    fetchEvents();
    fetchParticipants();
  }, []);

  const fetchParticipants = async () => {
    try {
      const response = await fetch(`${API_URL}/participants/`);
      if (!response.ok) {
        throw new Error('Failed to fetch participants');
      }
      const data = await response.json();
      console.log('Fetched participants:', data); // Debug log
      setParticipants(data);
    } catch (error) {
      console.error('Error fetching participants:', error);
      setSnackbar({
        open: true,
        message: 'Error loading participants',
        severity: 'error'
      });
    }
  };

  const fetchEvents = async () => {
    try {
      const response = await fetch(`${API_URL}/events/`);
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      setSnackbar({
        open: true,
        message: 'Error loading events',
        severity: 'error'
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories/`);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setSnackbar({
        open: true,
        message: 'Error loading categories',
        severity: 'error'
      });
    }
  };

  const handleOpen = (participant = null) => {
    setEditingParticipant(participant);
    setFormErrors({});
    if (participant) {
      setSelectedEvents(participant.events.map(e => e.id));
    } else {
      setSelectedEvents([]);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setEditingParticipant(null);
    setFormErrors({});
    setSelectedEvents([]);
    setOpen(false);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
    setSelectedEvents([]);
  };

  const handleEventChange = (event) => {
    setSelectedEvent(event.target.value);
  };

  const validateForm = (formData) => {
    const errors = {};
    const age = parseInt(formData.get('age'));
    const selectedCategoryId = parseInt(formData.get('category_id'));
    const category = categories.find(c => c.id === selectedCategoryId);
    
    if (category && (age < category.min_age || age > category.max_age)) {
      errors.age = `Age must be between ${category.min_age} and ${category.max_age} for this category`;
    }

    const chestNumber = formData.get('chest_number');
    const existingParticipant = participants.find(
      p => p.chest_number === chestNumber && p.id !== editingParticipant?.id
    );
    if (existingParticipant) {
      errors.chest_number = 'This chest number is already in use';
    }

    return errors;
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    // Validate form
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const participantData = {
      name: formData.get('name'),
      age: parseInt(formData.get('age')),
      sex: formData.get('sex'),
      chest_number: formData.get('chest_number'),
      church: formData.get('church'),
      district: formData.get('district'),
      region: formData.get('region'),
      state: formData.get('state'),
      category_id: parseInt(formData.get('category_id')),
      event_ids: selectedEvents
    };

    try {
      const url = editingParticipant
        ? `${API_URL}/participants/${editingParticipant.id}`
        : `${API_URL}/participants/`;
      
      const response = await fetch(url, {
        method: editingParticipant ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(participantData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save participant');
      }

      await response.json();

      setSnackbar({
        open: true,
        message: `Participant ${editingParticipant ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
      
      handleClose();
      fetchParticipants();
    } catch (error) {
      console.error('Error saving participant:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error saving participant',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this participant?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/participants/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete participant');
      }

      setSnackbar({
        open: true,
        message: 'Participant deleted successfully',
        severity: 'success'
      });
      
      fetchParticipants();
    } catch (error) {
      console.error('Error deleting participant:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error deleting participant',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const getEventName = (eventId) => {
    const event = events.find(e => e.id === eventId);
    return event ? event.name : '';
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? category.name : '';
  };

  const filteredEvents = events.filter(event => 
    !selectedCategory || event.category_id === parseInt(selectedCategory)
  );

  const filteredParticipants = participants.filter(participant => {
    if (selectedCategory && selectedEvent) {
      return participant.events.some(e => e.category_id === parseInt(selectedCategory)) &&
             participant.events.some(e => e.id === parseInt(selectedEvent));
    } else if (selectedCategory) {
      return participant.events.some(e => e.category_id === parseInt(selectedCategory));
    } else if (selectedEvent) {
      return participant.events.some(e => e.id === parseInt(selectedEvent));
    }
    return true;
  });

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Typography variant="h4">Participants</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Participant
        </Button>
      </div>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <FilterIcon color="action" />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Category</InputLabel>
          <Select
            value={selectedCategory}
            label="Filter by Category"
            onChange={handleCategoryChange}
          >
            <MenuItem value="">
              <em>All Categories</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>Filter by Event</InputLabel>
          <Select
            value={selectedEvent}
            label="Filter by Event"
            onChange={handleEventChange}
          >
            <MenuItem value="">
              <em>All Events</em>
            </MenuItem>
            {filteredEvents.map((event) => (
              <MenuItem key={event.id} value={event.id}>
                {event.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Chest No</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Age</TableCell>
              <TableCell>Sex</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Events</TableCell>
              <TableCell>Church</TableCell>
              <TableCell>District</TableCell>
              <TableCell>Region</TableCell>
              <TableCell>State</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredParticipants.map((participant) => (
              <TableRow key={participant.id}>
                <TableCell>{participant.chest_number}</TableCell>
                <TableCell>{participant.name}</TableCell>
                <TableCell>{participant.age}</TableCell>
                <TableCell>{participant.sex}</TableCell>
                <TableCell>{getCategoryName(participant.category_id) || 'N/A'}</TableCell>
                <TableCell>
                  {participant.events?.map(event => event.name).join(', ') || 'No events'}
                </TableCell>
                <TableCell>{participant.church}</TableCell>
                <TableCell>{participant.district}</TableCell>
                <TableCell>{participant.region}</TableCell>
                <TableCell>{participant.state}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(participant)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(participant.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {filteredParticipants.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} align="center">
                  No participants found {(selectedCategory || selectedEvent) && 'for the selected filters'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <form onSubmit={handleSave}>
          <DialogTitle>
            {editingParticipant ? 'Edit Participant' : 'Add Participant'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Participant Name"
              type="text"
              fullWidth
              defaultValue={editingParticipant?.name || ''}
              required
            />
            <FormControl
              fullWidth
              margin="dense"
              required
            >
              <InputLabel>Category</InputLabel>
              <Select
                name="category_id"
                label="Category"
                defaultValue={editingParticipant?.category_id || ''}
                onChange={handleCategoryChange}
              >
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name} (Age: {category.min_age}-{category.max_age})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              margin="dense"
              name="age"
              label="Age"
              type="number"
              fullWidth
              defaultValue={editingParticipant?.age || ''}
              required
              error={!!formErrors.age}
              helperText={formErrors.age}
              InputProps={{ inputProps: { min: 0 } }}
            />
            <TextField
              select
              margin="dense"
              name="sex"
              label="Sex"
              fullWidth
              defaultValue={editingParticipant?.sex || ''}
              required
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </TextField>
            <FormControl
              fullWidth
              margin="dense"
              required
            >
              <InputLabel>Events</InputLabel>
              <Select
                name="event_ids"
                label="Events"
                multiple
                value={selectedEvents}
                onChange={(e) => setSelectedEvents(e.target.value)}
                defaultValue={editingParticipant?.events?.map(e => e.id) || []}
                renderValue={(selected) => (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((value) => {
                      const event = events.find(e => e.id === value);
                      return (
                        <span key={value} style={{ marginRight: '8px' }}>
                          {event?.name}
                        </span>
                      );
                    })}
                  </Box>
                )}
              >
                {categories.map(category => [
                  <ListSubheader key={`cat-${category.id}`}>
                    {category.name} (Age: {category.min_age}-{category.max_age})
                  </ListSubheader>,
                  events
                    .filter(event => event.category_id === category.id)
                    .map(event => (
                      <MenuItem key={event.id} value={event.id}>
                        {event.name}
                      </MenuItem>
                    ))
                ])}
              </Select>
              <FormHelperText>You can select multiple events</FormHelperText>
            </FormControl>
            <TextField
              margin="dense"
              name="chest_number"
              label="Chest Number"
              type="text"
              fullWidth
              defaultValue={editingParticipant?.chest_number || ''}
              required
              error={!!formErrors.chest_number}
              helperText={formErrors.chest_number}
            />
            <TextField
              margin="dense"
              name="church"
              label="Church"
              type="text"
              fullWidth
              defaultValue={editingParticipant?.church || ''}
              required
            />
            <TextField
              margin="dense"
              name="district"
              label="District"
              type="text"
              fullWidth
              defaultValue={editingParticipant?.district || ''}
              required
            />
            <TextField
              margin="dense"
              name="region"
              label="Region"
              type="text"
              fullWidth
              defaultValue={editingParticipant?.region || ''}
              required
            />
            <TextField
              margin="dense"
              name="state"
              label="State"
              type="text"
              fullWidth
              defaultValue={editingParticipant?.state || ''}
              required
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Save
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
}

export default Participants;
