import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      businessName, 
      industry,
      location, 
      numPosts, // Numri i kërkuar i postimeve
      selectedImage,
      tone,
      language,
      month
    } = body;

    // 1. ANALIZA E FOTOS (VISION)
    let visualContext = "";
    if (selectedImage && selectedImage.startsWith('data:image')) {
      try {
        const visionCompletion = await groq.chat.completions.create({
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "Përshkruaj çfarë sheh në këtë foto. Mos supozo asgjë, vetëm trego produktet dhe ambientin." },
                { type: "image_url", image_url: { url: selectedImage } }
              ]
            }
          ],
          model: "llama-3.2-11b-vision-preview",
        });
        visualContext = visionCompletion.choices[0]?.message?.content || "";
      } catch (e) {
        console.error("Vision Error:", e);
      }
    }

    // 2. TONE & CONTEXT
    const toneInstruction = tone === "Friendly/Local" ? `Përdor slang të butë të ${location}.` : "Ji profesional.";

    // 3. SYSTEM PROMPT (E RI DHE E SAKTË)
    const systemPrompt = `Ti je një Creative Director. 
    Detyra jote është të gjenerosh një plan marketingut me postime dhe oferta.

    RREGULLAT KRITIKE:
    1. DUHET të gjenerosh saktësisht ${numPosts || 1} postime të ndryshme.
    2. Çdo postim duhet të ketë lidhje me atë që shihet në foto: ${visualContext || "Produkte të biznesit"}.
    3. DUHET të përfshish një listë me 3 oferta speciale te fusha "special_offers".
    4. GJUHA: ${language === 'en' ? 'English' : 'Shqip'}.
    5. PËRGJIGJJA: VETËM JSON i vlefshëm.

    STRUKTURA E JSON:
    {
      "posts": [
        { "id": 1, "hook": "...", "caption": "...", "cta": "...", "hashtags": "..." }
      ],
      "special_offers": ["Ofertë 1", "Ofertë 2", "Ofertë 3"]
    }`;

    // 4. GENERATION
    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { 
          role: "user", 
          content: `Gjenero planin për muajin ${month || "aktual"} për biznesin "${businessName}" në ${location}. 
          Krijo saktësisht ${numPosts || 1} postime unike.` 
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const rawContent = completion.choices[0]?.message?.content || "{}";
    return NextResponse.json({ data: JSON.parse(rawContent) });

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}