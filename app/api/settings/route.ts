import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import { AuthService } from "@/lib/db/services/auth.service";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await AuthService.upsertUser(
      user.id,
      user.email ?? '',
      user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
      user.user_metadata?.company ?? user.user_metadata?.companyName ?? user.user_metadata?.company_name ?? '',
      user.user_metadata?.phone ?? null
    );
    if (!dbUser) {
      return NextResponse.json({ error: "User not found in DB" }, { status: 404 });
    }

    return NextResponse.json({
      fullName: dbUser.fullName,
      email: dbUser.email,
      companyName: dbUser.companyName,
      plan: dbUser.subscription?.plan || 'FREE'
    });
  } catch (error) {
    console.error("[SETTINGS_GET]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await AuthService.upsertUser(
      user.id,
      user.email ?? '',
      user.user_metadata?.full_name ?? user.user_metadata?.name ?? '',
      user.user_metadata?.company ?? user.user_metadata?.companyName ?? user.user_metadata?.company_name ?? '',
      user.user_metadata?.phone ?? null
    );
    if (!dbUser) {
      return NextResponse.json({ error: "User not found in DB" }, { status: 404 });
    }

    const body = await request.json();
    const { fullName, email, companyName } = body;

    // Update Supabase auth metadata to keep it in sync with DB
    await supabase.auth.updateUser({
      data: {
        full_name: fullName !== undefined ? fullName : user.user_metadata?.full_name,
        company: companyName !== undefined ? companyName : user.user_metadata?.company,
      }
    });

    const updatedUser = await prisma.user.update({
      where: {
        id: dbUser.id
      },
      data: {
        fullName: fullName !== undefined ? fullName : dbUser.fullName,
        email: email !== undefined ? email : dbUser.email,
        companyName: companyName !== undefined ? companyName : dbUser.companyName,
      }
    });

    return NextResponse.json({
      fullName: updatedUser.fullName,
      email: updatedUser.email,
      companyName: updatedUser.companyName
    });
  } catch (error) {
    console.error("[SETTINGS_PATCH]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
