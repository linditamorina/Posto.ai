import { NextResponse } from "next/server";
// @ts-ignore
import translate from "translate";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();
    const token = process.env.HUGGINGFACE_TOKEN;

    if (!token) {
      return NextResponse.json({ error: "Token mungon." }, { status: 500 });
    }

    // HAPI 1: Përkthimi me Google Engine (pa vija të kuqe)
    let translatedPrompt = prompt;
    try {
      // Përdorim as any për të anashkaluar kontrollin e rreptë të TypeScript
      const translateLib = translate as any;
      translateLib.engine = "google";
      
      translatedPrompt = await translateLib(prompt, { from: "sq", to: "en" });
      
      console.log("Original SQ:", prompt);
      console.log("Translated EN:", translatedPrompt);
    } catch (err) {
      console.error("Translation error:", err);
    }

    // HAPI 2: Gjenerimi me modelin FLUX (më i shpejti dhe i sakti për momentin)
    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/black-forest-labs/FLUX.1-schnell",
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true",
        },
        method: "POST",
        body: JSON.stringify({ 
          inputs: translatedPrompt,
          // Shtojmë parametra për të rritur kualitetin
          parameters: {
            guidance_scale: 7.5,
            num_inference_steps: 4, // Specifike për modelin 'schnell'
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: errorData.error || "AI dështoi." },
        { status: response.status }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");
    
    return NextResponse.json({ 
      url: `data:image/jpeg;base64,${base64Image}` 
    });

  } catch (error) {
    return NextResponse.json({ error: "Gabim i brendshëm." }, { status: 500 });
  }
}