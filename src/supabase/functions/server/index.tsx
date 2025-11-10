import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', cors());
app.use('*', logger(console.log));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

// Initialize storage bucket on startup
const BUCKET_NAME = 'make-712c4645-papers';
const { data: buckets } = await supabase.storage.listBuckets();
const bucketExists = buckets?.some(bucket => bucket.name === BUCKET_NAME);
if (!bucketExists) {
  await supabase.storage.createBucket(BUCKET_NAME, { public: false });
  console.log(`Created bucket: ${BUCKET_NAME}`);
}

// ===== AUTH ROUTES =====

// Sign up new user
app.post('/make-server-712c4645/signup', async (c) => {
  try {
    const { email, password, name, role, bio, institution, researchInterests } = await c.req.json();
    
    if (!email || !password || !name || !role) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    if (role !== 'student' && role !== 'teacher') {
      return c.json({ error: 'Invalid role. Must be student or teacher' }, 400);
    }

    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name, role, bio: bio || '', institution: institution || '', researchInterests: researchInterests || [] },
      email_confirm: true // Automatically confirm since email server not configured
    });

    if (error) {
      console.log('Error creating user during signup:', error);
      return c.json({ error: error.message }, 400);
    }

    // Store user profile in KV store
    await kv.set(`user:${data.user.id}`, {
      id: data.user.id,
      email,
      name,
      role,
      bio: bio || '',
      institution: institution || '',
      researchInterests: researchInterests || [],
      createdAt: new Date().toISOString()
    });

    return c.json({ success: true, user: data.user });
  } catch (error) {
    console.log('Unexpected error during signup:', error);
    return c.json({ error: 'Signup failed' }, 500);
  }
});

// ===== USER ROUTES =====

// Get current user profile
app.get('/make-server-712c4645/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    
    if (!profile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    return c.json({ profile });
  } catch (error) {
    console.log('Error fetching profile:', error);
    return c.json({ error: 'Failed to fetch profile' }, 500);
  }
});

// Update user profile
app.put('/make-server-712c4645/profile', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const updates = await c.req.json();
    const currentProfile = await kv.get(`user:${user.id}`);
    
    if (!currentProfile) {
      return c.json({ error: 'Profile not found' }, 404);
    }

    const updatedProfile = { ...currentProfile, ...updates };
    await kv.set(`user:${user.id}`, updatedProfile);

    return c.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.log('Error updating profile:', error);
    return c.json({ error: 'Failed to update profile' }, 500);
  }
});

// Get all teachers
app.get('/make-server-712c4645/teachers', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const allUsers = await kv.getByPrefix('user:');
    const teachers = allUsers.filter((u: any) => u.role === 'teacher');

    return c.json({ teachers });
  } catch (error) {
    console.log('Error fetching teachers:', error);
    return c.json({ error: 'Failed to fetch teachers' }, 500);
  }
});

// Get specific teacher profile
app.get('/make-server-712c4645/teachers/:teacherId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const teacherId = c.req.param('teacherId');
    const teacher = await kv.get(`user:${teacherId}`);
    
    if (!teacher || teacher.role !== 'teacher') {
      return c.json({ error: 'Teacher not found' }, 404);
    }

    return c.json({ teacher });
  } catch (error) {
    console.log('Error fetching teacher:', error);
    return c.json({ error: 'Failed to fetch teacher' }, 500);
  }
});

// ===== RESEARCH DOMAIN ROUTES =====

// Create research domain
app.post('/make-server-712c4645/domains', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'teacher') {
      return c.json({ error: 'Only teachers can create domains' }, 403);
    }

    const { name, description } = await c.req.json();
    
    if (!name) {
      return c.json({ error: 'Domain name is required' }, 400);
    }

    const domainId = crypto.randomUUID();
    const domain = {
      id: domainId,
      name,
      description: description || '',
      teacherId: user.id,
      createdAt: new Date().toISOString()
    };

    await kv.set(`domain:${domainId}`, domain);
    await kv.set(`teacher:${user.id}:domain:${domainId}`, domainId);

    return c.json({ success: true, domain });
  } catch (error) {
    console.log('Error creating domain:', error);
    return c.json({ error: 'Failed to create domain' }, 500);
  }
});

