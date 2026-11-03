const { z } = require('zod');

const registerStudentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid institutional email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  department: z.string().min(1, 'Department is required'),
  studentId: z.string().min(3, 'Student ID / Roll number is required'),
  semester: z.coerce.number().min(1).max(8),
  section: z.string().optional().default('A'),
  phone: z.string().optional(),
  batch: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Valid institutional email is required'),
  password: z.string().min(1, 'Password is required'),
});

const createFacultySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Valid institutional email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  department: z.string().min(1, 'Department is required'),
  employeeId: z.string().min(2, 'Employee ID is required'),
  designation: z.string().min(2, 'Designation is required'),
  specialization: z.union([z.string(), z.array(z.string())]).optional(),
  officeRoom: z.string().optional(),
  phone: z.string().optional(),
});

const announcementSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum([
    'Academic',
    'Examination',
    'Event',
    'Urgent',
    'Administrative',
    'Placement',
    'General',
  ]),
  targetAudience: z.enum(['All', 'Students', 'Faculty', 'Department']).default('All'),
  department: z.string().optional(),
  priority: z.enum(['Normal', 'Urgent']).default('Normal'),
  expiresAt: z.string().optional(),
});

const complaintSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(15, 'Description must be at least 15 characters'),
  category: z.enum([
    'Infrastructure',
    'Classroom',
    'Laboratory',
    'Electricity',
    'Internet/Wi-Fi',
    'Cleanliness',
    'Other',
  ]),
  priority: z.enum(['Low', 'Medium', 'High', 'Emergency']).default('Medium'),
  location: z.string().min(2, 'Campus location is required'),
});

const updateComplaintStatusSchema = z.object({
  status: z.enum([
    'Submitted',
    'Under Review',
    'Assigned',
    'In Progress',
    'Resolved',
    'Rejected',
  ]),
  resolutionNotes: z.string().optional(),
  assignedTo: z.string().optional(),
});

const lostFoundSchema = z.object({
  title: z.string().min(3, 'Item title is required'),
  description: z.string().min(10, 'Item description is required'),
  category: z.enum([
    'Electronics',
    'ID & Cards',
    'Books & Stationery',
    'Keys & Wallets',
    'Clothing',
    'Accessories',
    'Other',
  ]),
  reportType: z.enum(['Lost', 'Found']),
  location: z.string().min(2, 'Location is required'),
  dateLostFound: z.string(),
  contactPreference: z.enum(['Email', 'Phone', 'In-Person Admin Desk']).default('Email'),
});

const claimSchema = z.object({
  proofDescription: z.string().min(10, 'Detailed proof or identifying markers required'),
  contactPhone: z.string().optional(),
});

const eventSchema = z.object({
  title: z.string().min(3, 'Event title is required'),
  description: z.string().min(10, 'Event description is required'),
  category: z.enum(['Technical', 'Cultural', 'Sports', 'Workshop', 'Seminar', 'Hackathon']),
  date: z.string(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  venue: z.string().min(2, 'Venue is required'),
  registrationDeadline: z.string(),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1'),
});

const bookingSchema = z.object({
  room: z.string().min(1, 'Room ID is required'),
  purpose: z.string().min(5, 'Purpose must be specified'),
  date: z.string(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Start time must be HH:mm (24hr)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'End time must be HH:mm (24hr)'),
});

module.exports = {
  registerStudentSchema,
  loginSchema,
  createFacultySchema,
  announcementSchema,
  complaintSchema,
  updateComplaintStatusSchema,
  lostFoundSchema,
  claimSchema,
  eventSchema,
  bookingSchema,
};
