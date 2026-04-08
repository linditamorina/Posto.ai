// import { NextResponse } from "next/server";
// // @ts-ignore
// import translate from "translate";

// export async function POST(req: Request) {
//   try {
//     const { prompt } = await req.json();
//     const token = process.env.HUGGINGFACE_TOKEN;

//     if (!token) {
//       return NextResponse.json({ error: "Token mungon." }, { status: 500 });
//     }

//     // 1. Përkthimi
//     let translatedPrompt = prompt;
//     try {
//       const translateLib = translate as any;
//       translateLib.engine = "google";
//       translatedPrompt = await translateLib(prompt, { from: "sq", to: "en" });
//     } catch (err) {
//       console.error("Translation error:", err);
//     }

//     // runwayml/stable-diffusion-v1-5

//     // 2. Kërkesa drejt Hugging Face
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

//     // 3. LOGJIKA E ERROR CATCHING PËR KUOTAT
//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
      
//       // Kontrollon nëse mesazhi i gabimit thotë që kreditet kanë mbaruar
//       if (response.status === 429 || (errorData.error && errorData.error.includes("depleted"))) {
//         return NextResponse.json(
//           { error: "Keni plotësuar limitin prej 20 gjenerimeve falas për këtë muaj. Ju lutem provoni përsëri muajin tjetër ose kaloni në planin PRO." },
//           { status: 429 }
//         );
//       }

//       // Gabime të tjera teknike (p.sh. token i gabuar ose server i rënë)
//       return NextResponse.json(
//         { error: errorData.error || "Gjenerimi dështoi për shkak të një problemi me API-n." },
//         { status: response.status }
//       );
//     }

//     const arrayBuffer = await response.arrayBuffer();
//     const base64Image = Buffer.from(arrayBuffer).toString("base64");

//     return NextResponse.json({
//       url: `data:image/jpeg;base64,${base64Image}`,
//     });

//   } catch (error: any) {
//     return NextResponse.json(
//       { error: "Gabim i brendshëm: " + (error.message || "Provoni përsëri.") },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
// @ts-ignore
import translate from "translate";

export async function POST(req: Request) {
  try {
    const { prompt, userId } = await req.json();
    const token = process.env.HUGGINGFACE_TOKEN;
    
    // Inicializimi i variablave të Supabase brenda POST për të shmangur gabimet e Turbopack
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error("Gabim: Variablat e Supabase mungojnë në .env.local");
      return NextResponse.json({ error: "Konfigurimi i serverit dështoi." }, { status: 500 });
    }

    if (!token) {
      return NextResponse.json({ error: "Token i Hugging Face mungon." }, { status: 500 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Përdoruesi i paidentifikuar." }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. KONTROLLI I LIMITIT INDIVIDUAL (Database Check)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("generations_count")
      .eq("id", userId)
      .single();

    // Nëse përdoruesi ka arritur limitin (psh. 5 gjenerime)
    if (profile && profile.generations_count >= 5) {
      return NextResponse.json(
        { error: "Keni arritur limitin tuaj personal prej 5 gjenerimesh falas." },
        { status: 429 }
      );
    }

    // 2. PËRKTHIMI I PROMPT-IT (SQ -> EN)
    let translatedPrompt = prompt;
    try {
      const translateLib = translate as any;
      translateLib.engine = "google";
      translatedPrompt = await translateLib(prompt, { from: "sq", to: "en" });
      console.log("Original:", prompt);
      console.log("Translated:", translatedPrompt);
    } catch (err) {
      console.error("Translation error:", err);
    }

    // 3. GJENERIMI I IMAZHIT (Hugging Face)
    // Përdorim SDXL Turbo me URL-në e Router-it siç kërkohet për këtë model
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

    // 4. CATCH ERROR LOGIC (Për kreditet globale 20/muaj)
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Hugging Face API Error:", errorData);

      if (response.status === 429 || (errorData.error && errorData.error.includes("depleted"))) {
        return NextResponse.json(
          { error: "Sistemi ka arritur limitin mujor të gjenerimeve falas. Provoni përsëri muajin tjetër." },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: errorData.error || "Gjenerimi dështoi." },
        { status: response.status }
      );
    }

    // 5. SUKSES: RRITJA E NUMËRUESIT DHE KTHIMI I IMAZHIT
    // Rritim numrin në DB vetëm pasi konfirmojmë që imazhi u gjenerua
    await supabase.rpc('increment_generation_count', { user_id: userId });

    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString("base64");

    return NextResponse.json({
      url: `data:image/jpeg;base64,${base64Image}`,
    });

  } catch (error: any) {
    console.error("Internal Error:", error);
    return NextResponse.json(
      { error: "Gabim i brendshëm: " + (error.message || "Unknown error") }, 
      { status: 500 }
    );
  }
}

// import { NextResponse } from "next/server";
// // @ts-ignore
// import translate from "translate";

// export async function POST(req: Request) {
//   try {
//     const { prompt } = await req.json();
//     const token = process.env.HUGGINGFACE_TOKEN;

//     if (!token) {
//       return NextResponse.json({ error: "Token mungon në .env.local" }, { status: 500 });
//     }

//     // 1. Përkthimi (lihet siç e ke pasur)
//     let translatedPrompt = prompt;
//     try {
//       const translateLib = translate as any;
//       translateLib.engine = "google";
//       translatedPrompt = await translateLib(prompt, { from: "sq", to: "en" });
//     } catch (err) {
//       console.error("Translation error:", err);
//     }

//     // 2. ZGJIDHJA PROFESIONALE: 
//     // Përdorim URL-në direkte të modelit SDXL që është në infrastrukturën falas të HF.
//     // Shënim: URL-ja duhet të jetë saktësisht kjo, pa fjalën "router".
//     const response = await fetch(
//       "https://router.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
//       {
//         headers: {
//           "Authorization": `Bearer ${token}`,
//           "Content-Type": "application/json",
//           "x-wait-for-model": "true", // Kjo detyron serverin të presë derisa modeli të jetë gati
//         },
//         method: "POST",
//         body: JSON.stringify({ 
//           inputs: translatedPrompt,
//           parameters: {
//             negative_prompt: "blurry, bad quality, distorted",
//           }
//         }),
//       }
//     );

//     // 3. CATCH ERROR - Kapja e gabimit saktësisht
//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({}));
//       console.error("HF Error Details:", errorData);
      
//       // Nëse prapë thotë "credits depleted", do të thotë që ky model 
//       // përkohësisht kërkon kredi. Në atë rast, kalo te: runwayml/stable-diffusion-v1-5
//       return NextResponse.json(
//         { error: errorData.error || "API nuk u përgjigj saktë." },
//         { status: response.status }
//       );
//     }

//     const arrayBuffer = await response.arrayBuffer();
//     const base64Image = Buffer.from(arrayBuffer).toString("base64");

//     return NextResponse.json({
//       url: `data:image/jpeg;base64,${base64Image}`,
//     });

//   } catch (error: any) {
//     return NextResponse.json({ error: "Gabim i brendshëm: " + error.message }, { status: 500 });
//   }
// }