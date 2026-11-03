import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/layout/DashboardLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import AnnouncementsPage from './pages/announcements/AnnouncementsPage';
import ComplaintsPage from './pages/complaints/ComplaintsPage';
import LostFoundPage from './pages/lostfound/LostFoundPage';
import EventsPage from './pages/events/EventsPage';
import BookingsPage from './pages/bookings/BookingsPage';
import IdentityPage from './pages/identity/IdentityPage';
import StudentDirectoryPage from './pages/users/StudentDirectoryPage';
import FacultyDirectoryPage from './pages/users/FacultyDirectoryPage';
import GateScannerPage from './pages/identity/GateScannerPage';
import TimetablePage from './pages/timetable/TimetablePage';
import DateSheetPage from './pages/datesheet/DateSheetPage';
import SubjectsPage from './pages/subjects/SubjectsPage';

export default function App() {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected Routes inside DashboardLayout */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/timetable" element={<TimetablePage />} />
          <Route path="/subjects" element={<SubjectsPage />} />
          <Route path="/datesheets" element={<DateSheetPage />} />
          <Route path="/announcements" element={<AnnouncementsPage />} />
          <Route path="/complaints" element={<ComplaintsPage />} />
          <Route path="/lost-found" element={<LostFoundPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/bookings" element={<BookingsPage />} />
          <Route path="/identity" element={<IdentityPage />} />

          {/* Role-Restricted Routes (Faculty & Admin) */}
          <Route element={<ProtectedRoute allowedRoles={['admin', 'faculty']} />}>
            <Route path="/students" element={<StudentDirectoryPage />} />
            <Route path="/faculty" element={<FacultyDirectoryPage />} />
            <Route path="/verify-gate" element={<GateScannerPage />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
