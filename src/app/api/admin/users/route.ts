import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const supabaseServer = await createServerSupabaseClient();
    
    // Check caller authentication and admin role
    if (supabaseServer) {
      const { data: { session } } = await supabaseServer.auth.getSession();
      if (!session) {
        return NextResponse.json({ error: 'Unauthorized: Session required' }, { status: 401 });
      }

      const { data: profile } = await supabaseServer
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
      }
    }

    const body = await req.json();
    const { full_name, email, role, team_id, title } = body;

    if (!email || !full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields: email, full_name, role' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();

    // Invite user via email (or create user if invitation fails / local setup)
    let authUserId: string;
    
    const inviteRes = await admin.auth.admin.inviteUserByEmail(email, {
      data: { full_name, role },
    });

    if (inviteRes.error) {
      // Fallback: create user directly with auto-generated secure credentials
      const createRes = await admin.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { full_name, role },
      });

      if (createRes.error) {
        return NextResponse.json({ error: createRes.error.message }, { status: 400 });
      }
      authUserId = createRes.data.user.id;
    } else {
      authUserId = inviteRes.data.user.id;
    }

    // Upsert Profile
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: authUserId,
        email: email.toLowerCase(),
        full_name,
        role,
        team_id: team_id || null,
        title: title || 'SEDS Member',
        account_status: 'ACTIVE',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // Upsert Team Member if team assigned
    if (team_id) {
      await admin.from('team_members').upsert({
        user_id: authUserId,
        team_id,
        membership_role: role,
      });
    }

    return NextResponse.json({ success: true, user: profile });
  } catch (err: any) {
    console.error('Admin create user error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
