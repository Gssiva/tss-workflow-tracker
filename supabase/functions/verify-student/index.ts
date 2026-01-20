import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VALID_API_KEY = 'APIKEY-TSS-STUDENT-TRACKER-9f8a7b6c5d4e';

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { apiKey, email } = await req.json();

    console.log('Verifying student with email:', email);

    if (!apiKey || !email) {
      return new Response(
        JSON.stringify({ error: 'API key and email are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate API key
    if (apiKey !== VALID_API_KEY) {
      console.log('Invalid API key provided');
      return new Response(
        JSON.stringify({ error: 'Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch student details from external API (POST request with body)
    console.log('Fetching student details from external API...');
    const externalResponse = await fetch('https://tssplatform.onrender.com/getStudentByEmail', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!externalResponse.ok) {
      console.log('External API returned error:', externalResponse.status);
      return new Response(
        JSON.stringify({ error: 'Student not found in TSS platform. Please ensure you are registered.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const studentData = await externalResponse.json();
    console.log('External student data:', JSON.stringify(studentData));

    if (!studentData || !studentData.email) {
      return new Response(
        JSON.stringify({ error: 'Invalid student data from TSS platform' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;

    if (existingUser) {
      console.log('User already exists:', existingUser.id);
      userId = existingUser.id;
    } else {
      // Generate a temporary password for new users
      const tempPassword = `TSS_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
      console.log('Creating new user...');
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: studentData.name || studentData.fullName || email.split('@')[0],
        },
      });

      if (createError || !newUser.user) {
        console.log('Failed to create user:', createError?.message);
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      userId = newUser.user.id;

      // Create profile
      await supabase.from('profiles').upsert({
        id: userId,
        email: email,
        full_name: studentData.name || studentData.fullName || email.split('@')[0],
      });

      // Create student record with external studentId
      const { error: studentError } = await supabase.from('students').insert({
        user_id: userId,
        student_id: studentData._id || studentData.studentId || `STU_${Date.now()}`,
        batch: studentData.batch || null,
        course: studentData.course || null,
        phone: studentData.phone || null,
        is_profile_complete: true,
      });

      if (studentError) {
        console.log('Failed to create student record:', studentError.message);
      }

      // Assign student role
      const { error: roleError } = await supabase.from('user_roles').insert({
        user_id: userId,
        role: 'student',
      });

      if (roleError) {
        console.log('Failed to assign role:', roleError.message);
      }
    }

    // Generate a magic link for auto-login
    const { data: signInData, error: signInError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: `${req.headers.get('origin') || 'https://id-preview--5750585f-c59d-467c-8d48-5283febe265a.lovable.app'}/student`,
      },
    });

    if (signInError) {
      console.log('Failed to generate magic link:', signInError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to generate login link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully verified student, returning magic link');

    return new Response(
      JSON.stringify({
        success: true,
        userId,
        email,
        studentData,
        magicLink: signInData.properties?.action_link,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error in verify-student function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
