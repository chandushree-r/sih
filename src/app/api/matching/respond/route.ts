import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { matchId, accept } = await request.json()

    if (!matchId || typeof accept !== 'boolean') {
      return NextResponse.json(
        { error: 'Match ID and accept status are required' },
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

    const match = await db.studyMatch.findUnique({
      where: { id: matchId },
      include: {
        user1: true,
        user2: true
      }
    })

    if (!match) {
      return NextResponse.json(
        { error: 'Match not found' },
        { status: 404 }
      )
    }

    if (match.user2Id !== userId) {
      return NextResponse.json(
        { error: 'Only the recipient can respond to this match' },
        { status: 403 }
      )
    }

    if (match.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'This match is no longer pending' },
        { status: 400 }
      )
    }

    const updatedMatch = await db.studyMatch.update({
      where: { id: matchId },
      data: {
        status: accept ? 'ACCEPTED' : 'REJECTED'
      },
      include: {
        user1: {
          include: {
            profile: true
          }
        },
        user2: {
          include: {
            profile: true
          }
        }
      }
    })

    if (accept) {
      await db.profile.update({
        where: { userId: match.user1Id },
        data: { coins: { increment: 10 } }
      })
      
      await db.profile.update({
        where: { userId: match.user2Id },
        data: { coins: { increment: 10 } }
      })
    }

    return NextResponse.json({
      message: accept ? 'Match accepted successfully' : 'Match declined',
      match: updatedMatch
    })

  } catch (error) {
    console.error('Error responding to match:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}