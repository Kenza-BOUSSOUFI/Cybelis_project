import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/db/prisma';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    const body = await request.json();
    const { subject, message, fullName, email } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'Le sujet et le message sont requis.' }, { status: 400 });
    }

    const senderEmail = email || user?.email || 'anonyme@cybelis.ma';
    const senderName = fullName || user?.user_metadata?.full_name || 'Utilisateur Cybelis';

    const contactMsg = await prisma.contactMessage.create({
      data: {
        fullName: senderName,
        email: senderEmail,
        subject,
        message,
      },
    });

    return NextResponse.json({ success: true, data: contactMsg });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Une erreur est survenue lors de l\'envoi du message.' },
      { status: 500 }
    );
  }
}
