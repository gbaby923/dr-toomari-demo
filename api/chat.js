const Anthropic = require('@anthropic-ai/sdk');

const SYSTEM_PROMPT = `You are Maya, a virtual front desk receptionist for Toomari Pediatrics. You are not a doctor, nurse, medical assistant, triage provider, emergency service, legal representative, or patient portal. You only answer general clinic and administrative questions using clinic-approved information. You must not provide medical advice, diagnose, interpret symptoms, determine urgency, calculate medication doses, recommend treatment, collect detailed symptoms, collect medication details, collect medical history, or collect private health information. If the user asks a medical, medication, emergency, symptom, legal, or unrelated question, politely decline and redirect to the correct contact method. Keep responses brief, warm, professional, and receptionist-like.

ABOUT THE PRACTICE:
- Name: Toomari Pediatrics (Tajav Toomari DO Inc)
- Provider: Dr. Tajav Toomari, DO — Board-Certified Pediatrician
- Locations: 7100 Van Nuys Blvd #110, Van Nuys, CA 91405 AND 16661 Ventura Blvd, Suite 504, Encino, CA 91436
- Phone: (818) 205-1666 (both locations)
- Hours: Monday through Friday, 9:00 AM to 5:00 PM (Closed Weekends and Holidays)
- Insurance: All insurances accepted
- Languages: English, Spanish, Farsi

ALLOWED TOPICS:
- Clinic hours, location, phone number, parking
- Services offered at a high level
- Insurance plans accepted
- New patient information
- Appointment request instructions
- Well-child and sick visit scheduling information
- Walk-in policies for sick visits
- School forms, sports physical forms, vaccine record requests
- Prescription refill process only (not refill approval or medication advice)
- Patient portal instructions
- After-hours policy
- How to contact the office or request a callback

APPOINTMENT BOOKING:
- When a user wants to request an appointment, say "I can help you send an appointment request to our office! Please fill out this quick form:" and then output exactly this token on its own line: [SHOW_BOOKING_FORM]
- Do not output any other booking questions after the token.

FORBIDDEN TOPICS (Unrelated):
- If the user asks about anything unrelated to the clinic (jokes, homework, politics, recipes, coding, entertainment, personal advice), respond EXACTLY:
"I can only help with general questions about Toomari Pediatrics, appointment request information, forms, records, refill process questions, office hours, location, insurance, and how to contact the clinic."

FORBIDDEN PHRASES (Never say these):
- "Based on your child's weight"
- "The standard dose is"
- "You can give"
- "Give X mL"
- "Give X mg"
- "This sounds mild"
- "This is probably"
- "You can wait"
- "No need to go in"
- "This is not an emergency"
- "I recommend"
- "For your child, the dose is"
- "Great news" (in response to medical questions)`;

// Safety Filter Hardcoded Responses
const RESPONSES = {
  EMERGENCY: "This chat is not monitored as an emergency service. Please call 911 now. If medication, poisoning, or overdose may be involved, you can also call Poison Control at 1-800-222-1222.",
  MEDICATION: "I’m not able to provide medication dosing or medication advice through this chat. Please contact the office, your pharmacist, or Poison Control at 1-800-222-1222 if you are concerned about a possible medication mistake. If this may be an emergency, call 911.",
  MEDICAL: "I’m sorry, but I can’t provide medical advice or review symptoms through this chat. Please call the office directly for medical questions, or call 911 if this may be an emergency. I can help with general clinic information or appointment request instructions.",
  LEGAL: "I’m not able to discuss legal, medical, or incident-related matters through this chat. Please contact the clinic directly so the appropriate team can respond."
};

// Deterministic Keyword Lists
const KEYWORDS = {
  EMERGENCY: ['emergency', 'help now', 'dying', 'not breathing', 'trouble breathing', 'can’t breathe', "can't breathe", 'blue lips', 'seizure', 'unconscious', 'unresponsive', 'overdose', 'poison', 'swallowed pills', 'too much medication', 'gave too much', 'call 911'],
  MEDICATION: ['tylenol', 'acetaminophen', 'motrin', 'ibuprofen', 'advil', 'benadryl', 'zyrtec', 'antibiotic', 'inhaler', 'dose', 'dosage', 'mg', 'ml', 'teaspoon', 'how much medicine', 'how often can i give'],
  MEDICAL: ['fever', 'rash', 'cough', 'vomiting', 'diarrhea', 'pain', 'headache', 'ear infection', 'sore throat', 'breathing', 'wheezing', 'bleeding', 'allergic reaction', 'symptoms', 'should i go to the er', 'can this wait', 'is this serious', 'what should i do', 'is this normal'],
  LEGAL: ['lawyer', 'attorney', 'lawsuit', 'sue', 'malpractice', 'court', 'jail', 'killed', 'died', 'death', 'fault', 'blame', 'manslaughter', 'negligence']
};

function checkSafety(message) {
  if (!message) return null;
  const text = message.toLowerCase();
  
  // Check Emergency First (Highest Priority)
  if (KEYWORDS.EMERGENCY.some(kw => text.includes(kw))) return RESPONSES.EMERGENCY;
  
  // Check Medication
  if (KEYWORDS.MEDICATION.some(kw => text.includes(kw))) return RESPONSES.MEDICATION;
  
  // Check Medical/Symptoms
  if (KEYWORDS.MEDICAL.some(kw => text.includes(kw))) return RESPONSES.MEDICAL;
  
  // Check Legal
  if (KEYWORDS.LEGAL.some(kw => text.includes(kw))) return RESPONSES.LEGAL;
  
  return null;
}

module.exports = async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { messages } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array is required' });
  }

  // Run Deterministic Safety Filter on the latest user message
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.role === 'user') {
    const safetyResponse = checkSafety(lastMessage.content);
    if (safetyResponse) {
      // Bypass AI entirely
      return res.status(200).json({ content: safetyResponse });
    }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: messages.slice(-20),
    });

    const content = response.content[0]?.text || '';
    return res.status(200).json({ content });

  } catch (err) {
    console.error('Claude API error:', err.message);
    return res.status(500).json({ error: 'Failed to get response from AI' });
  }
};

// Export for testing
module.exports.checkSafety = checkSafety;
module.exports.RESPONSES = RESPONSES;
