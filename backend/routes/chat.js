const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const ChatSession = require('../models/ChatSession');
const { protect } = require('../middleware/auth');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are MedAssist AI, a compassionate and knowledgeable medical assistant. Your role is to:

1. Provide helpful, accurate health information and guidance
2. Help users understand symptoms, conditions, and medications
3. Offer evidence-based health advice and lifestyle recommendations
4. Triage urgency (suggest emergency care when needed)
5. Provide emotional support for health anxiety

IMPORTANT GUIDELINES:
- Always remind users you are an AI and NOT a replacement for professional medical advice
- For any emergency symptoms (chest pain, difficulty breathing, stroke signs, severe bleeding), immediately advise calling emergency services (112 in India, 911 in USA)
- Be empathetic, clear, and avoid medical jargon when possible
- When discussing medications, always recommend consulting a pharmacist or doctor
- Maintain patient privacy and confidentiality
- Do not diagnose conditions definitively — suggest possibilities and recommend professional evaluation
- Use simple language and bullet points for clarity
- Ask clarifying questions when needed to better understand the user's situation

Format responses with:
- Clear headings using **bold**
- Bullet points for lists
- ⚠️ for warnings
- ✅ for positive advice
- 🚨 for emergency situations`;

// POST /api/chat/session - Create new session
router.post('/session', protect, async (req, res) => {
  try {
    const { title, category } = req.body;
    const session = await ChatSession.create({
      user: req.user._id,
      title: title || 'New Consultation',
      category: category || 'general',
      messages: []
    });
    res.status(201).json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/sessions - Get all sessions for user
router.get('/sessions', protect, async (req, res) => {
  try {
    const sessions = await ChatSession.find({
      user: req.user._id,
      isArchived: false
    })
    .select('title category createdAt updatedAt messages')
    .sort({ updatedAt: -1 });

    // Add message count and last message preview
    const sessionsWithMeta = sessions.map(s => ({
      _id: s._id,
      title: s.title,
      category: s.category,
      messageCount: s.messages.length,
      lastMessage: s.messages[s.messages.length - 1]?.content?.slice(0, 80) || '',
      updatedAt: s.updatedAt,
      createdAt: s.createdAt
    }));

    res.json({ sessions: sessionsWithMeta });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/session/:id - Get single session
router.get('/session/:id', protect, async (req, res) => {
  try {
    const session = await ChatSession.findOne({
      _id: req.params.id,
      user: req.user._id
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/message - Send message to AI
router.post('/message', protect, async (req, res) => {
  try {
    const { sessionId, message, userProfile } = req.body;

    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }

    const session = await ChatSession.findOne({
      _id: sessionId,
      user: req.user._id
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Add user message
    session.messages.push({ role: 'user', content: message });

    // Build context-aware system prompt
    let contextualSystem = SYSTEM_PROMPT;
    if (userProfile) {
      contextualSystem += `\n\nPATIENT CONTEXT:
- Age: ${userProfile.age || 'Unknown'}
- Gender: ${userProfile.gender || 'Unknown'}
- Blood Group: ${userProfile.bloodGroup || 'Unknown'}
- Known Allergies: ${userProfile.allergies?.join(', ') || 'None reported'}
- Existing Conditions: ${userProfile.conditions?.join(', ') || 'None reported'}
- Current Medications: ${userProfile.medications?.join(', ') || 'None reported'}

Use this context to provide personalized advice.`;
    }

    // Format messages for Anthropic
    const anthropicMessages = session.messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // Call Claude AI
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: contextualSystem,
      messages: anthropicMessages
    });

    const aiReply = response.content[0].text;

    // Add AI response
    session.messages.push({ role: 'assistant', content: aiReply });

    // Auto-generate title from first message
    if (session.messages.length === 2 && session.title === 'New Consultation') {
      session.title = message.slice(0, 60) + (message.length > 60 ? '...' : '');
    }

    await session.save();

    res.json({
      reply: aiReply,
      sessionId: session._id,
      messageCount: session.messages.length
    });
  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ error: 'AI service error: ' + err.message });
  }
});

// DELETE /api/chat/session/:id - Archive session
router.delete('/session/:id', protect, async (req, res) => {
  try {
    await ChatSession.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { isArchived: true }
    );
    res.json({ message: 'Session archived' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
