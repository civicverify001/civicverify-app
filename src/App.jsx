import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'

// Public pages
import Landing from './pages/public/Landing'
import Login from './pages/public/Login'
import Signup from './pages/public/Signup'

// Layouts
import CitizenLayout from './pages/citizen/CitizenLayout'
import AdminLayout from './pages/admin/AdminLayout'
import OrgLayout from './pages/org/OrgLayout'

// Citizen pages
import CitizenDashboard from './pages/citizen/Dashboard'

// Placeholder pages (will be replaced with real implementations)
import {
  CitizenSurveys, CitizenTakeSurvey, CitizenVerify, CitizenImpact, CitizenAccount,
  AdminDashboard, AdminSurveys, AdminSurveyBuilder, AdminReviewQueue,
  AdminUsers, AdminOrganizations, AdminAnalytics, AdminSettings, AdminExport,
  OrgDashboard, OrgRequestSurvey, OrgMySurveys, OrgResults, OrgBilling, OrgProfile,
  ForgotPassword, Contact, PublicSurvey, PublicResults
} from './pages/Placeholders'

import ProtectedRoute from './components/ProtectedRoute'

// Auto-redirect based on role after login
function AuthRedirect() {
  const { profile, loading } = useAuth()
  if (loading) return null
  if (!profile) return <Navigate to="/login" />
  const routes = { admin: '/admin', citizen: '/citizen', org: '/org' }
  return <Navigate to={routes[profile.role] || '/citizen'} />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/survey/:id" element={<PublicSurvey />} />
          <Route path="/results" element={<PublicResults />} />
          <Route path="/dashboard" element={<AuthRedirect />} />

          {/* Citizen Routes */}
          <Route path="/citizen" element={
            <ProtectedRoute requiredRole="citizen"><CitizenLayout /></ProtectedRoute>
          }>
            <Route index element={<CitizenDashboard />} />
            <Route path="surveys" element={<CitizenSurveys />} />
            <Route path="surveys/:id" element={<CitizenTakeSurvey />} />
            <Route path="verify" element={<CitizenVerify />} />
            <Route path="impact" element={<CitizenImpact />} />
            <Route path="account" element={<CitizenAccount />} />
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="admin"><AdminLayout /></ProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="surveys" element={<AdminSurveys />} />
            <Route path="surveys/new" element={<AdminSurveyBuilder />} />
            <Route path="surveys/:id/edit" element={<AdminSurveyBuilder />} />
            <Route path="review" element={<AdminReviewQueue />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="organizations" element={<AdminOrganizations />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="export" element={<AdminExport />} />
          </Route>

          {/* Organization Routes */}
          <Route path="/org" element={
            <ProtectedRoute requiredRole="org"><OrgLayout /></ProtectedRoute>
          }>
            <Route index element={<OrgDashboard />} />
            <Route path="request" element={<OrgRequestSurvey />} />
            <Route path="surveys" element={<OrgMySurveys />} />
            <Route path="surveys/:id/results" element={<OrgResults />} />
            <Route path="billing" element={<OrgBilling />} />
            <Route path="profile" element={<OrgProfile />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
