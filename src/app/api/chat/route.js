import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { hiteshDataSet } from '@/dataset/hitesh';
import { piyushDataSet } from '@/dataset/piyush';

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
});

export async function POST(request) {
  try {
    const { message, user, previousMessages = [] } = await request.json();

    const hiteshSystemPrompt = hiteshDataSet;
    const piyushSystemPrompt = piyushDataSet;
    let assistantResponse = ``;

    const messages = [
      ...previousMessages,
      {
        role: 'system',
        content: user === 'hitesh' ? hiteshSystemPrompt : piyushSystemPrompt,
      },
    ];

    messages.push({ role: 'user', content: message });

    const stream = await openai.chat.completions.create({
      model: 'gemini-2.5-flash',
      reasoning_effort: 'low',
      messages: messages,
      stream: true,
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          console.log(chunk);
          const content = chunk.choices[0].delta.content || '';
          if (content) {
            assistantResponse += content;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ content })}\n\n`)
            );
          }
        }
        messages.push({
          role: 'assistant',
          content: assistantResponse,
        });
        // always close the controller, after for loop
        controller.close();
      },
    });

    // clear assistant response
    assistantResponse = ``;

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}
