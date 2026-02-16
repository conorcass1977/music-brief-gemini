import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { messages, max_tokens } = await req.json();
    

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-pro-latest",  // ← Change this line
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: max_tokens || 4000,
      }
    });

    // Extract the user message
    const userMessage = messages[0].content;
    
    // Music brief expertise context
    const systemContext = `You are an expert music supervisor with deep knowledge of what makes great music briefs.

EXPERTISE AREAS:
1. Producer/Creator Pain Points (from extensive research):
   - Budget constraints limiting music options
   - Licensing delays and approval complexities
   - Subjective decision-making causing friction
   - Vague briefs lacking emotional/visual context
   - Missing practical details (stems, duration, budget)
   - Need for clear target audience insights

2. Good Brief Patterns (from 15+ analyzed examples):
   ✓ Clear emotional direction: "empowering but not aggressive", "optimistic and joyful"
   ✓ Visual/narrative context: what's happening on screen, the story arc
   ✓ Musical specifics: tempo (BPM or descriptive), instrumentation, vocal preferences
   ✓ Reference tracks WITH context: explain WHY you like them, what specific elements
   ✓ Practical requirements: stems needed, multiple cuts, budget range, usage rights
   ✓ Music's role: hero or supportive? Under VO? Drives the edit?

3. Bad Brief Anti-Patterns (what to avoid):
   ✗ Generic descriptors: "upbeat, modern, energetic" without context
   ✗ No emotional journey specified
   ✗ References listed without explanation
   ✗ Missing visual/story context
   ✗ No practical details about deliverables
   ✗ Ignoring target audience

EXAMPLES FROM REAL BRIEFS:

Good: "We're looking for a track that captures the feeling that Lipton Iced Tea is totally irresistible. 
The client loves big, populist tracks, like 'Simply the Best' by Tina Turner: instantly recognisable, 
upbeat, and a little bit tongue-in-cheek. Because the film features giant fruit bouncing dramatically 
into water (it's playful, over the top, and knowingly ridiculous), the music can lean into that sense 
of humour too."

Bad: "We need music for our ad. Something upbeat and modern. Here are some references: [list of songs]"

${userMessage}

IMPORTANT: Return responses in valid JSON format when requested.`;

    const result = await model.generateContent(systemContext);
    const response = await result.response;
    const text = response.text();
    
    // Return in Claude-compatible format
    return NextResponse.json({
      content: [
        {
          type: "text",
          text: text
        }
      ]
    });
    
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Unknown error occurred' },
      { status: 500 }
    );
  }
}