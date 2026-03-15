import { NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { businessName, industry, location, tone, month, numPosts, offers } = body;

    const systemPrompt = `Ti je "Content Generator" – specialist i marketingut me 10+ vjet përvojë në tregun kosovar.
    Specializohesh për: kafene, restorante, sallone bukurie, klinika, dyqane online dhe agjenci në Kosovë[cite: 6, 7, 8, 9].
    
    Rregullat:
    1. Gjuha: Shqip standarde kosovare (me prekje dialekti për autenticitet).
    2. Tone: ${tone}.
    3. Gjatësia: 80–120 fjalë për postim[cite: 46].
    4. Struktura JSON strikte: {"posts": [{"id":1, "hook":"", "caption":"", "cta":"", "hashtags":[]}], "special_offers": []}.
    5. Elemente Lokale: Referenca kulturore kosovare, humor lokal, qyteti ${location}[cite: 48].
    
    MOS PËRDOR referenca citimi si në tekst. Përdor vetëm tekstin origjinal.`;

    const userPrompt = `Gjenero planin për:
    - Biznesi: ${businessName}
    - Industria: ${industry}
    - Qyteti: ${location}
    - Muaji: ${month}
    - Numri i postimeve: ${numPosts}
    - Oferta ekzistuese: ${offers || "Asnjë, krijo 3 të reja"}`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      model: "openai/gpt-oss-120b", // Mund të përdorësh edhe gpt-oss-120b nëse e ke të disponueshëm
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = JSON.parse(completion.choices[0]?.message?.content || "{}");
    return NextResponse.json({ data: content });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}