// Get domains by teacher
app.get('/make-server-712c4645/teachers/:teacherId/domains', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const teacherId = c.req.param('teacherId');
    const domainIds = await kv.getByPrefix(`teacher:${teacherId}:domain:`);
    const domains = await Promise.all(
      domainIds.map((id: string) => kv.get(`domain:${id}`))
    );

    return c.json({ domains: domains.filter(Boolean) });
  } catch (error) {
    console.log('Error fetching domains:', error);
    return c.json({ error: 'Failed to fetch domains' }, 500);
  }
});

// ===== PAPER ROUTES =====

// Upload paper
app.post('/make-server-712c4645/papers', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const profile = await kv.get(`user:${user.id}`);
    if (!profile || profile.role !== 'teacher') {
      return c.json({ error: 'Only teachers can upload papers' }, 403);
    }

    const { title, description, domainId, fileData, fileName } = await c.req.json();
    
    if (!title || !fileData || !fileName) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Decode base64 file data
    const base64Data = fileData.split(',')[1] || fileData;
    const fileBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    const paperId = crypto.randomUUID();
    const filePath = `${user.id}/${paperId}_${fileName}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: false
      });

    if (uploadError) {
      console.log('Error uploading file to storage:', uploadError);
      return c.json({ error: 'Failed to upload file' }, 500);
    }

    const paper = {
      id: paperId,
      title,
      description: description || '',
      domainId: domainId || null,
      teacherId: user.id,
      fileName,
      filePath,
      createdAt: new Date().toISOString()
    };

    await kv.set(`paper:${paperId}`, paper);
    await kv.set(`teacher:${user.id}:paper:${paperId}`, paperId);
    
    if (domainId) {
      await kv.set(`domain:${domainId}:paper:${paperId}`, paperId);
    }

    return c.json({ success: true, paper });
  } catch (error) {
    console.log('Error uploading paper:', error);
    return c.json({ error: 'Failed to upload paper' }, 500);
  }
});

// Get papers by teacher
app.get('/make-server-712c4645/teachers/:teacherId/papers', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const teacherId = c.req.param('teacherId');
    const paperIds = await kv.getByPrefix(`teacher:${teacherId}:paper:`);
    const papers = await Promise.all(
      paperIds.map((id: string) => kv.get(`paper:${id}`))
    );

    return c.json({ papers: papers.filter(Boolean) });
  } catch (error) {
    console.log('Error fetching papers:', error);
    return c.json({ error: 'Failed to fetch papers' }, 500);
  }
});

// Get papers by domain
app.get('/make-server-712c4645/domains/:domainId/papers', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const domainId = c.req.param('domainId');
    const paperIds = await kv.getByPrefix(`domain:${domainId}:paper:`);
    const papers = await Promise.all(
      paperIds.map((id: string) => kv.get(`paper:${id}`))
    );

    return c.json({ papers: papers.filter(Boolean) });
  } catch (error) {
    console.log('Error fetching papers for domain:', error);
    return c.json({ error: 'Failed to fetch papers' }, 500);
  }
});

// Download paper (get signed URL)
app.get('/make-server-712c4645/papers/:paperId/download', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const paperId = c.req.param('paperId');
    const paper = await kv.get(`paper:${paperId}`);
    
    if (!paper) {
      return c.json({ error: 'Paper not found' }, 404);
    }

    // Generate signed URL (valid for 1 hour)
    const { data, error: signedUrlError } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(paper.filePath, 3600);

    if (signedUrlError || !data) {
      console.log('Error creating signed URL for paper download:', signedUrlError);
      return c.json({ error: 'Failed to generate download URL' }, 500);
    }

    return c.json({ downloadUrl: data.signedUrl });
  } catch (error) {
    console.log('Error getting paper download URL:', error);
    return c.json({ error: 'Failed to get download URL' }, 500);
  }
});

// Delete paper
app.delete('/make-server-712c4645/papers/:paperId', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const paperId = c.req.param('paperId');
    const paper = await kv.get(`paper:${paperId}`);
    
    if (!paper) {
      return c.json({ error: 'Paper not found' }, 404);
    }

    if (paper.teacherId !== user.id) {
      return c.json({ error: 'Unauthorized to delete this paper' }, 403);
    }

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([paper.filePath]);

    if (deleteError) {
      console.log('Error deleting file from storage:', deleteError);
    }

    // Delete from KV store
    await kv.del(`paper:${paperId}`);
    await kv.del(`teacher:${user.id}:paper:${paperId}`);
    
    if (paper.domainId) {
      await kv.del(`domain:${paper.domainId}:paper:${paperId}`);
    }

    return c.json({ success: true });
  } catch (error) {
    console.log('Error deleting paper:', error);
    return c.json({ error: 'Failed to delete paper' }, 500);
  }
});

// ===== MESSAGING ROUTES =====

// Send message
app.post('/make-server-712c4645/messages', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const { receiverId, subject, content } = await c.req.json();
    
    if (!receiverId || !subject || !content) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const receiver = await kv.get(`user:${receiverId}`);
    if (!receiver) {
      return c.json({ error: 'Receiver not found' }, 404);
    }

    const messageId = crypto.randomUUID();
    const message = {
      id: messageId,
      senderId: user.id,
      receiverId,
      subject,
      content,
      read: false,
      createdAt: new Date().toISOString()
    };

    await kv.set(`message:${messageId}`, message);
    await kv.set(`user:${receiverId}:inbox:${messageId}`, messageId);
    await kv.set(`user:${user.id}:sent:${messageId}`, messageId);

    return c.json({ success: true, message });
  } catch (error) {
    console.log('Error sending message:', error);
    return c.json({ error: 'Failed to send message' }, 500);
  }
});

// Get inbox messages
app.get('/make-server-712c4645/messages/inbox', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const messageIds = await kv.getByPrefix(`user:${user.id}:inbox:`);
    const messages = await Promise.all(
      messageIds.map((id: string) => kv.get(`message:${id}`))
    );

    // Get sender info for each message
    const messagesWithSender = await Promise.all(
      messages.filter(Boolean).map(async (msg: any) => {
        const sender = await kv.get(`user:${msg.senderId}`);
        return {
          ...msg,
          senderName: sender?.name || 'Unknown',
          senderEmail: sender?.email || ''
        };
      })
    );

    // Sort by date (newest first)
    messagesWithSender.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return c.json({ messages: messagesWithSender });
  } catch (error) {
    console.log('Error fetching inbox:', error);
    return c.json({ error: 'Failed to fetch messages' }, 500);
  }
});

// Mark message as read
app.put('/make-server-712c4645/messages/:messageId/read', async (c) => {
  try {
    const accessToken = c.req.header('Authorization')?.split(' ')[1];
    const { data: { user }, error } = await supabase.auth.getUser(accessToken);
    
    if (error || !user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const messageId = c.req.param('messageId');
    const message = await kv.get(`message:${messageId}`);
    
    if (!message) {
      return c.json({ error: 'Message not found' }, 404);
    }

    if (message.receiverId !== user.id) {
      return c.json({ error: 'Unauthorized' }, 403);
    }

    message.read = true;
    await kv.set(`message:${messageId}`, message);

    return c.json({ success: true });
  } catch (error) {
    console.log('Error marking message as read:', error);
    return c.json({ error: 'Failed to mark message as read' }, 500);
  }
});

Deno.serve(app.fetch);
