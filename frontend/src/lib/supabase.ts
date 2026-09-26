import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

if (!url || !anonKey) {
  // Fail loud in dev rather than silently rendering an empty screen on stage.
  // eslint-disable-next-line no-console
  console.error(
    'Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill in your project values.'
  )
}

export const supabase = createClient(url ?? '', anonKey ?? '', {
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})
