import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { targetUserId } = await request.json()

    if (!targetUserId) {
      return NextResponse.json(
        { error: 'Target user ID is required' },
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

    const existingMatch = await db.studyMatch.findFirst({
      where: {
        OR: [
          { user1Id: userId, user2Id: targetUserId },
          { user1Id: targetUserId, user2Id: userId }
        ]
      }
    })

    if (existingMatch) {
      return NextResponse.json(
        { error: 'Match already exists or pending' },
        { status: 400 }
      )
    }

    const targetUser = await db.user.findUnique({
      where: { id: targetUserId },
      include: { profile: true }
    })

    if (!targetUser || !targetUser.profile) {
      return NextResponse.json(
        { error: 'Target user not found' },
        { status: 404 }
      )
    }

    const currentUser = await db.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    })

    if (!currentUser || !currentUser.profile) {
      return NextResponse.json(
        { error: 'Current user profile not found' },
        { status: 404 }
      )
    }

    const currentUserInterests = JSON.parse(currentUser.profile.interests || '[]')
    const currentUserSubjects = JSON.parse(currentUser.profile.subjects || '[]')
    const targetUserInterests = JSON.parse(targetUser.profile.interests || '[]')
    const targetUserSubjects = JSON.parse(targetUser.profile.subjects || '[]')

    const commonInterests = currentUserInterests.filter((interest: string) =>
      targetUserInterests.includes(interest)
    )

    const complementarySubjects = targetUserSubjects.filter((subject: string) =>
      currentUserSubjects.includes(subject)
    )

    let score = 0

    if (commonInterests.length > 0) {
      score += (commonInterests.length / Math.max(currentUserInterests.length, targetUserInterests.length)) * 0.4
    }

    if (complementarySubjects.length > 0) {
      score += (complementarySubjects.length / Math.max(currentUserSubjects.length, targetUserSubjects.length)) * 0.4
    }

    if (currentUser.profile.class === targetUser.profile.class) {
      score += 0.2
    }

    const match = await db.studyMatch.create({
      data: {
        user1Id: userId,
        user2Id: targetUserId,
        score,
        status: 'PENDING'
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

    return NextResponse.json({
      message: 'Match request sent successfully',
      match
    })

  } catch (error) {
    console.error('Error sending match request:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}