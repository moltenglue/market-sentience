/**
 * Chat API Route
 * 
 * POST /api/chat
 * 
 * Handles chat messages with streaming support via Gemini AI.
 * Uses RAG (Retrieval-Augmented Generation) to provide context-aware responses.
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateStreamingResponse, generateResponse } from '@/lib/gemini/geminiService'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { message, sessionId, stream = false } = await request.json()

    // Validate request
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    console.log(`Chat request received: ${message.substring(0, 50)}...`)

    // Save user message to history (optional, non-blocking)
    try {
      await prisma.chatHistory.create({
        data: {
          sessionId,
          role: 'user',
          content: message
        }
      })
    } catch (error) {
      console.warn('Failed to save user message to history:', error)
      // Continue even if history save fails
    }

    if (stream) {
      // Return streaming response
      const encoder = new TextEncoder()
      const stream = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of generateStreamingResponse(message)) {
              controller.enqueue(encoder.encode(chunk))
            }
            controller.close()
          } catch (error) {
            console.error('Streaming error:', error)
            controller.error(error)
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    } else {
      // Return complete response
      const response = await generateResponse(message)

      // Save assistant response to history (optional, non-blocking)
      try {
        await prisma.chatHistory.create({
          data: {
            sessionId,
            role: 'assistant',
            content: response
          }
        })
      } catch (error) {
        console.warn('Failed to save assistant response to history:', error)
      }

      return NextResponse.json({ response })
    }
  } catch (error) {
    console.error('Chat API error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * GET /api/chat
 * 
 * Retrieves chat history for a session
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const history = await prisma.chatHistory.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 50 // Limit to last 50 messages
    })

    return NextResponse.json({ history })
  } catch (error) {
    console.error('Get chat history error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Internal server error'
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}
