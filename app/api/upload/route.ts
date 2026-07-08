import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { analyzeScreenshot } from "@/lib/vision";
import { embedText } from "@/lib/embeddings";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file") as File;

  if (!file) {
    return NextResponse.json({ error: "no file" }, { status: 400 });
  }

  const fileName = `${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("screenshots")
    .upload(fileName, file);

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const { data: urlData } = supabase.storage
    .from("screenshots")
    .getPublicUrl(fileName);

  const { data, error: dbError } = await supabase
    .from("screenshots")
    .insert({ file_url: urlData.publicUrl, file_name: file.name })
    .select()
    .single();

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  try {
    const analysis = await analyzeScreenshot(urlData.publicUrl);
    const embeddingInput = [analysis.description, analysis.extracted_text, analysis.tags.join(" ")]
      .filter(Boolean)
      .join("\n");
    const embedding = await embedText(embeddingInput);

    const { data: updated, error: updateError } = await supabase
      .from("screenshots")
      .update({ ...analysis, embedding })
      .eq("id", data.id)
      .select()
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json(updated);
  } catch (err) {
    console.error("vision/embedding analysis failed", err);
    return NextResponse.json(data);
  }
}
