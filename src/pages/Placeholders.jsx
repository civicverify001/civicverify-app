// Placeholder pages - we'll build these out fully next
import { COLORS } from '../utils/constants'

function Placeholder({ title, description }) {
  return (
    <div>
      <h1 style={{ fontFamily: "'Libre Baskerville', serif", fontSize: 26, color: COLORS.navy, marginBottom: 6 }}>{title}</h1>
      <p style={{ color: COLORS.gray, fontSize: 14, marginBottom: 28 }}>{description}</p>
      <div style={{ background: '#fff', borderRadius: 12, padding: 40, textAlign: 'center', color: COLORS.gray, border: `1px dashed ${COLORS.grayLight}` }}>
        Coming soon — this page is under construction.
      </div>
    </div>
  )
}

// Citizen pages
export function CitizenSurveys() { return <Placeholder title="Available Surveys" description="Surveys matching your profile that need your voice." /> }
export function CitizenTakeSurvey() { return <Placeholder title="Take Survey" description="Answer questions and make your voice count." /> }
export function CitizenVerify() { return <Placeholder title="Verify Your Identity" description="Quick ID verification to unlock survey access." /> }
export function CitizenImpact() { return <Placeholder title="Your Impact" description="See how your responses are making a difference." /> }
export function CitizenAccount() { return <Placeholder title="Account Settings" description="Manage your profile and preferences." /> }

// Admin pages
export function AdminDashboard() { return <Placeholder title="Admin Dashboard" description="Platform overview and key metrics." /> }
export function AdminSurveys() { return <Placeholder title="Survey Management" description="Create, edit, and manage all surveys." /> }
export function AdminSurveyBuilder() { return <Placeholder title="Survey Builder" description="Build a new survey." /> }
export function AdminReviewQueue() { return <Placeholder title="Review Queue" description="Pending survey submissions from organizations." /> }
export function AdminUsers() { return <Placeholder title="User Management" description="View and manage all platform users." /> }
export function AdminOrganizations() { return <Placeholder title="Organizations" description="Manage organization accounts and tiers." /> }
export function AdminAnalytics() { return <Placeholder title="Analytics" description="Platform analytics and trends." /> }
export function AdminSettings() { return <Placeholder title="Settings" description="Platform configuration." /> }
export function AdminExport() { return <Placeholder title="Export Data" description="Download platform data as CSV or PDF." /> }

// Org pages
export function OrgDashboard() { return <Placeholder title="Organization Dashboard" description="Your survey activity and results." /> }
export function OrgRequestSurvey() { return <Placeholder title="Request a Survey" description="Submit a new survey for review." /> }
export function OrgMySurveys() { return <Placeholder title="My Surveys" description="View your active and past surveys." /> }
export function OrgResults() { return <Placeholder title="Survey Results" description="Aggregated results and insights." /> }
export function OrgBilling() { return <Placeholder title="Billing" description="Payment history and invoices." /> }
export function OrgProfile() { return <Placeholder title="Organization Profile" description="Manage your organization details." /> }

// Public pages
export function ForgotPassword() { return <Placeholder title="Reset Password" description="Enter your email to receive a reset link." /> }
export function Contact() { return <Placeholder title="Contact Us" description="Get in touch or request a demo." /> }
export function PublicSurvey() { return <Placeholder title="Survey Discussion" description="Public debate on this survey topic." /> }
export function PublicResults() { return <Placeholder title="Published Results" description="Transparent, anonymized survey results." /> }
