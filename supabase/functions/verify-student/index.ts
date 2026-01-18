import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate API key
    const { data: keyData, error: keyError } = await supabase
      .from('student_api_keys')
      .select('api_key, is_active')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .maybeSingle();

    if (keyError || !keyData) {
      console.log('Invalid API key:', keyError?.message);
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch student details from external API
    console.log('Fetching student details from external API...');
    const externalResponse = await fetch(
      `https://tssplatform.onrender.com/getStudentByEmail?email=${encodeURIComponent(email)}`
    );

    if (!externalResponse.ok) {
      console.log('External API returned error:', externalResponse.status);
      return new Response(
        JSON.stringify({ error: 'Student not found in external system' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const studentData = await externalResponse.json();
    console.log('External student data:', JSON.stringify(studentData));

    if (!studentData || !studentData.email) {
      return new Response(
        JSON.stringify({ error: 'Invalid student data from external system' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user already exists
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    let userId: string;
    let tempPassword: string | null = null;

    if (existingUser) {
      console.log('User already exists:', existingUser.id);
      userId = existingUser.id;
    } else {
      // Generate a temporary password for new users
      tempPassword = `TSS_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      
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

      // Create student record
      const { error: studentError } = await supabase.from('students').insert({
        user_id: userId,
        student_id: studentData.studentId || studentData.student_id || `STU_${Date.now()}`,
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

    // Generate a magic link or sign in the user
    // Since we need to auto-login, we'll generate a sign-in token
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
        hashed_token: signInData.properties?.hashed_token,
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
