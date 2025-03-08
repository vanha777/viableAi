import { NextResponse } from 'next/server'
import { Db, Server, PrivateKey } from "@/app/utils/db";
import { OpenAIEmbeddings } from "@langchain/openai";
import OpenAI from "openai";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

// Function to summarize text using OpenAI
async function summarizeText(text: string, maxLength: number = 100): Promise<string> {
  if (!text || text.trim().length === 0) return '';
  
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: `Summarize the following text in a concise way, maximum ${maxLength} characters.`
        },
        {
          role: "user",
          content: text
        }
      ],
      max_tokens: 150,
      temperature: 0.5,
    });
    
    return response.choices[0].message.content?.trim() || '';
  } catch (error) {
    console.error('Error summarizing text:', error);
    // Return truncated original text as fallback
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  }
}

export async function POST(request: Request) {
  try {
    // Fetch ideas data from the database
    const { data: ideasData, error: ideasError } = await Db
      .from('ideas')
      .select(`
        *,
        address_id!inner (*),
        users!inner (*)
      `).order('created_at', { ascending: false });

    if (ideasError) {
      console.error('Error fetching ideas:', ideasError);
      return NextResponse.json({ error: 'Error fetching ideas' }, { status: 500 });
    }

    // Initialize OpenAI embeddings model
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    });

    // Process each idea to create embeddings
    let successCount = 0;
    let errorCount = 0;

    for (const idea of ideasData) {
      try {
        // Summarize description and logo_description if they exist
        const descriptionSummary = idea.description ? 
          await summarizeText(idea.description) : '';
        
        const logoDescriptionSummary = idea.logo_description ? 
          await summarizeText(idea.logo_description) : '';
        
        // Create content to vectorize (combine relevant fields)
        const contentToVectorize = [
          `Industry: ${idea.industry || ''}`,
          `Title: ${idea.title}`,
          `Country: ${idea.address_id?.country}`,
          `Founder: ${idea.users?.name || ''}`,
          `Email: ${idea.users?.email || ''}`,
          `Description: ${descriptionSummary}`,
          `Logo Description: ${logoDescriptionSummary}`,
          `${idea.tags}`,
        ].filter(Boolean).join(' ').trim();

        console.log('Optimized Content to Vectorize:', contentToVectorize);

        // Generate embedding for the idea
        const [embedding] = await embeddings.embedDocuments([contentToVectorize]);
        console.log('Embedding Generated:', {
          id: idea.id,
          length: embedding.length, // Should be 1536
          sample: embedding.slice(0, 5), // Check first few values
        });

        // Update the idea record with the embedding
        const { error: updateError } = await Db
          .from('ideas')
          .update({ embedding })
          .eq('id', idea.id);

        if (updateError) {
          console.error(`Error updating embedding for idea ${idea.id}:`, updateError);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (ideaError) {
        console.error(`Error processing embedding for idea ${idea.id}:`, ideaError);
        errorCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${successCount} ideas successfully, ${errorCount} failures`
    }, { status: 200 });
  } catch (error) {
    console.error('Error in vectorize API:', error);
    return NextResponse.json({ error: 'Error processing request' }, { status: 400 });
  }
}

export async function GET() {
  try {
    // Handle your GET request here
    console.log('Received GET request')

    return NextResponse.json({ message: 'GET request successful' }, { status: 200 })
  } catch (error) {
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 })
  }
}