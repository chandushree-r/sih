import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { content } = await request.json()
    const postId = params.id

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      )
    }

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const userId = token.replace('dummy-token-', '')

    const answer = await db.answer.create({
      data: {
        content,
        postId,
        authorId: userId
      },
      include: {
        author: {
          include: {
            profile: true
          }
        },
        votes: true
      }
    })

    return NextResponse.json({
      message: 'Answer created successfully',
      answer
    })

  } catch (error) {
    console.error('Error creating answer:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}