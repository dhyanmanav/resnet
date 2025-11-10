import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { LogOut, BookOpen, FileText, Mail, Plus, Upload, Trash2, Download, User, Loader2, Send, Reply } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import logoImage from 'figma:asset/b7290909043e04203d6867936c6efc5d4558266e.png';
import bgImage from 'figma:asset/82eabb1d3b0be5236946e304fb239b048b059ca8.png';

interface TeacherDashboardProps {
  accessToken: string;
  userId: string;
  onLogout: () => void;
}

export function TeacherDashboard({ accessToken, userId, onLogout }: TeacherDashboardProps) {
  const [profile, setProfile] = useState<any>(null);
  const [domains, setDomains] = useState<any[]>([]);
  const [papers, setPapers] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [showDomainDialog, setShowDomainDialog] = useState(false);
  const [showPaperDialog, setShowPaperDialog] = useState(false);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showReplyDialog, setShowReplyDialog] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  // Form states
  const [domainForm, setDomainForm] = useState({ name: '', description: '' });
  const [paperForm, setPaperForm] = useState({
    title: '',
    description: '',
    domainId: '',
    file: null as File | null
  });
  const [profileForm, setProfileForm] = useState({
    name: '',
    institution: '',
    bio: '',
    researchInterests: ''
  });
  const [replyForm, setReplyForm] = useState({ subject: '', content: '' });
  const [sendingReply, setSendingReply] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
    // Poll for new messages every 10 seconds
    const interval = setInterval(loadMessages, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    await Promise.all([
      loadProfile(),
      loadDomains(),
      loadPapers(),
      loadMessages()
    ]);
    setLoading(false);
  };

  const loadProfile = async () => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/profile`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      if (response.ok) {
        setProfile(data.profile);
        setProfileForm({
          name: data.profile.name,
          institution: data.profile.institution || '',
          bio: data.profile.bio || '',
          researchInterests: data.profile.researchInterests?.join(', ') || ''
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const loadDomains = async () => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/teachers/${userId}/domains`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      if (response.ok) {
        setDomains(data.domains);
      }
    } catch (error) {
      console.error('Error loading domains:', error);
    }
  };

  const loadPapers = async () => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/teachers/${userId}/papers`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );
      const data = await response.json();
      if (response.ok) {
        setPapers(data.papers);
      }
    } catch (error) {
      console.error('Error loading papers:', error);
    }
  };

  const loadMessages = async () => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
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

  const handleCreateDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/domains`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(domainForm)
        }
      );

      if (response.ok) {
        setDomainForm({ name: '', description: '' });
        setShowDomainDialog(false);
        await loadDomains();
      }
    } catch (error) {
      console.error('Error creating domain:', error);
    }
    setSubmitting(false);
  };

  const handleUploadPaper = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paperForm.file) return;

    setSubmitting(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(paperForm.file);
      reader.onload = async () => {
        const { projectId, publicAnonKey } = await import('../utils/supabase/info');
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/papers`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              title: paperForm.title,
              description: paperForm.description,
              domainId: paperForm.domainId || null,
              fileData: reader.result,
              fileName: paperForm.file!.name
            })
          }
        );

        if (response.ok) {
          setPaperForm({ title: '', description: '', domainId: '', file: null });
          setShowPaperDialog(false);
          await loadPapers();
        }
        setSubmitting(false);
      };
    } catch (error) {
      console.error('Error uploading paper:', error);
      setSubmitting(false);
    }
  };

  const handleDeletePaper = async (paperId: string) => {
    if (!confirm('Are you sure you want to delete this paper?')) return;

    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/papers/${paperId}`,
        {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${accessToken}` }
        }
      );

      if (response.ok) {
        await loadPapers();
      }
    } catch (error) {
      console.error('Error deleting paper:', error);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/profile`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: profileForm.name,
            institution: profileForm.institution,
            bio: profileForm.bio,
            researchInterests: profileForm.researchInterests.split(',').map(s => s.trim()).filter(Boolean)
          })
        }
      );

      if (response.ok) {
        setShowProfileDialog(false);
        await loadProfile();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    }
    setSubmitting(false);
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { projectId, publicAnonKey } = await import('../utils/supabase/info');
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

  const handleReplyToMessage = (message: any) => {
    setSelectedMessage(message);
    setReplyForm({
      subject: `Re: ${message.subject}`,
      content: ''
    });
    setShowReplyDialog(true);
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMessage) return;

    setSendingReply(true);
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
            receiverId: selectedMessage.senderId,
            subject: replyForm.subject,
            content: replyForm.content
          })
        }
      );

      if (response.ok) {
        setReplyForm({ subject: '', content: '' });
        setShowReplyDialog(false);
        setSelectedMessage(null);
        alert('Reply sent successfully!');
      }
    } catch (error) {
      console.error('Error sending reply:', error);
    }
    setSendingReply(false);
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
            <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <User className="w-4 h-4 mr-2" />
                  {profile?.name}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={profileForm.name}
                      onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Institution</Label>
                    <Input
                      value={profileForm.institution}
                      onChange={(e) => setProfileForm({ ...profileForm, institution: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Bio</Label>
                    <Textarea
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label>Research Interests (comma-separated)</Label>
                    <Input
                      value={profileForm.researchInterests}
                      onChange={(e) => setProfileForm({ ...profileForm, researchInterests: e.target.value })}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={submitting}>
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Changes'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
            </div>
          </div>
        </nav>

        <div className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl mb-2 text-gray-900">Welcome back, {profile?.name}</h1>
          <p className="text-gray-600">Manage your research domains and publications</p>
        </div>

        <Tabs defaultValue="domains" className="space-y-6">
          <TabsList>
            <TabsTrigger value="domains">
              <BookOpen className="w-4 h-4 mr-2" />
              Research Domains
            </TabsTrigger>
            <TabsTrigger value="papers">
              <FileText className="w-4 h-4 mr-2" />
              Papers
            </TabsTrigger>
            <TabsTrigger value="messages">
              <Mail className="w-4 h-4 mr-2" />
              Messages
              {unreadCount > 0 && (
                <Badge className="ml-2 bg-red-500">{unreadCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Domains Tab */}
          <TabsContent value="domains">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-gray-900">Your Research Domains</h2>
              <Dialog open={showDomainDialog} onOpenChange={setShowDomainDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Domain
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Research Domain</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreateDomain} className="space-y-4">
                    <div>
                      <Label>Domain Name</Label>
                      <Input
                        value={domainForm.name}
                        onChange={(e) => setDomainForm({ ...domainForm, name: e.target.value })}
                        placeholder="e.g., Machine Learning"
                        required
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={domainForm.description}
                        onChange={(e) => setDomainForm({ ...domainForm, description: e.target.value })}
                        placeholder="Describe this research area..."
                        rows={3}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Domain'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {domains.length === 0 ? (
              <Card className="p-12 text-center">
                <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No research domains yet</p>
                <Button onClick={() => setShowDomainDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Domain
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {domains.map((domain) => (
                  <Card key={domain.id} className="p-6">
                    <h3 className="text-xl mb-2 text-gray-900">{domain.name}</h3>
                    <p className="text-gray-600 text-sm mb-4">{domain.description}</p>
                    <div className="text-xs text-gray-500">
                      {papers.filter(p => p.domainId === domain.id).length} papers
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Papers Tab */}
          <TabsContent value="papers">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl text-gray-900">Your Publications</h2>
              <Dialog open={showPaperDialog} onOpenChange={setShowPaperDialog}>
                <DialogTrigger asChild>
                  <Button>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Paper
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Upload Research Paper</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleUploadPaper} className="space-y-4">
                    <div>
                      <Label>Paper Title</Label>
                      <Input
                        value={paperForm.title}
                        onChange={(e) => setPaperForm({ ...paperForm, title: e.target.value })}
                        placeholder="Enter paper title"
                        required
                      />
                    </div>
                    <div>
                      <Label>Description</Label>
                      <Textarea
                        value={paperForm.description}
                        onChange={(e) => setPaperForm({ ...paperForm, description: e.target.value })}
                        placeholder="Brief description of the paper..."
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label>Research Domain (optional)</Label>
                      <select
                        value={paperForm.domainId}
                        onChange={(e) => setPaperForm({ ...paperForm, domainId: e.target.value })}
                        className="w-full border rounded-md p-2"
                      >
                        <option value="">Select a domain</option>
                        {domains.map((domain) => (
                          <option key={domain.id} value={domain.id}>
                            {domain.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <Label>PDF File</Label>
                      <Input
                        type="file"
                        accept=".pdf"
                        onChange={(e) => setPaperForm({ ...paperForm, file: e.target.files?.[0] || null })}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={submitting}>
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Upload Paper'}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {papers.length === 0 ? (
              <Card className="p-12 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No papers uploaded yet</p>
                <Button onClick={() => setShowPaperDialog(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Your First Paper
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {papers.map((paper) => (
                  <Card key={paper.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl mb-2 text-gray-900">{paper.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{paper.description}</p>
                        <div className="flex items-center gap-4 text-sm">
                          {paper.domainId && (
                            <Badge variant="secondary">
                              {domains.find(d => d.id === paper.domainId)?.name}
                            </Badge>
                          )}
                          <span className="text-gray-500">
                            {new Date(paper.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePaper(paper.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <h2 className="text-2xl mb-6 text-gray-900">Inbox</h2>
            {messages.length === 0 ? (
              <Card className="p-12 text-center bg-white">
                <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No messages yet</p>
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
                    <div className="flex gap-2">
                      {!message.read && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => markAsRead(message.id)}
                        >
                          Mark as Read
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleReplyToMessage(message)}
                      >
                        <Reply className="w-4 h-4 mr-2" />
                        Reply to Student
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
        </div>
      </div>

      {/* Reply Dialog */}
      <Dialog open={showReplyDialog} onOpenChange={setShowReplyDialog}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Reply to {selectedMessage?.senderName}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSendReply} className="space-y-4">
            <div>
              <Label>Subject</Label>
              <Input
                value={replyForm.subject}
                onChange={(e) => setReplyForm({ ...replyForm, subject: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>Message</Label>
              <Textarea
                value={replyForm.content}
                onChange={(e) => setReplyForm({ ...replyForm, content: e.target.value })}
                placeholder="Write your reply here..."
                rows={6}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={sendingReply}>
              {sendingReply ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Reply
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
