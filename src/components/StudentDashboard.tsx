import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { LogOut, Search, Mail, User, FileText, Download, Send, Loader2, BookOpen } from 'lucide-react';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import logoImage from 'figma:asset/b7290909043e04203d6867936c6efc5d4558266e.png';
import bgImage from 'figma:asset/82eabb1d3b0be5236946e304fb239b048b059ca8.png';

interface StudentDashboardProps {
  accessToken: string;
  userId: string;
  onLogout: () => void;
}

export function StudentDashboard({ accessToken, userId, onLogout }: StudentDashboardProps) {
  const [profile, setProfile] = useState<any>(null);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [teacherDomains, setTeacherDomains] = useState<any[]>([]);
  const [teacherPapers, setTeacherPapers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<'browse' | 'teacher' | 'messages'>('browse');

  // Message dialog
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [messageForm, setMessageForm] = useState({ subject: '', content: '' });
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    loadData();
    // Poll for new messages every 10 seconds
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Filter teachers based on search
    if (searchQuery.trim() === '') {
      setFilteredTeachers(teachers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = teachers.filter(teacher => 
        teacher.name.toLowerCase().includes(query) ||
        teacher.institution?.toLowerCase().includes(query) ||
        teacher.bio?.toLowerCase().includes(query) ||
        teacher.researchInterests?.some((interest: string) => 
          interest.toLowerCase().includes(query)
        )
      );
      setFilteredTeachers(filtered);
    }
  }, [searchQuery, teachers]);

  const loadData = async () => {
    await Promise.all([
      loadProfile(),
      loadTeachers(),
      loadMessages()
    ]);
    setLoading(false);
  };

  const loadProfile = async () => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/profile`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      if (response.ok) {
        setProfile(data.profile);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadTeachers = async () => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/teachers`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      if (response.ok) {
        setTeachers(data.teachers);
        setFilteredTeachers(data.teachers);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const loadTeacherDetails = async (teacherId: string) => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      
      // Load teacher profile
      const profileResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/teachers/${teacherId}`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const profileData = await profileResponse.json();
      
      // Load domains
      const domainsResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/teachers/${teacherId}/domains`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const domainsData = await domainsResponse.json();
      
      // Load papers
      const papersResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/teachers/${teacherId}/papers`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const papersData = await papersResponse.json();

      if (profileResponse.ok) {
        setSelectedTeacher(profileData.teacher);
      }
      if (domainsResponse.ok) {
        setTeacherDomains(domainsData.domains);
      }
      if (papersResponse.ok) {
        setTeacherPapers(papersData.papers);
      }
    } catch (error) {
      console.error('Error loading teacher details:', error);
    }
  };

  const handleDownloadPaper = async (paperId: string, title: string) => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/papers/${paperId}/download`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      
      if (response.ok && data.downloadUrl) {
        // Open in new tab
        window.open(data.downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Error downloading paper:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/messages/inbox`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      if (response.ok) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { projectId } = await import('../utils/supabase/info');
      await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/messages/${messageId}/read`,
        {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      await loadMessages();
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    setSendingMessage(true);
    try {
      const { projectId } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            receiverId: selectedTeacher.id,
            subject: messageForm.subject,
            content: messageForm.content
          })
        }
      );

      if (response.ok) {
        setMessageForm({ subject: '', content: '' });
        setShowMessageDialog(false);
        alert('Message sent successfully!');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
    setSendingMessage(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <div className="min-h-screen bg-gray-50 relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.15
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <nav className="bg-white/95 backdrop-blur-sm border-b sticky top-0 z-40">
          <div className="container mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logoImage} alt="GAT Logo" className="w-12 h-12 object-contain" />
              <div className="flex flex-col">
                <span className="text-2xl text-purple-900">ResNet</span>
                <span className="text-xs text-gray-600">Global Academy of Technology</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant={currentView === 'messages' ? 'default' : 'ghost'}
                onClick={() => {
                  setCurrentView('messages');
                  setSelectedTeacher(null);
                }}
              >
                <Mail className="w-4 h-4 mr-2" />
                Messages
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-red-500">{unreadCount}</Badge>
                )}
              </Button>
              <Button
                variant={currentView === 'browse' ? 'default' : 'ghost'}
                onClick={() => {
                  setCurrentView('browse');
                  setSelectedTeacher(null);
                }}
              >
                <Search className="w-4 h-4 mr-2" />
                Browse Faculty
              </Button>
              <span className="text-gray-700">{profile?.name}</span>
              <Button variant="outline" onClick={onLogout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-8 max-w-7xl">
          {currentView === 'messages' ? (
            <>
              {/* Messages View */}
              <div className="mb-8">
                <h1 className="text-4xl mb-2 text-gray-900">Your Messages</h1>
                <p className="text-gray-600">View replies from GAT faculty members</p>
              </div>

              {messages.length === 0 ? (
                <Card className="p-12 text-center bg-white">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No messages yet</p>
                  <p className="text-sm text-gray-500 mt-2">Messages from faculty will appear here</p>
                </Card>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <Card
                      key={message.id}
                      className={`p-6 bg-white ${
                        !message.read ? 'border-purple-300 shadow-md' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900">{message.senderName}</span>
                            {!message.read && <Badge className="bg-purple-600">New</Badge>}
                          </div>
                          <p className="text-sm text-gray-500">{message.senderEmail}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(message.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-lg mb-2 text-gray-900">{message.subject}</h3>
                      <p className="text-gray-700 mb-4">{message.content}</p>
                      {!message.read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(message.id)}
                        >
                          Mark as Read
                        </Button>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </>
          ) : !selectedTeacher ? (
          <>
            {/* Browse Teachers View */}
            <div className="mb-8">
              <h1 className="text-4xl mb-2 text-gray-900">Discover GAT Faculty</h1>
              <p className="text-gray-600">Connect with Global Academy of Technology faculty members and explore their research</p>
            </div>

            {/* Search */}
            <div className="mb-8">
              <div className="relative max-w-2xl">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Search GAT faculty by name, department, or research interests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Teachers Grid */}
            {filteredTeachers.length === 0 ? (
              <Card className="p-12 text-center bg-white">
                <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No faculty members found</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTeachers.map((teacher) => (
                  <Card
                    key={teacher.id}
                    className="p-6 cursor-pointer hover:shadow-lg transition-shadow bg-white"
                    onClick={() => {
                      loadTeacherDetails(teacher.id);
                      setCurrentView('teacher');
                    }}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <Avatar className="w-16 h-16">
                        <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-xl">
                          {teacher.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <h3 className="text-xl mb-1 text-gray-900">{teacher.name}</h3>
                        {teacher.institution && (
                          <p className="text-sm text-gray-600">{teacher.institution}</p>
                        )}
                      </div>
                    </div>
                    
                    {teacher.bio && (
                      <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                        {teacher.bio}
                      </p>
                    )}

                    {teacher.researchInterests && teacher.researchInterests.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {teacher.researchInterests.slice(0, 3).map((interest: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {interest}
                          </Badge>
                        ))}
                        {teacher.researchInterests.length > 3 && (
                          <Badge variant="secondary">
                            +{teacher.researchInterests.length - 3} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            {/* Teacher Detail View */}
            <div className="mb-6">
              <Button variant="ghost" onClick={() => {
                setSelectedTeacher(null);
                setCurrentView('browse');
              }}>
                ← Back to faculty members
              </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Profile Sidebar */}
              <div className="lg:col-span-1">
                <Card className="p-6 sticky top-24 bg-white">
                  <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white text-3xl">
                      {selectedTeacher.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h2 className="text-2xl text-center mb-2 text-gray-900">
                    {selectedTeacher.name}
                  </h2>
                  
                  {selectedTeacher.institution && (
                    <p className="text-center text-gray-600 mb-4">
                      {selectedTeacher.institution}
                    </p>
                  )}

                  {selectedTeacher.email && (
                    <p className="text-center text-sm text-gray-500 mb-6">
                      {selectedTeacher.email}
                    </p>
                  )}

                  <Button
                    className="w-full mb-4"
                    onClick={() => setShowMessageDialog(true)}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>

                  {selectedTeacher.bio && (
                    <div className="mb-4">
                      <h3 className="text-sm text-gray-500 mb-2">About</h3>
                      <p className="text-gray-700 text-sm">
                        {selectedTeacher.bio}
                      </p>
                    </div>
                  )}

                  {selectedTeacher.researchInterests && selectedTeacher.researchInterests.length > 0 && (
                    <div>
                      <h3 className="text-sm text-gray-500 mb-2">Research Interests</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedTeacher.researchInterests.map((interest: string, idx: number) => (
                          <Badge key={idx} variant="secondary">
                            {interest}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              {/* Content Area */}
              <div className="lg:col-span-2 space-y-6">
                {/* Research Domains */}
                {teacherDomains.length > 0 && (
                  <div>
                    <h3 className="text-2xl mb-4 text-gray-900 flex items-center gap-2">
                      <BookOpen className="w-6 h-6" />
                      Research Domains
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                      {teacherDomains.map((domain) => (
                        <Card key={domain.id} className="p-4 bg-white">
                          <h4 className="text-lg mb-2 text-gray-900">{domain.name}</h4>
                          <p className="text-gray-600 text-sm">{domain.description}</p>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Papers */}
                <div>
                  <h3 className="text-2xl mb-4 text-gray-900 flex items-center gap-2">
                    <FileText className="w-6 h-6" />
                    Publications
                  </h3>
                  
                  {teacherPapers.length === 0 ? (
                    <Card className="p-8 text-center bg-white">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600">No papers available yet</p>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {teacherPapers.map((paper) => (
                        <Card key={paper.id} className="p-6 bg-white">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h4 className="text-xl mb-2 text-gray-900">{paper.title}</h4>
                              {paper.description && (
                                <p className="text-gray-600 text-sm mb-3">
                                  {paper.description}
                                </p>
                              )}
                              <div className="flex items-center gap-3">
                                {paper.domainId && (
                                  <Badge variant="secondary">
                                    {teacherDomains.find(d => d.id === paper.domainId)?.name}
                                  </Badge>
                                )}
                                <span className="text-sm text-gray-500">
                                  {new Date(paper.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => handleDownloadPaper(paper.id, paper.title)}
                            >
                              <Download className="w-4 h-4 mr-2" />
                              Download
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
        </div>
      </div>

      {/* Message Dialog */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Send Message to {selectedTeacher?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input
                value={messageForm.subject}
                onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                placeholder="Research collaboration inquiry"
                required
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={messageForm.content}
                onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                placeholder="Write your message here..."
                rows={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={sendingMessage}>
              {sendingMessage ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
