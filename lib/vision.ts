import { CATEGORIES, normalizeCategory, type Category } from "./categories";

export type VisionResult = {
  extracted_text: string;
  category: Category;
  tags: string[];
  description: string;
};

export async function analyzeScreenshot(imageUrl: string): Promise<VisionResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You analyze screenshots for an organizing app. Return a JSON object with:
- extracted_text: all readable text in the image, or "" if none
- category: exactly one of ${CATEGORIES.join(", ")}
- tags: 3-6 short lowercase keywords
- description: one short sentence summarizing the screenshot`,
        },
        {
          role: "user",
          content: [{ type: "image_url", image_url: { url: imageUrl } }],
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`vision call failed: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  const rawContent = data.choices[0].message.content;

  let parsed;
  try {
    parsed = JSON.parse(rawContent);
  } catch {
    throw new Error(`vision response was not valid JSON: ${rawContent}`);
  }

  return {
    extracted_text: typeof parsed.extracted_text === "string" ? parsed.extracted_text : "",
    category: normalizeCategory(parsed.category),
    tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    description: typeof parsed.description === "string" ? parsed.description : "",
  };
}
