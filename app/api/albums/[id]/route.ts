import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name } = await request.json();

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "no name" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("albums")
    .update({ name })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error: unlinkError } = await supabase
    .from("screenshots")
    .update({ album_id: null })
    .eq("album_id", id);

  if (unlinkError) {
    return NextResponse.json({ error: unlinkError.message }, { status: 500 });
  }

  const { error: deleteError } = await supabase
    .from("albums")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}