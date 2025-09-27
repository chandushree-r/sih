'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Users, 
  MessageSquare, 
  Search, 
  Calendar, 
  TrendingUp, 
  Award,
  BookOpen,
  Target
} from 'lucide-react'

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

interface DashboardStats {
  totalPosts: number
  totalAnswers: number
  totalGroups: number
  totalMatches: number
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [stats, setStats] = useState<DashboardStats>({
    totalPosts: 0,
    totalAnswers: 0,
    totalGroups: 0,
    totalMatches: 0
  })
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
      fetchStats()
    } else {
      router.push('/login')
    }
  }, [router])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const interests = user?.profile ? JSON.parse(user.profile.interests || '[]') : []
  const subjects = user?.profile ? JSON.parse(user.profile.subjects || '[]') : []

  const quickActions = [
    {
      title: 'Ask Question',
      description: 'Get help from the community',
      icon: MessageSquare,
      href: '/community',
      color: 'bg-blue-500'
    },
    {
      title: 'Find Partners',
      description: 'Match with study buddies',
      icon: Search,
      href: '/matching',
      color: 'bg-green-500'
    },
    {
      title: 'Join Group',
      description: 'Collaborate in study groups',
      icon: Users,
      href: '/groups',
      color: 'bg-purple-500'
    },
    {
      title: 'Schedule Session',
      description: 'Plan your study time',
      icon: Calendar,
      href: '/groups',
      color: 'bg-orange-500'
    }
  ]

  if (!user) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {user.profile?.name}!</h1>
          <p className="text-gray-600 mt-2">Here's your learning dashboard</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Learning Points</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.profile?.points || 0}</div>
              <p className="text-xs text-muted-foreground">
                Keep learning to earn more!
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Coins</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.profile?.coins || 0}</div>
              <p className="text-xs text-muted-foreground">
                Redeem for rewards
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Class</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.profile?.class}</div>
              <p className="text-xs text-muted-foreground">
                Current grade level
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalMatches + stats.totalGroups}</div>
              <p className="text-xs text-muted-foreground">
                Study partners & groups
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Get started with these common tasks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quickActions.map((action, index) => {
                    const Icon = action.icon
                    return (
                      <Card key={index} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${action.color}`}>
                              <Icon className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm">{action.title}</h3>
                              <p className="text-xs text-gray-600 mt-1">{action.description}</p>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="mt-2 w-full"
                                onClick={() => router.push(action.href)}
                              >
                                Get Started
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>Your Profile</CardTitle>
                <CardDescription>
                  Your learning information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={user.profile?.avatar} alt={user.profile?.name} />
                      <AvatarFallback>
                        {user.profile?.name ? getInitials(user.profile.name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">{user.profile?.name}</h3>
                      <p className="text-sm text-gray-600">Class {user.profile?.class}</p>
                    </div>
                  </div>

                  {interests.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Interests</h4>
                      <div className="flex flex-wrap gap-1">
                        {interests.map((interest: string, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {subjects.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm mb-2">Needs Help With</h4>
                      <div className="flex flex-wrap gap-1">
                        {subjects.map((subject: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {subject}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => router.push('/profile')}
                  >
                    Edit Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}