import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Card } from './ui/card';
import logoImage from 'figma:asset/b7290909043e04203d6867936c6efc5d4558266e.png';
import bgImage from 'figma:asset/82eabb1d3b0be5236946e304fb239b048b059ca8.png';

interface AuthFormProps {
  role: 'student' | 'teacher';
  onBack: () => void;
  onAuth: (accessToken: string, userId: string) => void;
}

export function AuthForm({ role, onBack, onAuth }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    institution: '',
    bio: '',
    researchInterests: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        // Sign up
        const { projectId, publicAnonKey } = await import('../utils/supabase/info');
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-712c4645/signup`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              email: formData.email,
              password: formData.password,
              name: formData.name,
              role,
              institution: formData.institution,
              bio: formData.bio,
              researchInterests: formData.researchInterests.split(',').map(s => s.trim()).filter(Boolean)
            })
          }
        );

        const data = await response.json();

        if (!response.ok) {
          setError(data.error || 'Signup failed');
          setLoading(false);
          return;
        }

        // After signup, log them in
        const { createClient } = await import('../utils/supabase/client');
        const supabase = createClient();
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (signInError || !signInData.session) {
          setError(signInError?.message || 'Login after signup failed');
          setLoading(false);
          return;
        }

        onAuth(signInData.session.access_token, signInData.user.id);
      } else {
        // Login
        const { createClient } = await import('../utils/supabase/client');
        const supabase = createClient();
        const { data, error: loginError } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });

        if (loginError || !data.session) {
          setError(loginError?.message || 'Login failed');
          setLoading(false);
          return;
        }

        onAuth(data.session.access_token, data.user.id);
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('An unexpected error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 flex items-center justify-center p-6 relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.12
        }}
      />

      <Card className="w-full max-w-md p-8 relative z-10 bg-white">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <img src={logoImage} alt="GAT Logo" className="w-12 h-12 object-contain" />
            <div className="flex flex-col">
              <span className="text-2xl text-purple-900">ResNet</span>
              <span className="text-xs text-gray-600">Global Academy of Technology</span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-3xl text-gray-900 mb-2">
            {mode === 'login' ? 'Welcome back' : 'Join GAT ResNet'}
          </h2>
          <p className="text-gray-600">
            {mode === 'login' ? 'Sign in' : 'Sign up'} as a {role === 'teacher' ? 'faculty member' : 'student'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
            />
          </div>

          {mode === 'signup' && (
            <>
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                />
              </div>

              <div>
                <Label htmlFor="institution">Institution</Label>
                <Input
                  id="institution"
                  type="text"
                  value={formData.institution || 'Global Academy of Technology'}
                  onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                  placeholder="Global Academy of Technology"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder={role === 'teacher' ? 'Tell students about your research...' : 'Tell us about yourself...'}
                  rows={3}
                />
              </div>

              {role === 'teacher' && (
                <div>
                  <Label htmlFor="interests">Research Interests (comma-separated)</Label>
                  <Input
                    id="interests"
                    type="text"
                    value={formData.researchInterests}
                    onChange={(e) => setFormData({ ...formData, researchInterests: e.target.value })}
                    placeholder="Machine Learning, AI, Computer Vision"
                  />
                </div>
              )}
            </>
          )}

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === 'login' ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
            className="text-purple-600 hover:text-purple-700"
          >
            {mode === 'login' 
              ? "Don't have an account? Sign up" 
              : 'Already have an account? Sign in'}
          </button>
        </div>
      </Card>
    </div>
  );
}
