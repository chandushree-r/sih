import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const posts = await db.post.findMany({
      include: {
        author: {
          include: {
            profile: true
          }
        },
        attachments: true,
        answers: {
          include: {
            author: {
              include: {
                profile: true
              }
            },
            votes: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      posts
    })

  } catch (error) {
    console.error('Error fetching posts:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, content, attachments = [] } = await request.json()

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
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

    const post = await db.post.create({
      data: {
        title,
        content,
        authorId: userId,
        attachments: {
          create: attachments.map((attachment: any) => ({
            filename: attachment.filename,
            originalName: attachment.originalName,
            fileType: attachment.fileType,
            fileSize: attachment.fileSize,
            fileUrl: attachment.fileUrl
          }))
        }
      },
      include: {
        author: {
          include: {
            profile: true
          }
        },
        attachments: true,
        answers: {
          include: {
            author: {
              include: {
                profile: true
              }
            },
            votes: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Post created successfully',
      post
    })

  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}