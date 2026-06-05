const express = require('express');
const Anthropic = require('@anthropic-ai/sdk');
const SymptomLog = require('../models/SymptomLog');
const { protect } = require('../middleware/auth');

const router = express.Router();
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// POST /api/symptoms/log - Log symptoms
router.post('/log', protect, async (req, res) => {
  try {
    const { symptoms, notes, mood } = req.body;

    if (!symptoms || symptoms.length === 0) {
      return res.status(400).json({ error: 'At least one symptom is required' });
    }

    // Get AI analysis
    const symptomText = symptoms
      .map(s => `${s.name} (severity: ${s.severity}/10${s.duration ? ', duration: ' + s.duration : ''})`)
      .join(', ');

    const aiResponse = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `As a medical AI assistant, briefly analyze these symptoms and provide key observations (2-3 sentences max, no diagnosis): ${symptomText}. Notes: ${notes || 'none'}. Mood: ${mood || 'not specified'}.`
      }]
    });

    const aiAnalysis = aiResponse.content[0].text;

    const log = await SymptomLog.create({
      user: req.user._id,
      symptoms,
      notes,
      mood,
      aiAnalysis
    });

    res.status(201).json({ log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/symptoms/logs - Get user's symptom logs
router.get('/logs', protect, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 30;
    const logs = await SymptomLog.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(limit);

    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/symptoms/log/:id
router.delete('/log/:id', protect, async (req, res) => {
  try {
    await SymptomLog.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    res.json({ message: 'Log deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
