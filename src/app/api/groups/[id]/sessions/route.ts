import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { title, description, scheduledAt, duration } = await request.json()
    const groupId = params.id

    if (!title || !scheduledAt) {
      return NextResponse.json(
        { error: 'Title and scheduled time are required' },
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

    const group = await db.studyGroup.findUnique({
      where: { id: groupId },
      include: {
        members: {
          where: { userId }
        }
      }
    })

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    if (!group.isActive) {
      return NextResponse.json(
        { error: 'Group is not active' },
        { status: 400 }
      )
    }

    const member = group.members[0]
    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 400 }
      )
    }

    const scheduledDate = new Date(scheduledAt)
    if (scheduledDate <= new Date()) {
      return NextResponse.json(
        { error: 'Scheduled time must be in the future' },
        { status: 400 }
      )
    }

    const session = await db.studySession.create({
      data: {
        groupId,
        title,
        description: description || null,
        scheduledAt: scheduledDate,
        duration: duration || 60
      },
      include: {
        group: {
          include: {
            members: {
              include: {
                user: {
                  include: {
                    profile: true
                  }
                }
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Session scheduled successfully',
      session
    })

  } catch (error) {
    console.error('Error scheduling session:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}