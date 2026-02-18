import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jfdrpaumemdzkipbbptm.supabase.co'
const supabaseAnonKey = 'sb_publishable_Bn4MC4QMSYETCwj7F3fN2A_B16XUcXv'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
