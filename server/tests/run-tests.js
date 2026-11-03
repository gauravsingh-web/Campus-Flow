require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const assert = require('assert');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const StudentProfile = require('../src/models/StudentProfile');
const FacultyProfile = require('../src/models/FacultyProfile');
const Room = require('../src/models/Room');
const Booking = require('../src/models/Booking');
const Event = require('../src/models/Event');
const EventRegistration = require('../src/models/EventRegistration');
const LostFoundItem = require('../src/models/LostFoundItem');
const { checkBookingConflict, timeToMinutes } = require('../src/services/bookingService');
const { findPotentialMatches, calculateJaccardSimilarity, calculateLocationScore, calculateDateScore } = require('../src/services/matchingService');
const { verifyCampusIdentityToken, verifyEventTicket, generateQrDataUrl } = require('../src/services/qrService');

async function runTestSuite() {
  console.log('\n===========================================================');
  console.log('       CAMPUSFLOW AUTOMATED SYSTEM TEST SUITE             ');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         -> ${err.message}`);
      failed++;
    }
  }

  async function asyncTest(name, fn) {
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  [FAIL] ${name}`);
      console.error(`         -> ${err.message}`);
      failed++;
    }
  }

  try {
    await connectDB();

    console.log('\n--- 1. Algorithm & Unit Tests ---');
    test('timeToMinutes converts HH:mm accurately', () => {
      assert.strictEqual(timeToMinutes('09:30'), 570);
      assert.strictEqual(timeToMinutes('00:00'), 0);
      assert.strictEqual(timeToMinutes('23:59'), 1439);
    });

    test('calculateJaccardSimilarity computes keyword overlap', () => {
      const score1 = calculateJaccardSimilarity(['blue', 'dell', 'laptop'], ['blue', 'dell', 'backpack']);
      assert.ok(score1 > 0.4, 'Jaccard score should reflect common terms');

      const score2 = calculateJaccardSimilarity(['casio', 'calculator'], ['yamaha', 'bike', 'keys']);
      assert.strictEqual(score2, 0, 'Disjoint terms should yield 0');
    });

    test('calculateLocationScore computes campus proximity', () => {
      const scoreSame = calculateLocationScore('Central Library 1st Floor', 'Central Library 1st Floor');
      assert.strictEqual(scoreSame, 1.0);

      const scorePartial = calculateLocationScore('Central Library First Floor', 'Central Library Reading Hall');
      assert.ok(scorePartial > 0.2);
    });

    test('calculateDateScore prioritizes recent reciprocal reports', () => {
      const today = new Date();
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const lastMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      assert.strictEqual(calculateDateScore(today, yesterday), 1.0);
      assert.strictEqual(calculateDateScore(today, lastMonth), 0.05);
    });

    console.log('\n--- 2. Database & Domain Service Integration Tests ---');

    // Setup Test Fixtures
    const testStudent = new User({
      name: 'Test Student',
      email: `test.student.${Date.now()}@campusflow.edu`,
      password: 'StudentPassword123',
      role: 'student',
    });
    await testStudent.save();

    const testRoom = new Room({
      roomId: `TEST-R-${Date.now().toString().slice(-4)}`,
      name: 'Test Experimental Lab',
      type: 'Laboratory',
      building: 'Engineering Block',
      capacity: 40,
    });
    await testRoom.save();

    await asyncTest('User password hashing and comparison works', async () => {
      const retrieved = await User.findById(testStudent._id).select('+password');
      assert.notStrictEqual(retrieved.password, 'StudentPassword123', 'Password must be hashed');

      const isMatch = await retrieved.comparePassword('StudentPassword123');
      assert.strictEqual(isMatch, true, 'comparePassword should return true for valid password');

      const isBadMatch = await retrieved.comparePassword('WrongPassword');
      assert.strictEqual(isBadMatch, false, 'comparePassword should return false for wrong password');
    });

    await asyncTest('Room booking overlap conflict prevention detects concurrent slots', async () => {
      const testDate = new Date();
      testDate.setDate(testDate.getDate() + 10);

      // Create an approved booking from 10:00 to 12:00
      const baseBooking = new Booking({
        room: testRoom._id,
        requester: testStudent._id,
        purpose: 'Test Conflict Base',
        date: testDate,
        startTime: '10:00',
        endTime: '12:00',
        status: 'Approved',
      });
      await baseBooking.save();

      // Test 1: Overlapping slot (11:00 - 13:00) must conflict
      const check1 = await checkBookingConflict(testRoom._id, testDate, '11:00', '13:00');
      assert.strictEqual(check1.hasConflict, true, '11:00-13:00 should conflict with 10:00-12:00');

      // Test 2: Internal slot (10:30 - 11:30) must conflict
      const check2 = await checkBookingConflict(testRoom._id, testDate, '10:30', '11:30');
      assert.strictEqual(check2.hasConflict, true, '10:30-11:30 should conflict with 10:00-12:00');

      // Test 3: Adjacent non-overlapping slot (12:00 - 13:00) must be allowed
      const check3 = await checkBookingConflict(testRoom._id, testDate, '12:00', '13:00');
      assert.strictEqual(check3.hasConflict, false, '12:00-13:00 should NOT conflict with 10:00-12:00');

      await Booking.findByIdAndDelete(baseBooking._id);
    });

    await asyncTest('Intelligent Lost & Found matching finds reciprocal item pair', async () => {
      const lostItem = new LostFoundItem({
        title: 'Dell Laptop Backpack Navy Blue',
        description: 'Navy blue Dell padded backpack with charger',
        category: 'Electronics',
        reportType: 'Lost',
        reporter: testStudent._id,
        location: 'Central Library First Floor',
        dateLostFound: new Date(),
        status: 'Open',
      });
      await lostItem.save();

      const foundItem = new LostFoundItem({
        title: 'Found Navy Blue Dell Laptop Bag',
        description: 'Blue Dell backpack found with power adapter',
        category: 'Electronics',
        reportType: 'Found',
        reporter: testStudent._id,
        location: 'Central Library 1st Floor Study Cubicle',
        dateLostFound: new Date(),
        status: 'Open',
      });
      await foundItem.save();

      const matches = await findPotentialMatches(lostItem._id);
      assert.ok(Array.isArray(matches), 'Matches should return an array');
      assert.ok(matches.length > 0, 'Should find reciprocal match');
      assert.ok(matches[0].score >= 40, `Match score should be high (got ${matches[0].score}%)`);

      await LostFoundItem.deleteMany({ _id: { $in: [lostItem._id, foundItem._id] } });
    });

    await asyncTest('QR Identity verification validates token and rejects invalid ones', async () => {
      assert.ok(testStudent.qrToken, 'Student should have an auto-generated qrToken');

      const validCheck = await verifyCampusIdentityToken(testStudent.qrToken);
      assert.strictEqual(validCheck.valid, true, 'Valid qrToken must return true');
      assert.strictEqual(validCheck.user.email, testStudent.email);

      const invalidCheck = await verifyCampusIdentityToken('FAKE-NONEXISTENT-TOKEN-999');
      assert.strictEqual(invalidCheck.valid, false, 'Non-existent token must return false');
    });

    await asyncTest('QR image generator produces valid base64 data URL', async () => {
      const dataUrl = await generateQrDataUrl('TEST-CAMPUS-TOKEN');
      assert.ok(dataUrl.startsWith('data:image/png;base64,'), 'QR generator must output base64 data URL');
    });

    await asyncTest('Event attendance token verification records check-in and prevents duplicate', async () => {
      const testEvent = new Event({
        title: 'Test Cyber Seminar',
        description: 'Test seminar event description',
        category: 'Technical',
        organizer: testStudent._id,
        date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        startTime: '10:00 AM',
        endTime: '12:00 PM',
        venue: 'Room 101',
        registrationDeadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        capacity: 50,
      });
      await testEvent.save();

      const reg = new EventRegistration({
        event: testEvent._id,
        user: testStudent._id,
      });
      await reg.save();

      // First check-in
      const checkin1 = await verifyEventTicket(testEvent._id, reg.ticketToken);
      assert.strictEqual(checkin1.valid, true, 'First checkin must be valid');

      // Second check-in attempt with same ticket must be rejected as duplicate
      const checkin2 = await verifyEventTicket(testEvent._id, reg.ticketToken);
      assert.strictEqual(checkin2.valid, false, 'Duplicate checkin must be rejected');
      assert.strictEqual(checkin2.alreadyAttended, true);

      await Event.findByIdAndDelete(testEvent._id);
      await EventRegistration.findByIdAndDelete(reg._id);
    });

    // Cleanup fixtures
    await User.findByIdAndDelete(testStudent._id);
    await Room.findByIdAndDelete(testRoom._id);

    console.log('\n===========================================================');
    console.log(` TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('===========================================================\n');

    await disconnectDB();
    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error) {
    console.error('Test execution error:', error);
    await disconnectDB();
    process.exit(1);
  }
}

runTestSuite();
