'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Users, UserPlus, Clock, Check, X } from 'lucide-react'

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

interface Match {
  id: string
  user1Id: string
  user2Id: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  score: number
  createdAt: string
  user1: User
  user2: User
}

interface PotentialMatch {
  user: User
  score: number
  commonInterests: string[]
  complementarySubjects: string[]
}

export default function MatchingPage() {
  const [user, setUser] = useState<User | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [potentialMatches, setPotentialMatches] = useState<PotentialMatch[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [findingMatches, setFindingMatches] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/login')
      return
    }
    fetchMatches()
  }, [router])

  const fetchMatches = async () => {
    try {
      const response = await fetch('/api/matching/matches', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setMatches(data.matches)
      }
    } catch (err) {
      console.error('Error fetching matches:', err)
    }
  }

  const findPotentialMatches = async () => {
    if (!user) return

    setFindingMatches(true)
    setError('')

    try {
      const response = await fetch('/api/matching/find', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPotentialMatches(data.matches)
      } else {
        setError(data.error || 'Failed to find matches')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setFindingMatches(false)
    }
  }

  const sendMatchRequest = async (targetUserId: string) => {
    if (!user) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/matching/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ targetUserId }),
      })

      if (response.ok) {
        setSuccess('Match request sent successfully!')
        setPotentialMatches([])
        fetchMatches()
      } else {
        setError(data.error || 'Failed to send match request')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const respondToMatch = async (matchId: string, accept: boolean) => {
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/matching/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ matchId, accept }),
      })

      if (response.ok) {
        setSuccess(accept ? 'Match accepted!' : 'Match declined')
        fetchMatches()
      } else {
        setError(data.error || 'Failed to respond to match')
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

  const getOtherUser = (match: Match) => {
    if (!user) return null
    return match.user1Id === user.id ? match.user2 : match.user1
  }

  const getMatchStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800'
      case 'ACCEPTED': return 'bg-green-100 text-green-800'
      case 'REJECTED': return 'bg-red-100 text-red-800'
      case 'EXPIRED': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Study Partner Matching</h1>
          <p className="text-gray-600 mt-2">Find your perfect study partner based on interests and subjects</p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="mb-4">
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Find Study Partners
                </CardTitle>
                <CardDescription>
                  Discover students with similar interests and complementary subjects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={findPotentialMatches} 
                  disabled={findingMatches}
                  className="w-full"
                >
                  {findingMatches ? 'Finding Matches...' : 'Find Study Partners'}
                </Button>

                {potentialMatches.length > 0 && (
                  <div className="mt-4 space-y-4">
                    <h3 className="font-semibold">Potential Matches</h3>
                    {potentialMatches.map((match, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={match.user.profile?.avatar} alt={match.user.profile?.name} />
                            <AvatarFallback>
                              {match.user.profile?.name ? getInitials(match.user.profile.name) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold">{match.user.profile?.name}</h4>
                              <Badge variant="outline">
                                Match Score: {Math.round(match.score * 100)}%
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">Class {match.user.profile?.class}</p>
                            
                            {match.commonInterests.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-gray-700">Common Interests:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {match.commonInterests.map((interest, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-xs">
                                      {interest}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {match.complementarySubjects.length > 0 && (
                              <div className="mb-3">
                                <p className="text-xs font-medium text-gray-700">Can Help With:</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {match.complementarySubjects.map((subject, idx) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {subject}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <Button 
                              size="sm" 
                              onClick={() => sendMatchRequest(match.user.id)}
                              disabled={loading}
                            >
                              Send Match Request
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Your Matches
                </CardTitle>
                <CardDescription>
                  View and manage your study partner requests and connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matches.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">No matches yet. Start finding study partners!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matches.map((match) => {
                      const otherUser = getOtherUser(match)
                      if (!otherUser) return null

                      const isInitiator = match.user1Id === user?.id
                      const needsAction = match.status === 'PENDING' && !isInitiator

                      return (
                        <Card key={match.id} className="p-4">
                          <div className="flex items-start gap-3">
                            <Avatar className="w-12 h-12">
                              <AvatarImage src={otherUser.profile?.avatar} alt={otherUser.profile?.name} />
                              <AvatarFallback>
                                {otherUser.profile?.name ? getInitials(otherUser.profile.name) : 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold">{otherUser.profile?.name}</h4>
                                <Badge className={getMatchStatusColor(match.status)}>
                                  {match.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">Class {otherUser.profile?.class}</p>
                              <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                                <Clock className="w-3 h-3" />
                                {new Date(match.createdAt).toLocaleDateString()}
                              </div>
                              
                              {needsAction && (
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    onClick={() => respondToMatch(match.id, true)}
                                    disabled={loading}
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => respondToMatch(match.id, false)}
                                    disabled={loading}
                                  >
                                    <X className="w-4 h-4 mr-1" />
                                    Decline
                                  </Button>
                                </div>
                              )}
                              
                              {match.status === 'ACCEPTED' && (
                                <Button size="sm" variant="outline">
                                  Start Studying Together
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}