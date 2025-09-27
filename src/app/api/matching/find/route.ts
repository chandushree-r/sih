import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface PotentialMatch {
  user: any
  score: number
  commonInterests: string[]
  complementarySubjects: string[]
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const userId = token.replace('dummy-token-', '')

    const currentUser = await db.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    })

    if (!currentUser || !currentUser.profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    const currentUserInterests = JSON.parse(currentUser.profile.interests || '[]')
    const currentUserSubjects = JSON.parse(currentUser.profile.subjects || '[]')

    const allUsers = await db.user.findMany({
      where: {
        id: { not: userId },
        profile: {
          isNot: null
        }
      },
      include: { profile: true }
    })

    const existingMatches = await db.studyMatch.findMany({
      where: {
        OR: [
          { user1Id: userId },
          { user2Id: userId }
        ],
        status: {
          in: ['PENDING', 'ACCEPTED']
        }
      }
    })

    const matchedUserIds = new Set(
      existingMatches.map(match => match.user1Id === userId ? match.user2Id : match.user1Id)
    )

    const potentialMatches: PotentialMatch[] = []

    for (const user of allUsers) {
      if (matchedUserIds.has(user.id)) continue

      const userInterests = JSON.parse(user.profile?.interests || '[]')
      const userSubjects = JSON.parse(user.profile?.subjects || '[]')

      const commonInterests = currentUserInterests.filter((interest: string) =>
        userInterests.includes(interest)
      )

      const complementarySubjects = userSubjects.filter((subject: string) =>
        currentUserSubjects.includes(subject)
      )

      let score = 0

      if (commonInterests.length > 0) {
        score += (commonInterests.length / Math.max(currentUserInterests.length, userInterests.length)) * 0.4
      }

      if (complementarySubjects.length > 0) {
        score += (complementarySubjects.length / Math.max(currentUserSubjects.length, userSubjects.length)) * 0.4
      }

      if (currentUser.profile.class === user.profile?.class) {
        score += 0.2
      }

      if (score > 0.3) {
        potentialMatches.push({
          user,
          score,
          commonInterests,
          complementarySubjects
        })
      }
    }

    potentialMatches.sort((a, b) => b.score - a.score)

    return NextResponse.json({
      matches: potentialMatches.slice(0, 10)
    })

  } catch (error) {
    console.error('Error finding matches:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}