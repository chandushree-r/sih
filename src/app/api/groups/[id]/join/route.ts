import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const groupId = params.id

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
        members: true
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

    if (group.members.length >= group.maxMembers) {
      return NextResponse.json(
        { error: 'Group is full' },
        { status: 400 }
      )
    }

    const existingMember = group.members.find(member => member.userId === userId)
    if (existingMember) {
      return NextResponse.json(
        { error: 'Already a member of this group' },
        { status: 400 }
      )
    }

    await db.studyGroupMember.create({
      data: {
        groupId,
        userId,
        role: 'MEMBER'
      }
    })

    return NextResponse.json({
      message: 'Joined group successfully'
    })

  } catch (error) {
    console.error('Error joining group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}