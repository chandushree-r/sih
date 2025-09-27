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

    const groups = await db.studyGroup.findMany({
      where: {
        isActive: true
      },
      include: {
        members: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        sessions: {
          orderBy: {
            scheduledAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      groups
    })

  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, description, maxMembers } = await request.json()

    if (!name) {
      return NextResponse.json(
        { error: 'Group name is required' },
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

    const group = await db.studyGroup.create({
      data: {
        name,
        description: description || null,
        maxMembers: maxMembers || 5,
        members: {
          create: {
            userId,
            role: 'ADMIN'
          }
        }
      },
      include: {
        members: {
          include: {
            user: {
              include: {
                profile: true
              }
            }
          }
        },
        sessions: {
          orderBy: {
            scheduledAt: 'asc'
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Group created successfully',
      group
    })

  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}