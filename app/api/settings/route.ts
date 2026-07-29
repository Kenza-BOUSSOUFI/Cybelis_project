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
      user.user_metadata?.company_name ?? ''
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
      user.user_metadata?.company_name ?? ''
    );
    if (!dbUser) {
      return NextResponse.json({ error: "User not found in DB" }, { status: 404 });
    }

    const body = await request.json();
    const { fullName, email, companyName } = body;

    // Optional: If email is changed, it should probably be updated in Supabase auth as well.
    // For now, we update the Prisma user profile.
    const updatedUser = await prisma.user.update({
      where: {
        id: dbUser.id
      },
      data: {
        fullName: fullName || dbUser.fullName,
        email: email || dbUser.email,
        companyName: companyName || dbUser.companyName,
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
