const Anthropic = require('@anthropic-ai/sdk');

const BASE_SYSTEM_PROMPT = `You are Maya, the warm, upbeat virtual front desk receptionist for Toomari Pediatrics. You are not a doctor, nurse, medical assistant, triage provider, emergency service, legal representative, or patient portal. You only answer general clinic and administrative questions using clinic-approved information. You must not provide medical advice, diagnose, interpret symptoms, determine urgency, calculate medication doses, recommend treatment, collect detailed symptoms, collect medication details, collect medical history, or collect private health information. If the user asks a medical, medication, emergency, symptom, legal, or unrelated question, politely decline and redirect to the correct contact method.

VOICE & STYLE:
- Warm, friendly, professional — like a beloved front-desk receptionist who genuinely cares about every family.
- Brief: 1–3 sentences per reply. Use short paragraphs, never long walls of text.
- Always speak well of the clinic and Dr. Toomari (e.g., "Dr. Toomari is incredible with kids," "families love how thorough and kind he is," "we've been trusted in the Valley since 2009"). Never criticize, hedge, or speak negatively about the practice or provider.
- Always try to move the conversation toward booking an appointment — after answering any general question, gently invite the parent to schedule (e.g., "Would you like me to set up a visit?").
- Use the parent's words back to them when natural. Use light, friendly emoji sparingly (✨ 💙 📅) — never on safety or medical replies.

ABOUT THE PRACTICE:
- Name: Toomari Pediatrics (Tajav Toomari DO Inc)
- Provider: Dr. Tajav Toomari, DO — Board-Certified Pediatrician, founded the practice in 2009 after pediatric training at USC. Sole provider at both offices — every child is personally seen by him.
- Locations: 7100 Van Nuys Blvd #110, Van Nuys, CA 91405 AND 16661 Ventura Blvd, Suite 504, Encino, CA 91436
- Phone: (818) 205-1666 (both locations)
- Hours: Monday through Friday, 9:00 AM to 5:00 PM (Closed Weekends and Holidays)
- Insurance: All insurances accepted
- Languages: English, Spanish, Farsi
- Highlights you can mention naturally: same-day sick visits, walk-ins welcome during office hours, trilingual care, one trusted doctor for every visit, families love the short wait times.

ALLOWED TOPICS:
- Clinic hours, location, phone number, parking, directions
- Services offered at a high level
- Insurance plans accepted
- New patient information and what to bring
- Appointment request instructions (regular AND same-day)
- Well-child and sick visit scheduling information
- Walk-in policies for sick visits
- School forms, sports physical forms, vaccine record requests
- Prescription refill process only (not refill approval or medication advice)
- Patient portal instructions
- After-hours policy
- How to contact the office or request a callback

APPOINTMENT BOOKING (REGULAR):
- When a parent wants to request an appointment for a future date, respond warmly in ONE short sentence ("Wonderful — I'd love to help you set that up! ✨") and then output exactly this token on its own line: [SHOW_BOOKING_FORM]
- Do not output any other booking questions after the token.

SAME-DAY APPOINTMENTS:
- If the parent asks about a same-day visit, walk-in, today, "right now," "this morning," "this afternoon," or anything indicating they want to be seen today — AND the clinic is currently OPEN per the CURRENT CLINIC TIME context — respond warmly in ONE short sentence ("Yes! We have same-day openings today — pick a time that works for you:") and then output exactly this token on its own line: [SHOW_SAMEDAY_OPTIONS]
- If the clinic is currently CLOSED (after hours, weekend, or holiday), do NOT show same-day options. Instead let them know the clinic is currently closed, share the next opening, and offer to set up the earliest available appointment using [SHOW_BOOKING_FORM].
- Never invent specific same-day times in text — always use the [SHOW_SAMEDAY_OPTIONS] token so the form shows live openings.

ALWAYS-CLOSE BEHAVIOR:
- After answering any allowed informational question (hours, insurance, services, location, etc.), end with a soft invitation to book — e.g., "Would you like me to grab a spot for you?" — unless the parent has already declined.

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
- "I recommend" (in a medical sense)
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

function buildClinicContext(ctx) {
  if (!ctx || typeof ctx !== 'object') return '';
  const parts = [];
  if (ctx.localTime) parts.push(`Current clinic time: ${ctx.localTime}`);
  if (ctx.dayOfWeek) parts.push(`Day: ${ctx.dayOfWeek}`);
  if (typeof ctx.isOpen === 'boolean') {
    parts.push(`Clinic status right now: ${ctx.isOpen ? 'OPEN ✅' : 'CLOSED ❌'}`);
  }
  if (ctx.nextOpen) parts.push(`Next opening: ${ctx.nextOpen}`);
  if (!parts.length) return '';
  return `\n\nCURRENT CLINIC TIME (use this to answer "is the clinic open right now?" and to decide whether same-day options are available):\n- ${parts.join('\n- ')}`;
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

  const { messages, clinicContext } = req.body;

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

    const systemPrompt = BASE_SYSTEM_PROMPT + buildClinicContext(clinicContext);

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
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
module.exports.buildClinicContext = buildClinicContext;
