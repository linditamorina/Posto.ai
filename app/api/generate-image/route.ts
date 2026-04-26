import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// @ts-ignore
import translate from "translate";

// Modeli SDXL ofron kualitetin më të lartë dhe realist aktualisht në HF falas
const MODEL_ID = "stabilityai/stable-diffusion-xl-base-1.0";

export async function POST(req: Request) {
  try {
    const { prompt, userId } = await req.json();

    // 1. Verifikimi i variablave të ambientit
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { error: "Konfigurimi i bazës së të dhënave dështoi." },
        { status: 500 },
      );
    }

    const hfToken = process.env.HUGGINGFACE_TOKEN; // Lexojmë tokenin nga .env.local
    if (!hfToken) {
      return NextResponse.json(
        { error: "Token i Hugging Face mungon." },
        { status: 500 },
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Përdoruesi i paidentifikuar. Ju lutem lidhuni." },
        { status: 401 },
      );
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

    // 2. KONTROLLI I LIMITIT (Rate Limiting)
    const { data: profile } = await supabase
      .from("profiles")
      .select("generations_count")
      .eq("id", userId)
      .single();

    if (profile && profile.generations_count >= 5) {
      return NextResponse.json(
        { error: "Keni arritur limitin prej 5 imazhesh falas." },
        { status: 429 },
      );
    }

    // 3. PËRKTHIMI (Modelet e HF kuptojnë vetëm Anglisht)
    let translatedPrompt = prompt;
    try {
      const translateLib = translate as any;
      translateLib.engine = "google";
      translatedPrompt = await translateLib(prompt, { from: "sq", to: "en" });
    } catch (err) {
      console.warn("Përkthimi dështoi, po vazhdojmë me promptin origjinal.");
    }

    const response = await fetch(
      `https://api-inference.huggingface.co/models/${MODEL_ID}`,
      {
        headers: {
          Authorization: `Bearer ${hfToken}`,
          "Content-Type": "application/json",
          "x-use-cache": "false",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: translatedPrompt,
          parameters: {
            guidance_scale: 7.5,
            num_inference_steps: 30, // Më shumë hapa = më shumë detaje realiste
          },
        }),
      },
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      // Trajtimi i modelit që po ngarkohet (Cold Start)
      if (response.status === 503) {
        return NextResponse.json(
          {
            error:
              "AI po zgjohet (Cold Start). Provo përsëri pas 20 sekondave.",
          },
          { status: 503 },
        );
      }

      return NextResponse.json(
        {
          error: errorData.error || "Hugging Face refuzoi kërkesën.",
        },
        { status: response.status },
      );
    }

    // 6. KONVERTIMI I IMAZHIT (Kritike për HF)
    // Hugging Face na kthen imazhin si "raw binary buffer"
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // E kthejmë në Base64 që frontendi ta lexojë si një link (<img src="data:image/jpeg;base64,...">)
    const base64Image = buffer.toString("base64");
    const imageUrl = `data:image/jpeg;base64,${base64Image}`;

    // 7. LOGIMI DHE PËRDITËSIMI NË BAZËN E TË DHËNAVE
    await supabase.rpc("increment_generation_count", { user_id: userId });
    await supabase
      .from("user_activities")
      .insert([
        {
          user_id: userId,
          type: "success",
          description: `Gjeneroi imazh: ${prompt.substring(0, 30)}...`,
        },
      ]);

    // Kthejmë URL-në Base64 në të njëjtin format që pret Frontendi
    return NextResponse.json({ url: imageUrl });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Gabim i brendshëm në server: " + error.message },
      { status: 500 },
    );
  }
}
