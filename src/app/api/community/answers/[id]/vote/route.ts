import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { type } = await request.json()
    const answerId = params.id

    if (!type || !['UP', 'DOWN'].includes(type)) {
      return NextResponse.json(
        { error: 'Valid vote type (UP or DOWN) is required' },
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

    const existingVote = await db.vote.findUnique({
      where: {
        userId_answerId: {
          userId,
          answerId
        }
      }
    })

    if (existingVote) {
      if (existingVote.type === type) {
        await db.vote.delete({
          where: { id: existingVote.id }
        })
      } else {
        await db.vote.update({
          where: { id: existingVote.id },
          data: { type }
        })
      }
    } else {
      await db.vote.create({
        data: {
          type,
          answerId,
          userId
        }
      })
    }

    return NextResponse.json({
      message: 'Vote recorded successfully'
    })

  } catch (error) {
    console.error('Error voting:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}