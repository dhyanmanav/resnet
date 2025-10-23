import { GraduationCap, Users, BookOpen, MessageSquare, ArrowRight, Network, FileText, Search } from 'lucide-react';
import { Button } from './ui/button';

interface LandingPageProps {
  onGetStarted: (role: 'student' | 'teacher') => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-sm fixed w-full z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Network className="w-8 h-8 text-purple-600" />
              <span className="text-2xl text-purple-900">ResNet</span>
            </div>
            <span className="text-xs text-gray-600 ml-10">Global Academy of Technology</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => onGetStarted('student')}>
              Sign In
            </Button>
            <Button onClick={() => onGetStarted('teacher')}>
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block px-4 py-2 bg-purple-100 text-purple-700 rounded-full mb-6">
                Global Academy of Technology
              </div>
              <h1 className="text-5xl md:text-6xl mb-6 text-gray-900">
                Connecting{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
                  GAT Students & Faculty
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                ResNet is Global Academy of Technology's research networking platform. Connect with faculty members, 
                explore their research work, download papers, and collaborate on innovative projects.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  onClick={() => onGetStarted('student')}
                >
                  <GraduationCap className="w-5 h-5 mr-2" />
                  I'm a GAT Student
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => onGetStarted('teacher')}
                >
                  <Users className="w-5 h-5 mr-2" />
                  I'm a Faculty Member
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-3xl blur-3xl opacity-20"></div>
              <img 
                src="https://images.unsplash.com/photo-1758270705290-62b6294dd044?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZXNlYXJjaCUyMGNvbGxhYm9yYXRpb24lMjB1bml2ZXJzaXR5fGVufDF8fHx8MTc2MTIzMDkwMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Research collaboration"
                className="relative rounded-3xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl mb-4 text-gray-900">How ResNet Works</h2>
            <p className="text-xl text-gray-600">
              A seamless platform for academic collaboration at Global Academy of Technology
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {/* For Students */}
            <div className="border border-purple-200 rounded-2xl p-8 bg-gradient-to-br from-purple-50 to-white">
              <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl mb-4 text-gray-900">For GAT Students</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Search className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">Discover Faculty</div>
                    <p className="text-sm text-gray-600">Browse GAT faculty by research domain and interests</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">Access Research Papers</div>
                    <p className="text-sm text-gray-600">Download and read research publications from faculty</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-purple-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">Direct Communication</div>
                    <p className="text-sm text-gray-600">Send messages and collaborate with faculty members</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* For Teachers */}
            <div className="border border-blue-200 rounded-2xl p-8 bg-gradient-to-br from-blue-50 to-white">
              <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl mb-4 text-gray-900">For GAT Faculty</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">Organize Research Domains</div>
                    <p className="text-sm text-gray-600">Create categories for your research areas</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">Share Publications</div>
                    <p className="text-sm text-gray-600">Upload and manage your research papers</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                  <div>
                    <div className="text-gray-900">Connect with Students</div>
                    <p className="text-sm text-gray-600">Receive inquiries and mentor GAT students</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-5xl mb-2">500+</div>
              <p className="text-purple-100">Research Papers</p>
            </div>
            <div>
              <div className="text-5xl mb-2">100+</div>
              <p className="text-purple-100">Active Researchers</p>
            </div>
            <div>
              <div className="text-5xl mb-2">1000+</div>
              <p className="text-purple-100">Student Connections</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-4xl mb-6 text-gray-900">
            Ready to Start Your Research Journey at GAT?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join ResNet today and connect with the Global Academy of Technology community
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              onClick={() => onGetStarted('student')}
            >
              Get Started as Student
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => onGetStarted('teacher')}
            >
              Get Started as Faculty
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-8 px-6">
        <div className="container mx-auto max-w-6xl text-center text-gray-600">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Network className="w-6 h-6 text-purple-600" />
            <span className="text-xl text-gray-900">ResNet</span>
          </div>
          <p className="mb-1">Global Academy of Technology</p>
          <p className="text-sm">© 2025 ResNet GAT. Connecting minds for better research.</p>
        </div>
      </footer>
    </div>
  );
}
