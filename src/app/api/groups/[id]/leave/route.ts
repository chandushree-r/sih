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

    const member = group.members[0]
    if (!member) {
      return NextResponse.json(
        { error: 'Not a member of this group' },
        { status: 400 }
      )
    }

    if (member.role === 'ADMIN') {
      const adminCount = await db.studyGroupMember.count({
        where: {
          groupId,
          role: 'ADMIN'
        }
      })

      if (adminCount === 1) {
        const memberCount = await db.studyGroupMember.count({
          where: { groupId }
        })

        if (memberCount > 1) {
          return NextResponse.json(
            { error: 'Cannot leave group as the only admin. Promote another member first.' },
            { status: 400 }
          )
        } else {
          await db.studyGroup.update({
            where: { id: groupId },
            data: { isActive: false }
          })
        }
      }
    }

    await db.studyGroupMember.delete({
      where: { id: member.id }
    })

    return NextResponse.json({
      message: 'Left group successfully'
    })

  } catch (error) {
    console.error('Error leaving group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}