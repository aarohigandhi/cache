import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  const { name } = await request.json();

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "no name" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("albums")
    .insert({ name })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function GET() {
  const { data, error } = await supabase
    .from("albums")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
