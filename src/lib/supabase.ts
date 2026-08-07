import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xewmxjrlimpmlfhekqmb.supabase.co'
const supabaseAnonKey = 'sb_publishable_l9Id5uqUeqe4FXFZ84Yymw_Pz7O8xub'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
