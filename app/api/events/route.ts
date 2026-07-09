import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabaseServer";

export async function POST(request: Request) {
  const auth = await requireUser(request);
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const { supabase, user } = auth;

  const { eventType, metadata } = await request.json();

  if (!eventType || typeof eventType !== "string") {
    return NextResponse.json({ error: "no eventType" }, { status: 400 });
  }

  const { error } = await supabase
    .from("events")
    .insert({ user_id: user.id, event_type: eventType, metadata: metadata ?? null });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
