import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// @ts-ignore
import translate from "translate";

// export async function POST(req: Request) {
//   try {
//     const { prompt, userId } = await req.json();
//     const token = process.env.HUGGINGFACE_TOKEN;
    
//     const supabaseUrl = process.env.SUPABASE_URL;
//     const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

//     if (!supabaseUrl || !supabaseKey) {
//       return NextResponse.json({ error: "Konfigurimi i serverit dështoi (ENV missing)." }, { status: 500 });
//     }

//     if (!token) {
//       return NextResponse.json({ error: "Token i Hugging Face mungon." }, { status: 500 });
//     }

//     if (!userId) {
//       return NextResponse.json({ error: "Përdoruesi i paidentifikuar." }, { status: 401 });
//     }

//     const supabase = createClient(supabaseUrl, supabaseKey);

//     // 1. KONTROLLI I LIMITIT (Database Check)
//     const { data: profile, error: profileError } = await supabase
//       .from("profiles")
//       .select("generations_count")
//       .eq("id", userId)
//       .single();

//     if (profile && profile.generations_count >= 5) {
//       return NextResponse.json(
//         { error: "Keni arritur limitin tuaj personal prej 5 gjenerimesh falas." },
//         { status: 429 }
//       );
//     }

//     // 2. PËRKTHIMI I PROMPT-IT (SQ -> EN)
//     let translatedPrompt = prompt;
//     try {
//       const translateLib = translate as any;
//       translateLib.engine = "google";
//       translatedPrompt = await translateLib(prompt, { from: "sq", to: "en" });
//     } catch (err) {
//       console.error("Translation error:", err);
//     }

//     // 3. GJENERIMI I IMAZHIT (Hugging Face)
//     const response = await fetch(
//       "https://router.huggingface.co/hf-inference/models/runwayml/stable-diffusion-v1-5",
//       {
//         headers: {
//           "Authorization": `Bearer ${token}`,
//           "Content-Type": "application/json",
//           "x-wait-for-model": "true",
//         },
//         method: "POST",
//         body: JSON.stringify({
//           inputs: translatedPrompt,
//           parameters: {
//             guidance_scale: 7.5,
//             num_inference_steps: 4,
//           }
//         }),
//       }
//     );

//     // 4. CATCH ERROR LOGIC
//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       if (response.status === 429) {
//         return NextResponse.json(
//           { error: "Sistemi ka arritur limitin mujor. Provoni përsëri muajin tjetër." },
//           { status: 429 }
//         );
//       }
//       return NextResponse.json({ error: errorData.error || "Gjenerimi dështoi." }, { status: response.status });
//     }

//     // 5. SUKSES: RRITJA E NUMËRUESIT DHE LOGIMI I AKTIVITETIT
//     // Rritim numrin te profiles
//     await supabase.rpc('increment_generation_count', { user_id: userId });

//     // Regjistrojmë aktivitetin te user_activities
//     await supabase.from("user_activities").insert([
//       { 
//         user_id: userId, 
//         type: "image_generation", 
//         description: `Gjeneroi imazhin: ${prompt.substring(0, 50)}...` 
//       }
//     ]);

//     const arrayBuffer = await response.arrayBuffer();
//     const base64Image = Buffer.from(arrayBuffer).toString("base64");

//     return NextResponse.json({
//       url: `data:image/jpeg;base64,${base64Image}`,
//     });

//   } catch (error: any) {
//     console.error("Internal Error:", error);
//     return NextResponse.json({ error: "Gabim i brendshëm: " + error.message }, { status: 500 });
//   }
// }

// Sigurohu që inicializimi i supabase është jashtë POST ose i mbrojtur
export async function POST(req: Request) {
  try {
    const { prompt, userId } = await req.json();
    
    // Kontrolli i variablave (Rregullon image_f48f06.png)
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
       return NextResponse.json({ error: "Mungojnë celsat e Supabase në .env" }, { status: 500 });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    // 1. Regjistro tentativën (Kjo mbush image_0935c6.png)
    await supabase.from("user_activities").insert([
      { user_id: userId, type: "attempt", description: "Tentim për gjenerim imazhi" }
    ]);

    // 2. PËKTHIMI I PROMPT-IT (SQ -> EN)
    let translatedPrompt = prompt;
    try {
      const translateLib = translate as any;
      translateLib.engine = "google";
      translatedPrompt = await translateLib(prompt, { from: "sq", to: "en" });
    } catch (err) {
      console.error("Translation error:", err);
    }

    // 3. GJENERIMI I IMAZHIT (Hugging Face)
    const token = process.env.HUGGINGFACE_TOKEN;
    if (!token) {
      return NextResponse.json({ error: "Token i Hugging Face mungon." }, { status: 500 });
    }

    const response = await fetch(
      "https://router.huggingface.co/hf-inference/models/runwayml/stable-diffusion-v1-5",
      {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          "x-wait-for-model": "true",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: translatedPrompt,
          parameters: {
            guidance_scale: 7.5,
            num_inference_steps: 4,
          }
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ error: errorData.error || "Gjenerimi dështoi." }, { status: response.status });
    }

    if (response.ok) {
       // Përditëso profilin
       await supabase.rpc('increment_generation_count', { user_id: userId });
       
       // Log suksesi
       await supabase.from("user_activities").insert([
         { user_id: userId, type: "success", description: "Imazhi u gjenerua me sukses" }
       ]);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({
      url: `data:image/jpeg;base64,${base64Image}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Gabim i serverit: " + error.message }, { status: 500 });
  }
}