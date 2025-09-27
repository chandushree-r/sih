'use client'

import { useState, useEffect } from 'react'
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, Users, Plus, CalendarDays } from 'lucide-react'

interface User {
  id: string
  email: string
  name?: string
  profile?: {
    id: string
    name: string
    class: number
    avatar?: string
  }
}

interface StudyGroup {
  id: string
  name: string
  description?: string
  maxMembers: number
  isActive: boolean
  createdAt: string
  members: StudyGroupMember[]
  sessions: StudySession[]
}

interface StudyGroupMember {
  id: string
  userId: string
  user: User
  role: 'ADMIN' | 'MEMBER'
  joinedAt: string
}

interface StudySession {
  id: string
  title: string
  description?: string
  scheduledAt: string
  duration: number
  createdAt: string
}

export default function GroupsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [groups, setGroups] = useState<StudyGroup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreateGroup, setShowCreateGroup] = useState(false)
  const [showScheduleSession, setShowScheduleSession] = useState<string | null>(null)
  const [newGroup, setNewGroup] = useState({ name: '', description: '', maxMembers: '5' })
  const [newSession, setNewSession] = useState({ title: '', description: '', scheduledAt: '', duration: '60' })
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    if (userData) {
      setUser(JSON.parse(userData))
    } else {
      router.push('/login')
      return
    }
    fetchGroups()
  }, [router])

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/groups', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setGroups(data.groups)
      }
    } catch (err) {
      console.error('Error fetching groups:', err)
    }
  }

  const createGroup = async () => {
    if (!user || !newGroup.name.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newGroup.name,
          description: newGroup.description,
          maxMembers: parseInt(newGroup.maxMembers)
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setNewGroup({ name: '', description: '', maxMembers: '5' })
        setShowCreateGroup(false)
        fetchGroups()
      } else {
        setError(data.error || 'Failed to create group')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const joinGroup = async (groupId: string) => {
    if (!user) return

    try {
      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        fetchGroups()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to join group')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    }
  }

  const leaveGroup = async (groupId: string) => {
    if (!user) return

    try {
      const response = await fetch(`/api/groups/${groupId}/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (response.ok) {
        fetchGroups()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to leave group')
      }
    } catch (err) {
      setError('An error occurred. Please try again.')
    }
  }

  const scheduleSession = async (groupId: string) => {
    if (!user || !newSession.title.trim() || !newSession.scheduledAt) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/groups/${groupId}/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          title: newSession.title,
          description: newSession.description,
          scheduledAt: newSession.scheduledAt,
          duration: parseInt(newSession.duration)
        }),
      })

      if (response.ok) {
        setNewSession({ title: '', description: '', scheduledAt: '', duration: '60' })
        setShowScheduleSession(null)
        fetchGroups()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to schedule session')
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

  const isUserMember = (group: StudyGroup) => {
    if (!user) return false
    return group.members.some(member => member.userId === user.id)
  }

  const getUserRole = (group: StudyGroup) => {
    if (!user) return null
    const member = group.members.find(member => member.userId === user.id)
    return member?.role
  }

  const getUpcomingSessions = (sessions: StudySession[]) => {
    return sessions
      .filter(session => new Date(session.scheduledAt) > new Date())
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Study Groups</h1>
            <p className="text-gray-600 mt-2">Collaborate and learn together in study groups</p>
          </div>
          <Dialog open={showCreateGroup} onOpenChange={setShowCreateGroup}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Study Group</DialogTitle>
                <DialogDescription>
                  Create a new study group for collaborative learning
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter group name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="groupDescription">Description (optional)</Label>
                  <Textarea
                    id="groupDescription"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the group's purpose"
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxMembers">Max Members</Label>
                  <Select value={newGroup.maxMembers} onValueChange={(value) => setNewGroup(prev => ({ ...prev, maxMembers: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 members</SelectItem>
                      <SelectItem value="5">5 members</SelectItem>
                      <SelectItem value="8">8 members</SelectItem>
                      <SelectItem value="10">10 members</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="flex gap-2">
                  <Button onClick={createGroup} disabled={loading || !newGroup.name.trim()}>
                    {loading ? 'Creating...' : 'Create Group'}
                  </Button>
                  <Button variant="outline" onClick={() => setShowCreateGroup(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groups.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No study groups yet</h3>
              <p className="text-gray-500 mb-4">Create your first study group or join existing ones</p>
            </div>
          ) : (
            groups.map((group) => {
              const userIsMember = isUserMember(group)
              const userRole = getUserRole(group)
              const upcomingSessions = getUpcomingSessions(group.sessions)
              
              return (
                <Card key={group.id} className="flex flex-col">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        {group.description && (
                          <CardDescription className="mt-1">{group.description}</CardDescription>
                        )}
                      </div>
                      <Badge variant={group.isActive ? "default" : "secondary"}>
                        {group.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <div className="mb-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                        <Users className="w-4 h-4" />
                        {group.members.length}/{group.maxMembers} members
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {group.members.slice(0, 5).map((member) => (
                          <Avatar key={member.id} className="w-6 h-6">
                            <AvatarImage src={member.user.profile?.avatar} alt={member.user.profile?.name} />
                            <AvatarFallback className="text-xs">
                              {member.user.profile?.name ? getInitials(member.user.profile.name) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {group.members.length > 5 && (
                          <span className="text-xs text-gray-500 self-center">+{group.members.length - 5}</span>
                        )}
                      </div>
                    </div>

                    {upcomingSessions.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-sm mb-2">Upcoming Sessions</h4>
                        <div className="space-y-2">
                          {upcomingSessions.slice(0, 2).map((session) => (
                            <div key={session.id} className="text-xs p-2 bg-gray-50 rounded">
                              <div className="font-medium">{session.title}</div>
                              <div className="flex items-center gap-1 text-gray-600">
                                <CalendarDays className="w-3 h-3" />
                                {new Date(session.scheduledAt).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1 text-gray-600">
                                <Clock className="w-3 h-3" />
                                {session.duration} minutes
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-auto space-y-2">
                      {userIsMember ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Dialog open={showScheduleSession === group.id} onOpenChange={(open) => setShowScheduleSession(open ? group.id : null)}>
                              <DialogTrigger asChild>
                                <Button size="sm" variant="outline" className="flex-1">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  Schedule
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md">
                                <DialogHeader>
                                  <DialogTitle>Schedule Study Session</DialogTitle>
                                  <DialogDescription>
                                    Plan a study session for your group
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="space-y-2">
                                    <Label htmlFor="sessionTitle">Session Title</Label>
                                    <Input
                                      id="sessionTitle"
                                      value={newSession.title}
                                      onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                                      placeholder="Enter session title"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="sessionDescription">Description (optional)</Label>
                                    <Textarea
                                      id="sessionDescription"
                                      value={newSession.description}
                                      onChange={(e) => setNewSession(prev => ({ ...prev, description: e.target.value }))}
                                      placeholder="Describe the session"
                                      rows={2}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="scheduledAt">Date & Time</Label>
                                    <Input
                                      id="scheduledAt"
                                      type="datetime-local"
                                      value={newSession.scheduledAt}
                                      onChange={(e) => setNewSession(prev => ({ ...prev, scheduledAt: e.target.value }))}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label htmlFor="duration">Duration (minutes)</Label>
                                    <Select value={newSession.duration} onValueChange={(value) => setNewSession(prev => ({ ...prev, duration: value }))}>
                                      <SelectTrigger>
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="30">30 minutes</SelectItem>
                                        <SelectItem value="60">1 hour</SelectItem>
                                        <SelectItem value="90">1.5 hours</SelectItem>
                                        <SelectItem value="120">2 hours</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button onClick={() => scheduleSession(group.id)} disabled={loading || !newSession.title.trim() || !newSession.scheduledAt}>
                                      {loading ? 'Scheduling...' : 'Schedule Session'}
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowScheduleSession(null)}>
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>
                            {userRole === 'ADMIN' && (
                              <Badge variant="outline" className="text-xs">Admin</Badge>
                            )}
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => leaveGroup(group.id)}
                            className="w-full"
                          >
                            Leave Group
                          </Button>
                        </div>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => joinGroup(group.id)}
                          disabled={group.members.length >= group.maxMembers}
                          className="w-full"
                        >
                          {group.members.length >= group.maxMembers ? 'Group Full' : 'Join Group'}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}