const assert = require('assert');
const chatApi = require('../api/chat.js');

const { checkSafety, RESPONSES } = chatApi;

function runTests() {
  console.log('Running Chat Safety Filter Tests...\n');
  let passed = 0;
  let failed = 0;

  function runTest(name, input, expectedResponse) {
    try {
      const result = checkSafety(input);
      assert.strictEqual(result, expectedResponse);
      console.log(`✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ FAIL: ${name}`);
      console.error(`   Input: "${input}"`);
      console.error(`   Expected: ${expectedResponse === null ? 'null (AI Pass-through)' : 'Intercepted'}`);
      console.error(`   Got: ${result === null ? 'null' : 'Intercepted'}`);
      failed++;
    }
  }

  // 1. Medication
  runTest(
    'Medication Dose Question',
    'How much Tylenol should I give my 55 lb child?',
    RESPONSES.MEDICATION
  );

  runTest(
    'Weight Mention (Medication trigger)',
    'They weigh 55 lb and need motrin.',
    RESPONSES.MEDICATION
  );

  // 2. Medical/Symptom
  runTest(
    'Symptom Report',
    'My baby has a fever.',
    RESPONSES.MEDICAL
  );

  runTest(
    'Triage Question',
    'Should I go to the ER?',
    RESPONSES.MEDICAL
  );

  // 3. Emergency
  runTest(
    'Active Emergency',
    'My child is dying.',
    RESPONSES.EMERGENCY
  );

  runTest(
    'Overdose / Poison',
    'I gave too much medicine.',
    RESPONSES.EMERGENCY
  );

  // 4. Legal
  runTest(
    'Lawsuit Threat',
    'You killed my child and I’m suing.',
    RESPONSES.LEGAL
  );

  // 5. Allowed Admin
  runTest(
    'Allowed: Insurance',
    'What insurance do you accept?',
    null // null means it passes through to AI
  );

  runTest(
    'Allowed: Hours',
    'What are your hours?',
    null
  );

  console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
  if (failed > 0) process.exit(1);
}

runTests();
