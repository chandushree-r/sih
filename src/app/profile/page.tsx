'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface User {
  id: string
  email: string
  name?: string
  profile?: {
    id: string
    name: string
    class: number
    interests: string
    subjects: string
    bio?: string
    avatar?: string
    points: number
    coins: number
  }
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    class: '',
    interests: '',
    subjects: '',
    bio: '',
    avatar: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      const parsedUser = JSON.parse(userData)
      setUser(parsedUser)
      if (parsedUser.profile) {
        setFormData({
          name: parsedUser.profile.name || '',
          class: parsedUser.profile.class?.toString() || '',
          interests: JSON.parse(parsedUser.profile.interests || '[]').join(', '),
          subjects: JSON.parse(parsedUser.profile.subjects || '[]').join(', '),
          bio: parsedUser.profile.bio || '',
          avatar: parsedUser.profile.avatar || ''
        })
      }
    } else {
      router.push('/login')
    }
  }, [router])

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    if (!user) return

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/profile/update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: formData.name,
          class: parseInt(formData.class),
          interests: formData.interests.split(',').map(i => i.trim()).filter(i => i),
          subjects: formData.subjects.split(',').map(s => s.trim()).filter(s => s),
          bio: formData.bio,
          avatar: formData.avatar
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        localStorage.setItem('user', JSON.stringify(data.user))
        setSuccess('Profile updated successfully!')
        setEditing(false)
      } else {
        setError(data.error || 'Failed to update profile')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  if (!user) {
    return <div>Loading...</div>
  }

  const interests = JSON.parse(user.profile?.interests || '[]')
  const subjects = JSON.parse(user.profile?.subjects || '[]')

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Student Profile</h1>
          <p className="text-gray-600 mt-2">Manage your personal information and learning preferences</p>
        </div>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold">Profile Information</CardTitle>
            <CardDescription>
              Update your personal details and learning preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex flex-col items-center space-y-4">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user.profile?.avatar} alt={user.profile?.name} />
                  <AvatarFallback className="text-lg">
                    {user.profile?.name ? getInitials(user.profile.name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center">
                  <h3 className="font-semibold">{user.profile?.name}</h3>
                  <p className="text-sm text-gray-600">Class {user.profile?.class}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">
                      {user.profile?.points} Points
                    </Badge>
                    <Badge variant="outline">
                      {user.profile?.coins} Coins
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex-1">
                {editing ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                        placeholder="Enter your full name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="class">Class</Label>
                      <Select value={formData.class} onValueChange={(value) => handleChange('class', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your class" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="8">Class 8</SelectItem>
                          <SelectItem value="9">Class 9</SelectItem>
                          <SelectItem value="10">Class 10</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="interests">Interests (comma-separated)</Label>
                      <Input
                        id="interests"
                        value={formData.interests}
                        onChange={(e) => handleChange('interests', e.target.value)}
                        placeholder="e.g., Math, Science, Coding"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subjects">Subjects needing help (comma-separated)</Label>
                      <Input
                        id="subjects"
                        value={formData.subjects}
                        onChange={(e) => handleChange('subjects', e.target.value)}
                        placeholder="e.g., Physics, Chemistry"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => handleChange('bio', e.target.value)}
                        placeholder="Tell us about yourself"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="avatar">Avatar URL</Label>
                      <Input
                        id="avatar"
                        value={formData.avatar}
                        onChange={(e) => handleChange('avatar', e.target.value)}
                        placeholder="Enter avatar image URL"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-700">Email</h4>
                      <p className="text-gray-600">{user.email}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700">Class</h4>
                      <p className="text-gray-600">Class {user.profile?.class}</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700">Interests</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {interests.map((interest: string, index: number) => (
                          <Badge key={index} variant="outline">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700">Subjects Needing Help</h4>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {subjects.map((subject: string, index: number) => (
                          <Badge key={index} variant="secondary">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    {user.profile?.bio && (
                      <div>
                        <h4 className="font-semibold text-gray-700">Bio</h4>
                        <p className="text-gray-600">{user.profile.bio}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {success && (
              <Alert className="mt-4">
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 mt-6">
              {editing ? (
                <>
                  <Button onClick={handleSave} disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button onClick={() => setEditing(true)}>
                  Edit Profile
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}