import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(request: NextRequest) {
  try {
    const { name, class: studentClass, interests, subjects, bio, avatar } = await request.json()

    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const userId = token.replace('dummy-token-', '')

    if (!name || !studentClass) {
      return NextResponse.json(
        { error: 'Name and class are required' },
        { status: 400 }
      )
    }

    if (studentClass < 8 || studentClass > 10) {
      return NextResponse.json(
        { error: 'Class must be 8, 9, or 10' },
        { status: 400 }
      )
    }

    const updatedUser = await db.user.update({
      where: { id: userId },
      data: {
        name
      },
      include: { profile: true }
    })

    const updatedProfile = await db.profile.update({
      where: { userId },
      data: {
        name,
        class: studentClass,
        interests: JSON.stringify(interests || []),
        subjects: JSON.stringify(subjects || []),
        bio: bio || '',
        avatar: avatar || null
      }
    })

    const userWithProfile = {
      ...updatedUser,
      profile: updatedProfile,
      password: undefined
    }

    return NextResponse.json({
      message: 'Profile updated successfully',
      user: userWithProfile
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}