import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { full_name, email, role, team_id, title, password } = body;

    if (!email || !full_name || !role) {
      return NextResponse.json({ error: 'Missing required fields: email, full_name, role' }, { status: 400 });
    }

    const initialPassword = password?.trim() || 'Seds@2026';
    const admin = getSupabaseAdmin();
    const cleanEmail = email.toLowerCase().trim();

    let authUserId: string | null = null;

    // 1. Create or link user in Supabase Auth with pre-confirmed email & initial password
    const createRes = await admin.auth.admin.createUser({
      email: cleanEmail,
      password: initialPassword,
      email_confirm: true,
      user_metadata: { full_name, role },
    });

    if (createRes.data?.user) {
      authUserId = createRes.data.user.id;
    } else if (createRes.error) {
      // Check if user already exists in auth.users
      const errMsg = createRes.error.message.toLowerCase();
      if (errMsg.includes('already') || createRes.error.status === 422) {
        const { data: listData } = await admin.auth.admin.listUsers();
        const existing = listData?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
        if (existing) {
          authUserId = existing.id;
          // Update password & metadata for existing account
          await admin.auth.admin.updateUserById(authUserId, {
            password: initialPassword,
            email_confirm: true,
            user_metadata: { full_name, role },
          });
        } else {
          return NextResponse.json({ error: createRes.error.message }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: createRes.error.message }, { status: 400 });
      }
    }

    if (!authUserId) {
      return NextResponse.json({ error: 'Failed to establish user account' }, { status: 500 });
    }

    // 2. Upsert Profile in public.profiles
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: authUserId,
        email: cleanEmail,
        full_name: full_name.trim(),
        role,
        team_id: team_id || null,
        title: title?.trim() || (role === 'TEAM_LEAD' ? 'Team Lead' : 'SEDS Member'),
        account_status: 'ACTIVE',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // 3. Upsert Team Member if team is assigned
    if (team_id) {
      await admin.from('team_members').upsert({
        user_id: authUserId,
        team_id,
        membership_role: role,
      });
    }

    return NextResponse.json({ 
      success: true, 
      user: profile,
      temporary_password: initialPassword 
    });
  } catch (err: any) {
    console.error('Admin create user error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
