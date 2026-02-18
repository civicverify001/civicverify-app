import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jfdrpaumemdzkipbbptm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmZHJwYXVtZW1kemtpcGJicHRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzODc2MzQsImV4cCI6MjA4Njk2MzYzNH0.VF4rCdA2EqB1JH5_hvSH59jW2a2oIxT4tI_mutSUkHk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)