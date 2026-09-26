import { createClient } from '@supabase/supabase-js'

const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof process !== 'undefined' ? process.env : {})
const url = env.VITE_SUPABASE_URL as string | undefined
const anonKey = env.VITE_SUPABASE_ANON_KEY as string | undefined

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
  global: {
    fetch: (inputUrl, options) => {
      const normalizedUrl = typeof inputUrl === 'string' ? inputUrl.replace('/rest/v1/', '/') : inputUrl
      return fetch(normalizedUrl, options)
    },
  },
})
