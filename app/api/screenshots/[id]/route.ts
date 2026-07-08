import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: screenshot, error: fetchError } = await supabase
    .from("screenshots")
    .select("file_url")
    .eq("id", id)
    .single();

  if (fetchError || !screenshot) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const storagePath = screenshot.file_url.split("/screenshots/").pop();
  if (storagePath) {
    await supabase.storage.from("screenshots").remove([storagePath]);
  }

  const { error: deleteError } = await supabase
    .from("screenshots")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { albumId } = await request.json();

  const { data, error } = await supabase
    .from("screenshots")
    .update({ album_id: albumId || null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
