import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, class: studentClass, interests, subjects, bio } = await request.json()

    if (!name || !email || !password || !studentClass) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (studentClass < 8 || studentClass > 10) {
      return NextResponse.json(
        { error: 'Class must be 8, 9, or 10' },
        { status: 400 }
      )
    }

    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name
      }
    })

    const profile = await db.profile.create({
      data: {
        userId: user.id,
        name,
        class: studentClass,
        interests: JSON.stringify(interests || []),
        subjects: JSON.stringify(subjects || []),
        bio: bio || ''
      }
    })

    const userWithProfile = {
      ...user,
      profile,
      password: undefined
    }

    return NextResponse.json({
      message: 'User created successfully',
      user: userWithProfile,
      token: 'dummy-token-' + user.id
    })

  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}