'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen, 
  Users, 
  MessageSquare, 
  Search, 
  Award, 
  TrendingUp,
  Target,
  GraduationCap
} from 'lucide-react'

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    const user = localStorage.getItem('user')
    if (token && user) {
      setIsAuthenticated(true)
      router.push('/dashboard')
    }
  }, [router])

  const features = [
    {
      title: 'Multilingual Learning',
      description: 'Learn in your preferred language with AI-powered tutoring',
      icon: BookOpen,
      color: 'bg-blue-500'
    },
    {
      title: 'Study Partner Matching',
      description: 'AI-powered matching to find perfect study buddies',
      icon: Search,
      color: 'bg-green-500'
    },
    {
      title: 'Community Q&A',
      description: 'Ask questions and help others learn together',
      icon: MessageSquare,
      color: 'bg-purple-500'
    },
    {
      title: 'Study Groups',
      description: 'Collaborate in groups with scheduled sessions',
      icon: Users,
      color: 'bg-orange-500'
    }
  ]

  const testimonials = [
    {
      name: 'Priya Sharma',
      class: 'Class 10',
      text: 'EduVerse Lite helped me find amazing study partners. My grades have improved so much!',
      icon: Award
    },
    {
      name: 'Rahul Kumar',
      class: 'Class 9',
      text: 'The community is so supportive. I can ask any question and get help quickly.',
      icon: TrendingUp
    },
    {
      name: 'Ananya Patel',
      class: 'Class 8',
      text: 'Study groups make learning fun. I love scheduling sessions with my friends!',
      icon: Target
    }
  ]

  if (isAuthenticated) {
    return <div className="min-h-screen flex items-center justify-center">Redirecting to dashboard...</div>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">EL</span>
              </div>
              <span className="font-bold text-2xl text-gray-900">EduVerse Lite</span>
            </div>
            <div className="flex space-x-4">
              <Button variant="ghost" onClick={() => router.push('/login')}>
                Sign In
              </Button>
              <Button onClick={() => router.push('/signup')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <GraduationCap className="w-16 h-16 text-blue-600" />
            </div>
            <h1 className="text-5xl font-bold text-gray-900 mb-6">
              Transform Your Learning Journey
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Join India's smart multilingual gamified learning ecosystem. Connect with study partners, 
              join communities, and accelerate your learning with AI-powered matching.
            </p>
            <div className="flex justify-center space-x-4">
              <Button size="lg" onClick={() => router.push('/signup')}>
                Start Learning Free
              </Button>
              <Button size="lg" variant="outline" onClick={() => router.push('/login')}>
                Sign In
              </Button>
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Everything You Need to Excel
              </h2>
              <p className="text-lg text-gray-600">
                Comprehensive learning tools designed for Indian students
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                  <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className={`w-12 h-12 ${feature.color} rounded-lg flex items-center justify-center mx-auto mb-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription>{feature.description}</CardDescription>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-gray-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Students Love EduVerse Lite
              </h2>
              <p className="text-lg text-gray-600">
                Hear from our community of learners
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => {
                const Icon = testimonial.icon
                return (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{testimonial.name}</CardTitle>
                          <CardDescription>{testimonial.class}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 italic">"{testimonial.text}"</p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </section>

        <section className="py-16 px-4 bg-blue-600 text-white">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Transform Your Learning?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of students already learning with EduVerse Lite
            </p>
            <div className="flex justify-center space-x-4">
              <Button size="lg" variant="secondary" onClick={() => router.push('/signup')}>
                Get Started Free
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600" onClick={() => router.push('/login')}>
                Sign In to Account
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">EL</span>
                </div>
                <span className="font-bold text-xl">EduVerse Lite</span>
              </div>
              <p className="text-gray-400 text-sm">
                Empowering Indian students with smart, collaborative learning tools.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Platform</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Study Groups</a></li>
                <li><a href="#" className="hover:text-white">Community</a></li>
                <li><a href="#" className="hover:text-white">Matching</a></li>
                <li><a href="#" className="hover:text-white">Profile</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Resources</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">Help Center</a></li>
                <li><a href="#" className="hover:text-white">Blog</a></li>
                <li><a href="#" className="hover:text-white">Community Guidelines</a></li>
                <li><a href="#" className="hover:text-white">Safety</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white">About</a></li>
                <li><a href="#" className="hover:text-white">Careers</a></li>
                <li><a href="#" className="hover:text-white">Contact</a></li>
                <li><a href="#" className="hover:text-white">Privacy Policy</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 EduVerse Lite. All rights reserved. Made with ❤️ for Indian students.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}