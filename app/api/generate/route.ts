// import { NextResponse } from 'next/server';
// import { Groq } from 'groq-sdk';

// const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const { 
//       businessName, 
//       industry,
//       location, 
//       numPosts, // Numri i kërkuar i postimeve
//       selectedImage,
//       tone,
//       language,
//       month
//     } = body;

//     // 1. ANALIZA E FOTOS (VISION)
//     let visualContext = "";
//     if (selectedImage && selectedImage.startsWith('data:image')) {
//       try {
//         const visionCompletion = await groq.chat.completions.create({
//           messages: [
//             {
//               role: "user",
//               content: [
//                 { 
//                   type: "text", 
//                   text: `Analizo këtë foto për biznesin "${businessName}". 
//                   Përshkrimi i dhënë nga përdoruesi: "${body.businessDescription}". 
                  
//                   DETYRA: 
//                   1. Identifiko produktet specifike që shihen në foto.
//                   2. Nëse përshkrimi i përdoruesit thotë "Market", por në foto ka "Kafe", përshkruaj elementet e Marketit që mund të jenë aty (fruta, rafte).
//                   3. Mos shpik shërbime që nuk shihen (psh mos thuaj 'shërbejmë kafe' nëse është dyqan frutash).
//                   4. Trego ngjyrat, teksturat dhe atmosferën (psh: dritë natyrale, produkte të freskëta, ambient modern).` 
//                 },
//                 { type: "image_url", image_url: { url: selectedImage } }
//               ]
//             }
//           ],
//           model: "openai/gpt-oss-120b", // Sugjerim: Përdor modelin Vision të Groq nëse GPT-oss nuk e pranon
//         });
//         visualContext = visionCompletion.choices[0]?.message?.content || "";
//       } catch (e) {
//         console.error("Vision Error:", e);
//       }
//     }

//     // 2. TONE & CONTEXT
//     const toneInstruction = tone === "Friendly/Local" ? `Përdor slang të butë të ${location}.` : "Ji profesional.";

//     //Ti je një Creative Director. 
//     //Detyra jote është të gjenerosh një plan marketingut me postime dhe oferta.
//     // 3. SYSTEM PROMPT (E RI DHE E SAKTË)
//     const systemPrompt = `
//     Ti je një Senior Content Strategist dhe Expert Marketingu. 
//     Detyra jote është të krijosh përmbajtje për rrjete sociale bazuar VETËM në realitetin vizual dhe përshkrimin e biznesit, të gjenerosh një plan marketingu me postime dhe oferta.

//     RREGULLAT KRITIKE:
//     1. DUHET të gjenerosh saktësisht ${numPosts || 1} postime të ndryshme.
//     2. Çdo postim duhet të ketë lidhje me atë që shihet në foto: ${visualContext || "Produkte të biznesit"}.
//     3. DUHET të përfshish një listë me 3 oferta speciale te fusha "special_offers".
//     4. GJUHA: ${language === 'en' ? 'English' : 'Shqip'}.
//     5. PËRGJIGJJA: VETËM JSON i vlefshëm.

//     STRUKTURA E JSON:
//     {
//       "posts": [
//         { "id": 1, "hook": "...", "caption": "...", "cta": "...", "hashtags": "..." }
//       ],
//       "special_offers": ["Ofertë 1", "Ofertë 2", "Ofertë 3"]
//     }`;

//     // 4. GENERATION
//     const completion = await groq.chat.completions.create({
//       messages: [
//         { role: "system", content: systemPrompt },
//         { 
//           role: "user", 
//           content: `Gjenero planin për muajin ${month || "aktual"} për biznesin "${businessName}" në ${location}. 
//           Krijo saktësisht ${numPosts || 1} postime unike.` 
//         }
//       ],
//       model: "openai/gpt-oss-120b",
//       temperature: 0.3,
//       response_format: { type: "json_object" }
//     });

//     const rawContent = completion.choices[0]?.message?.content || "{}";
//     return NextResponse.json({ data: JSON.parse(rawContent) });

//   } catch (error: any) {
//     console.error("API Error:", error);
//     return NextResponse.json({ error: error.message }, { status: 500 });
//   }
// }


import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // RREGULLIM: Sigurohemi që kapim të dhënat pavarësisht emërtimit në frontend
    const businessName = body.businessName || "";
    const industry = body.industry || "General";
    const location = body.location || "Kosovë";
    const numPosts = body.numPosts || 1;
    const selectedImage = body.selectedImage;
    // Këtu mund të jetë gabimi: nese frontend e dërgon si 'description' e jo 'businessDescription'
    const businessDescription = body.businessDescription || body.description || "";
    const tone = body.tone || "Professional";
    const language = body.language || "sq";
    const month = body.month || "aktual";

    // 1. ANALIZA E FOTOS (VISION)
    let visualContext = "";
    if (selectedImage && selectedImage.startsWith('data:image')) {
      try {
        const visionCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content: [
                { 
                  type: "text", 
                  text: `Analizo këtë foto për biznesin "${businessName}". 
                  Përshkrimi i pronarit: "${businessDescription}".
                  Trego çfarë produktesh/shërbimesh shihen saktësisht në foto që të mund t'i reklamojmë.` 
                },
                { type: "image_url", image_url: { url: selectedImage } }
              ]
            }
          ],
          model: "llama-3.2-11b-vision-preview", 
        });
        visualContext = visionCompletion.choices[0]?.message?.content || "";
      } catch (e) {
        console.error("Vision Error:", e);
        visualContext = "Imazhi tregon produkte dhe ambientin e biznesit.";
      }
    }

    // 2. DINAMIKA E TONIT
    const toneInstruction = tone === "Friendly/Local" 
      ? `Përdor gjuhë miqësore dhe slang të butë të ${location}.` 
      : "Përdor gjuhë profesionale, bindëse dhe korrekte.";

    // 3. SYSTEM PROMPT (I përmirësuar për saktësi maksimale)
    const systemPrompt = `
    Ti je një Senior Marketing Expert. Detyra jote është të krijosh një plan marketingut.
    
    KONTEKSTI REAL:
    - Biznesi: ${businessName} (${industry})
    - Çfarë shihet në foto: ${visualContext}
    - Përshkrimi shtesë: ${businessDescription}
    - Lokacioni: ${location}

    RREGULLAT:
    1. Krijo saktësisht ${numPosts} postime.
    2. Çdo postim duhet të bazohet në atë që shihet në foto dhe përshkrim.
    3. Gjuha: ${language === 'en' ? 'English' : 'Shqip'}.
    4. Kthe VETËM JSON.

    STRUKTURA JSON:
    {
      "posts": [
        { "id": 1, "hook": "...", "caption": "...", "cta": "...", "hashtags": "..." }
      ],
      "special_offers": ["Ofertë 1", "Ofertë 2", "Ofertë 3"]
    }`;

    // 4. GENERATION - Përdorim Llama 3.3 70B (ose 3.1) që është shumë më i zgjuar se ai i pari
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `Gjenero planin për muajin ${month}. Biznesi: ${businessName}. Lokacioni: ${location}.` 
        }
      ],
      model: "llama-3.3-70b-versatile", // Ky është modeli më i fuqishëm aktualisht në Groq
      temperature: 0.6,
      response_format: { type: "json_object" }
    });

    const rawContent = completion.choices[0]?.message?.content || "{}";
    return NextResponse.json({ data: JSON.parse(rawContent) });

  } catch (error: any) {
    console.error("API Error Detail:", error); // Kjo do të tregojë gabimin fiks në terminal
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}