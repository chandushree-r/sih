'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { ThumbsUp, ThumbsDown, MessageSquare, Plus, Trash2, Upload, FileText, Image, X, Download } from 'lucide-react'

interface User {
  id: string
  email: string
  name?: string
  profile?: {
    id: string
    name: string
    class: number
    avatar?: string
    points: number
    coins: number
  }
}

interface PostAttachment {
  id: string
  filename: string
  originalName: string
  fileType: string
  fileSize: number
  fileUrl: string
}

interface Post {
  id: string
  title: string
  content: string
  image?: string
  authorId: string
  author: User
  createdAt: string
  attachments: PostAttachment[]
  answers: Answer[]
}

interface Answer {
  id: string
  content: string
  authorId: string
  author: User
  createdAt: string
  votes: Vote[]
}

interface Vote {
  id: string
  type: 'UP' | 'DOWN'
  userId: string
}

export default function CommunityPage() {
  const [user, setUser] = useState<User | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCreatePost, setShowCreatePost] = useState(false)
  const [newPost, setNewPost] = useState({ title: '', content: '' })
  const [newAnswer, setNewAnswer] = useState<{ [key: string]: string }>({})
  const [expandedPosts, setExpandedPosts] = useState<Set<string>>(new Set())
  const [attachments, setAttachments] = useState<PostAttachment[]>([])
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/login')
      return
    }
    fetchPosts()
  }, [router])

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/community/posts')
      if (response.ok) {
        const data = await response.json()
        setPosts(data.posts)
      }
    } catch (err) {
      console.error('Error fetching posts:', err)
    }
  }

  const handleFileUpload = async (file: File) => {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (response.ok) {
        setAttachments(prev => [...prev, data.file])
      } else {
        setError(data.error || 'Failed to upload file')
      }
    } catch (err) {
      setError('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const handleCreatePost = async () => {
    if (!user || !newPost.title.trim() || !newPost.content.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/community/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: newPost.title,
          content: newPost.content,
          attachments
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setNewPost({ title: '', content: '' })
        setAttachments([])
        setShowCreatePost(false)
        fetchPosts()
      } else {
        setError(data.error || 'Failed to create post')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePost = async (postId: string) => {
    if (!user) return

    if (!confirm('Are you sure you want to delete this post?')) return

    try {
      const response = await fetch(`/api/community/posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        fetchPosts()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to delete post')
      }
    } catch (err) {
      setError('Failed to delete post')
    }
  }

  const handleCreateAnswer = async (postId: string) => {
    if (!user || !newAnswer[postId]?.trim()) return

    try {
      const response = await fetch(`/api/community/posts/${postId}/answers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: newAnswer[postId]
        }),
      })

      if (response.ok) {
        setNewAnswer(prev => ({ ...prev, [postId]: '' }))
        fetchPosts()
      }
    } catch (err) {
      console.error('Error creating answer:', err)
    }
  }

  const handleVote = async (answerId: string, voteType: 'UP' | 'DOWN') => {
    if (!user) return

    try {
      const response = await fetch(`/api/community/answers/${answerId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ type: voteType }),
      })

      if (response.ok) {
        fetchPosts()
      }
    } catch (err) {
      console.error('Error voting:', err)
    }
  }

  const getVoteCount = (votes: Vote[], type: 'UP' | 'DOWN') => {
    return votes.filter(vote => vote.type === type).length
  }

  const getUserVote = (votes: Vote[]) => {
    if (!user) return null
    const userVote = votes.find(vote => vote.userId === user.id)
    return userVote ? userVote.type : null
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const togglePostExpansion = (postId: string) => {
    const newExpanded = new Set(expandedPosts)
    if (newExpanded.has(postId)) {
      newExpanded.delete(postId)
    } else {
      newExpanded.add(postId)
    }
    setExpandedPosts(newExpanded)
  }

  const handleProfileClick = (userId: string) => {
    router.push(`/profile?user=${userId}`)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Community Q&A</h1>
            <p className="text-lg text-gray-600 mb-6">Ask questions, get answers, and help others learn</p>
            <div className="flex justify-center">
              <Dialog open={showCreatePost} onOpenChange={setShowCreatePost}>
                <DialogTrigger asChild>
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg">
                    <Plus className="w-5 h-5 mr-2" />
                    Ask a Question
                  </Button>
                </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">Ask a Question</DialogTitle>
                <DialogDescription className="text-gray-600">
                  Share your question with the community and attach relevant files
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium text-gray-700">Question Title</Label>
                  <Input
                    id="title"
                    value={newPost.title}
                    onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="What's your question?"
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content" className="text-sm font-medium text-gray-700">Details</Label>
                  <Textarea
                    id="content"
                    value={newPost.content}
                    onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Provide more details about your question..."
                    rows={4}
                    className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                
                {/* File Upload Section */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">Attachments (Optional)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      onChange={(e) => {
                        if (e.target.files) {
                          Array.from(e.target.files).forEach(handleFileUpload)
                        }
                      }}
                      className="hidden"
                    />
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        Click to upload images or documents
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        {uploading ? 'Uploading...' : 'Choose Files'}
                      </Button>
                      <p className="text-xs text-gray-500 mt-1">
                        Images: JPEG, PNG, GIF, WebP • Documents: PDF, DOC, DOCX, TXT • Max 10MB
                      </p>
                    </div>
                  </div>
                  
                  {/* Attached Files */}
                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">Attached Files:</p>
                      <div className="space-y-2">
                        {attachments.map((attachment, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center gap-3">
                              {attachment.fileType === 'image' ? (
                                <Image className="w-5 h-5 text-blue-500" />
                              ) : (
                                <FileText className="w-5 h-5 text-green-500" />
                              )}
                              <div>
                                <p className="text-sm font-medium text-gray-900">{attachment.originalName}</p>
                                <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-3">
                  <Button 
                    onClick={handleCreatePost} 
                    disabled={loading || !newPost.title.trim() || !newPost.content.trim()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    {loading ? 'Posting...' : 'Post Question'}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setShowCreatePost(false)
                      setAttachments([])
                      setNewPost({ title: '', content: '' })
                    }}
                    className="border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {posts.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-300">
              <CardContent className="p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No questions yet</h3>
                <p className="text-gray-500 mb-4">Be the first to ask a question and start the conversation!</p>
                <Button onClick={() => setShowCreatePost(true)} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Ask First Question
                </Button>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow duration-200 border-l-4 border-l-blue-500 bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12 ring-2 ring-blue-100 cursor-pointer hover:ring-blue-300 transition-all" onClick={() => handleProfileClick(post.author.id)}>
                      <AvatarImage src={post.author.profile?.avatar} alt={post.author.profile?.name} />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                        {post.author.profile?.name ? getInitials(post.author.profile.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <button
                          onClick={() => handleProfileClick(post.author.id)}
                          className="font-semibold text-lg text-blue-600 hover:text-blue-800 hover:underline cursor-pointer transition-colors"
                        >
                          {post.author.profile?.name || post.author.name}
                        </button>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">Class {post.author.profile?.class}</Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                        {post.authorId === user?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 ml-auto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-gray-900 mb-3 leading-tight">{post.title}</CardTitle>
                  <div className="text-gray-700 whitespace-pre-wrap text-base leading-relaxed bg-gray-50 p-4 rounded-lg">
                    {post.content}
                  </div>
                  
                  {/* File Attachments */}
                  {post.attachments && post.attachments.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Attachments:</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {post.attachments.map((attachment) => (
                          <div key={attachment.id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors">
                            {attachment.fileType === 'image' ? (
                              <div className="flex-shrink-0">
                                <img 
                                  src={attachment.fileUrl} 
                                  alt={attachment.originalName}
                                  className="w-12 h-12 object-cover rounded-lg"
                                />
                              </div>
                            ) : (
                              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <FileText className="w-6 h-6 text-green-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{attachment.originalName}</p>
                              <p className="text-xs text-gray-500">{formatFileSize(attachment.fileSize)}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(attachment.fileUrl, '_blank')}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-6">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={() => togglePostExpansion(post.id)}
                      className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <MessageSquare className="w-5 h-5" />
                      <span className="font-medium">
                        {post.answers.length} {post.answers.length === 1 ? 'Answer' : 'Answers'}
                      </span>
                      {expandedPosts.has(post.id) ? (
                        <span className="text-blue-600">↑</span>
                      ) : (
                        <span className="text-gray-400">↓</span>
                      )}
                    </Button>
                    {post.answers.length > 0 && (
                      <div className="text-sm text-gray-500">
                        {post.answers.length} {post.answers.length === 1 ? 'response' : 'responses'}
                      </div>
                    )}
                  </div>

                  {expandedPosts.has(post.id) && (
                    <>
                      <Separator className="my-6" />
                      
                      <div className="space-y-6">
                        {post.answers.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 mb-4">No answers yet. Be the first to help!</p>
                          </div>
                        ) : (
                          post.answers.map((answer) => {
                            const userVote = getUserVote(answer.votes)
                            const upvotes = getVoteCount(answer.votes, 'UP')
                            const downvotes = getVoteCount(answer.votes, 'DOWN')
                            
                            return (
                              <div key={answer.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200">
                                <div className="flex items-start gap-4 mb-4">
                                  <Avatar 
                                    className="w-10 h-10 ring-2 ring-green-100 cursor-pointer hover:ring-green-300 transition-all" 
                                    onClick={() => handleProfileClick(answer.author.id)}
                                  >
                                    <AvatarImage src={answer.author.profile?.avatar} alt={answer.author.profile?.name} />
                                    <AvatarFallback className="bg-green-100 text-green-700 font-semibold">
                                      {answer.author.profile?.name ? getInitials(answer.author.profile.name) : 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                      <button
                                        onClick={() => handleProfileClick(answer.author.id)}
                                        className="font-semibold text-green-600 hover:text-green-800 hover:underline cursor-pointer transition-colors"
                                      >
                                        {answer.author.profile?.name || answer.author.name}
                                      </button>
                                      <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">Class {answer.author.profile?.class}</Badge>
                                      <span className="text-sm text-gray-500">
                                        {new Date(answer.createdAt).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="text-gray-800 whitespace-pre-wrap text-base leading-relaxed mb-4 pl-14">
                                  {answer.content}
                                </div>
                                
                                <div className="flex items-center gap-4 pl-14">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleVote(answer.id, 'UP')}
                                    className={`flex items-center gap-2 ${
                                      userVote === 'UP' 
                                        ? 'text-green-600 bg-green-50 hover:bg-green-100' 
                                        : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                                    }`}
                                  >
                                    <ThumbsUp className="w-4 h-4" />
                                    <span className="font-medium">{upvotes}</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleVote(answer.id, 'DOWN')}
                                    className={`flex items-center gap-2 ${
                                      userVote === 'DOWN' 
                                        ? 'text-red-600 bg-red-50 hover:bg-red-100' 
                                        : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                                    }`}
                                  >
                                    <ThumbsDown className="w-4 h-4" />
                                    <span className="font-medium">{downvotes}</span>
                                  </Button>
                                  {upvotes > downvotes && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                                      ✓ Helpful
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )
                          })
                        )}

                        <div className="bg-gray-50 rounded-xl p-6 border-2 border-dashed border-gray-200">
                          <div className="flex items-start gap-4">
                            <Avatar className="w-10 h-10 ring-2 ring-blue-100">
                              <AvatarImage src={user.profile?.avatar} alt={user.profile?.name} />
                              <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                                {user.profile?.name ? getInitials(user.profile.name) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-3">
                                <span className="font-semibold text-gray-900">{user.profile?.name || user.name}</span>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">Class {user.profile?.class}</Badge>
                              </div>
                              <div className="flex gap-3">
                                <Textarea
                                  placeholder="Write your answer here... Help others by sharing your knowledge!"
                                  value={newAnswer[post.id] || ''}
                                  onChange={(e) => setNewAnswer(prev => ({ ...prev, [post.id]: e.target.value }))}
                                  className="min-h-[100px] resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && e.ctrlKey) {
                                      e.preventDefault()
                                      handleCreateAnswer(post.id)
                                    }
                                  }}
                                />
                                <div className="flex flex-col gap-2">
                                  <Button
                                    onClick={() => handleCreateAnswer(post.id)}
                                    disabled={!newAnswer[post.id]?.trim()}
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                                  >
                                    Post Answer
                                  </Button>
                                  <div className="text-xs text-gray-500 text-center">
                                    Ctrl+Enter to post
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}