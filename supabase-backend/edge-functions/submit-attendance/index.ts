import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.5'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 405,
    })
  }

  try {
    const { site_id } = await req.json()

    if (!site_id) {
      return new Response(JSON.stringify({ error: 'Missing site_id in request body' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    })

    // Option 1: Insert directly using the service role key
    const { data, error } = await supabase.from('attendance').insert([
      { site_id: site_id, user_id: 'some_user_id', check_in_time: new Date().toISOString() }, // Replace 'some_user_id' with actual user ID
    ])

    // Option 2: Call an RPC function (e.g., submit_attendance)
    // const { data, error } = await supabase.rpc('submit_attendance', { p_site_id: site_id });

    if (error) {
      console.error('Supabase error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    return new Response(JSON.stringify({ success: true, data: data }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    console.error('Edge Function error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})