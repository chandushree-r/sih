import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
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

    const [totalPosts, totalAnswers, totalGroups, totalMatches] = await Promise.all([
      db.post.count({
        where: { authorId: userId }
      }),
      db.answer.count({
        where: { authorId: userId }
      }),
      db.studyGroupMember.count({
        where: { userId }
      }),
      db.studyMatch.count({
        where: {
          OR: [
            { user1Id: userId },
            { user2Id: userId }
          ],
          status: 'ACCEPTED'
        }
      })
    ])

    return NextResponse.json({
      stats: {
        totalPosts,
        totalAnswers,
        totalGroups,
        totalMatches
      }
    })

  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}