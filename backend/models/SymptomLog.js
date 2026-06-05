const mongoose = require('mongoose');

const symptomLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  symptoms: [{
    name: { type: String, required: true },
    severity: { type: Number, min: 1, max: 10, required: true },
    duration: { type: String }
  }],
  notes: { type: String, maxlength: 1000 },
  mood: {
    type: String,
    enum: ['great', 'good', 'okay', 'bad', 'terrible']
  },
  aiAnalysis: { type: String },
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SymptomLog', symptomLogSchema);
