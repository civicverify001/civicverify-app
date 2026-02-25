import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'

// Public pages
import Landing from './pages/public/Landing' import Contact from './pages/public/Contact'
import Login from './pages/public/Login'
import Signup from './pages/public/Signup'
import About from './pages/public/About'
import Privacy from './pages/public/Privacy'
import Terms from './pages/public/Terms'

// Layouts
import CitizenLayout from './pages/citizen/CitizenLayout'
import AdminLayout from './pages/admin/AdminLayout'
import OrgLayout from './pages/org/OrgLayout'

// Citizen pages
import CitizenDashboard from './pages/citizen/Dashboard'
import CitizenSurveys from './pages/citizen/Surveys'
import CitizenTakeSurvey from './pages/citizen/TakeSurvey'
import CitizenVerify from './pages/citizen/Verify'
import CitizenImpact from './pages/citizen/Impact'
import CitizenAccount from './pages/citizen/Account'
import CitizenCommunity from './pages/citizen/Community'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import AdminSurveys from './pages/admin/Surveys'
import AdminSurveyBuilder from './pages/admin/SurveyBuilder'
import AdminReviewQueue from './pages/admin/ReviewQueue'
import AdminUsers from './pages/admin/Users'
import AdminAnalytics from './pages/admin/Analytics'
import AdminExport from './pages/admin/Export'
import OrgReview from './pages/admin/OrgReview'

// Org pages
import OrgDashboard from './pages/org/Dashboard'
import OrgRequestSurvey from './pages/org/RequestSurvey'
import OrgMySurveys from './pages/org/MySurveys'
import OrgResults from './pages/org/Results'

// Remaining placeholders
import {
  AdminOrganizations, AdminSettings,
  ForgotPassword, Contact, PublicSurvey, PublicResults
} from './pages/Placeholders'

import OrgBilling from './pages/org/Billing'
import OrgProfile from './pages/org/Profile'
import ProtectedRoute from './components/ProtectedRoute'

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
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/survey/:id" element={<PublicSurvey />} />
          <Route path="/results" element={<PublicResults />} />
          <Route path="/dashboard" element={<AuthRedirect />} />

          <Route path="/citizen" element={
            <ProtectedRoute requiredRole="citizen"><CitizenLayout /></ProtectedRoute>
          }>
            <Route index element={<CitizenDashboard />} />
            <Route path="surveys" element={<CitizenSurveys />} />
            <Route path="surveys/:id" element={<CitizenTakeSurvey />} />
            <Route path="verify" element={<CitizenVerify />} />
            <Route path="impact" element={<CitizenImpact />} />
            <Route path="account" element={<CitizenAccount />} />
            <Route path="community" element={<CitizenCommunity />} />
          </Route>

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
            <Route path="org-review" element={<OrgReview />} />
          </Route>

          <Route path="/org" element={
            <ProtectedRoute requiredRole="org"><OrgLayout /></ProtectedRoute>
          }>
            <Route index element={<OrgDashboard />} />
            <Route path="request" element={<OrgRequestSurvey />} />
            <Route path="surveys" element={<OrgMySurveys />} />
            <Route path="results/:id" element={<OrgResults />} />
            <Route path="billing" element={<OrgBilling />} />
            <Route path="profile" element={<OrgProfile />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
