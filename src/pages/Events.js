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
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  Box,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';

const API_URL = 'http://localhost:8000';

function Events() {
  const [open, setOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchEvents(selectedCategory || null);
  }, [selectedCategory]);

  const fetchEvents = async (categoryId = null) => {
    try {
      const url = categoryId 
        ? `${API_URL}/events/?category_id=${categoryId}`
        : `${API_URL}/events/`;
      const response = await fetch(url);
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

  const handleOpen = (event = null) => {
    setEditingEvent(event);
    setOpen(true);
  };

  const handleClose = () => {
    setEditingEvent(null);
    setOpen(false);
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const eventData = {
      name: formData.get('name'),
      category_id: parseInt(formData.get('category_id')),
      date: formData.get('date'),
      venue: formData.get('venue'),
    };

    try {
      const url = editingEvent
        ? `${API_URL}/events/${editingEvent.id}`
        : `${API_URL}/events/`;
      
      const response = await fetch(url, {
        method: editingEvent ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to save event');
      }

      await response.json();

      setSnackbar({
        open: true,
        message: `Event ${editingEvent ? 'updated' : 'created'} successfully`,
        severity: 'success'
      });
      
      handleClose();
      fetchEvents(selectedCategory || null);
    } catch (error) {
      console.error('Error saving event:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error saving event',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const response = await fetch(`${API_URL}/events/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to delete event');
      }

      setSnackbar({
        open: true,
        message: 'Event deleted successfully',
        severity: 'success'
      });
      
      fetchEvents(selectedCategory || null);
    } catch (error) {
      console.error('Error deleting event:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Error deleting event',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCategoryFilterChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : '';
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <Typography variant="h4">Events</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => handleOpen()}
        >
          Add Event
        </Button>
      </div>

      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <FilterIcon color="action" />
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="category-filter-label">Filter by Category</InputLabel>
          <Select
            labelId="category-filter-label"
            value={selectedCategory}
            onChange={handleCategoryFilterChange}
            label="Filter by Category"
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
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Venue</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{event.name}</TableCell>
                <TableCell>{getCategoryName(event.category_id)}</TableCell>
                <TableCell>{event.date}</TableCell>
                <TableCell>{event.venue}</TableCell>
                <TableCell>
                  <IconButton onClick={() => handleOpen(event)} color="primary">
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(event.id)} color="error">
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  No events found {selectedCategory && 'for the selected category'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose}>
        <form onSubmit={handleSave}>
          <DialogTitle>
            {editingEvent ? 'Edit Event' : 'Add Event'}
          </DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="name"
              label="Event Name"
              type="text"
              fullWidth
              defaultValue={editingEvent?.name || ''}
              required
            />
            <TextField
              select
              margin="dense"
              name="category_id"
              label="Category"
              fullWidth
              defaultValue={editingEvent?.category_id || ''}
              required
              helperText="Select a category for the event"
            >
              <MenuItem value="" disabled>
                Select a category
              </MenuItem>
              {categories.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name} ({category.min_age}-{category.max_age} years)
                </MenuItem>
              ))}
            </TextField>
            <TextField
              margin="dense"
              name="date"
              label="Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              defaultValue={editingEvent?.date || new Date().toISOString().split('T')[0]}
              required
            />
            <TextField
              margin="dense"
              name="venue"
              label="Venue"
              type="text"
              fullWidth
              defaultValue={editingEvent?.venue || ''}
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

export default Events;
