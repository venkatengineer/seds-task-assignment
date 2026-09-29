import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

async function verifyAdminCaller(req: NextRequest): Promise<{ authorized: boolean; error?: string; status?: number }> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://liwxpqmpofjrlvggzhrk.supabase.co';
    const supabaseAnonKey = 
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
      'sb_publishable_M8J1Q_19BC80MSskMjdZGg_WPM_b9HR';

    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll() {},
      },
    });

    let callerUser = null;
    if (bearerToken) {
      const { data: { user }, error: userErr } = await supabase.auth.getUser(bearerToken);
      if (!userErr && user) callerUser = user;
    }

    if (!callerUser) {
      const { data: { user } } = await supabase.auth.getUser();
      callerUser = user;
    }

    if (!callerUser) {
      return { authorized: false, error: 'Unauthorized: Authentication required.', status: 401 };
    }

    const admin = getSupabaseAdmin();
    const { data: callerProfile, error: profileErr } = await admin
      .from('profiles')
      .select('role, account_status')
      .eq('id', callerUser.id)
      .single();

    if (profileErr || !callerProfile || callerProfile.account_status === 'SUSPENDED' || callerProfile.role !== 'ADMIN') {
      return { authorized: false, error: 'Forbidden: Platform Administrator privileges required.', status: 403 };
    }

    return { authorized: true };
  } catch (err: any) {
    return { authorized: false, error: 'Authentication verification failed: ' + (err.message || 'Unknown error'), status: 401 };
  }
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = await verifyAdminCaller(req);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

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

    // 2. Upsert Profile in public.profiles (Admins are org-wide, team_id is null)
    const effectiveTeamId = role === 'ADMIN' ? null : (team_id || null);
    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: authUserId,
        email: cleanEmail,
        full_name: full_name.trim(),
        role,
        team_id: effectiveTeamId,
        title: title?.trim() || (role === 'ADMIN' ? 'Platform Administrator' : (role === 'TEAM_LEAD' ? 'Team Lead' : 'SEDS Member')),
        account_status: 'ACTIVE',
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // 3. Upsert Team Member only if team is assigned and role is not ADMIN
    if (effectiveTeamId && role !== 'ADMIN') {
      await admin.from('team_members').upsert({
        user_id: authUserId,
        team_id: effectiveTeamId,
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

// Reset member password to Seds@2026
export async function PATCH(req: NextRequest) {
  try {
    const authCheck = await verifyAdminCaller(req);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 401 });
    }

    const body = await req.json();
    const { user_id, password } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'Missing required user_id' }, { status: 400 });
    }

    const resetPassword = password?.trim() || 'Seds@2026';
    const admin = getSupabaseAdmin();

    const { error: updateError } = await admin.auth.admin.updateUserById(user_id, {
      password: resetPassword,
      email_confirm: true,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Password has been reset to ${resetPassword}`,
      password: resetPassword,
    });
  } catch (err: any) {
    console.error('Admin reset password error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
