require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const assert = require('assert');
const { connectDB, disconnectDB } = require('../src/config/db');
const User = require('../src/models/User');
const StudentProfile = require('../src/models/StudentProfile');
const Subject = require('../src/models/Subject');
const Timetable = require('../src/models/Timetable');
const DateSheet = require('../src/models/DateSheet');

async function testAll() {
  console.log('[Test] Connecting to DB...');
  await connectDB();

  console.log('[Test] Checking demo logins with password "1234"...');

  const testAccounts = [
    { email: 'admin@ce.du.ac.in', role: 'admin' },
    { email: 'admin@campusflow.edu', role: 'admin' },
    { email: 'faculty@ce.du.ac.in', role: 'faculty' },
    { email: 'student@ce.du.ac.in', role: 'student' },
  ];

  for (const acc of testAccounts) {
    const user = await User.findOne({ email: acc.email }).select('+password');
    assert.ok(user, `User ${acc.email} must exist`);
    assert.strictEqual(user.role, acc.role, `${acc.email} role must be ${acc.role}`);

    const isMatch = await user.comparePassword('1234');
    assert.strictEqual(isMatch, true, `Password "1234" must match for ${acc.email}`);
    console.log(`✓ ${acc.email} (${acc.role}) verified with password "1234"`);
  }

  // Check counts
  const [studentCount, subjectCount, timetableCount, datesheetCount] = await Promise.all([
    StudentProfile.countDocuments(),
    Subject.countDocuments(),
    Timetable.countDocuments(),
    DateSheet.countDocuments(),
  ]);

  console.log(`[Test] Total Student Profiles: ${studentCount}`);
  console.log(`[Test] Total UPC Subjects: ${subjectCount}`);
  console.log(`[Test] Total Timetable Slots: ${timetableCount}`);
  console.log(`[Test] Total Date Sheets: ${datesheetCount}`);

  assert.ok(studentCount >= 338, 'Must have at least 338 student profiles');
  assert.ok(subjectCount >= 142, 'Must have at least 142 subjects');
  assert.ok(timetableCount >= 60, 'Must have at least 60 timetable slots');

  // Test Student search by roll number and enrolment number
  const sampleRoll = '25293916124'; // Yashaswi Singh
  const foundByRoll = await StudentProfile.findOne({ studentId: sampleRoll }).populate('user');
  assert.ok(foundByRoll, `Student with roll ${sampleRoll} must be found`);
  console.log(`✓ Search verified for roll ${sampleRoll}: ${foundByRoll.user.name}`);

  const sampleEnrol = '25DOCEBTCS000124';
  const foundByEnrol = await StudentProfile.findOne({ enrolmentNumber: sampleEnrol });
  assert.ok(foundByEnrol, `Student with enrolment ${sampleEnrol} must be found`);
  console.log(`✓ Search verified for enrolment ${sampleEnrol}`);

  await disconnectDB();
  console.log('\n===========================================================');
  console.log(' ALL VERIFICATION CHECKS PASSED 100% SUCCESSFULLY!');
  console.log('===========================================================');
  process.exit(0);
}

testAll().catch((err) => {
  console.error('[Test Failed]:', err);
  process.exit(1);
});
