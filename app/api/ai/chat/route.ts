/**
 * AI Chat API Route - Integrates with Google Gemini
 * Handles interactive Q&A about forecasts and supply chain
 */

import { NextRequest, NextResponse } from 'next/server'

// Initialize Gemini service
let geminiService: any = null

async function initializeGemini() {
  if (geminiService) return geminiService

  try {
    // Dynamic import to avoid issues if not installed
    const { GeminiAIService } = await import('@/backend/gemini_ai_service')
    geminiService = new GeminiAIService()
    return geminiService
  } catch (error) {
    console.error('Failed to initialize Gemini:', error)
    throw new Error('AI service unavailable')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, context, forecastId } = body

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Initialize AI service
    const aiService = await initializeGemini()

    // Get interactive response from Gemini
    const response = await aiService.interactive_chat(message, context)

    return NextResponse.json({
      success: true,
      response,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to process message',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Streaming response option for real-time updates
export async function POST_STREAMING(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, context } = body

    const aiService = await initializeGemini()

    // Create streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = await aiService.interactive_chat(message, context)

          // Stream response character by character
          for (const char of response) {
            controller.enqueue(encoder.encode(char))
            // Add small delay for visual streaming effect
            await new Promise(resolve => setTimeout(resolve, 10))
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    console.error('Streaming chat error:', error)
    return NextResponse.json(
      { error: 'Streaming failed' },
      { status: 500 }
    )
  }
}
