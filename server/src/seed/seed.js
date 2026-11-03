require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { PDFParse } = require('pdf-parse');
const { connectDB, disconnectDB } = require('../config/db');

// Models
const User = require('../models/User');
const StudentProfile = require('../models/StudentProfile');
const FacultyProfile = require('../models/FacultyProfile');
const Department = require('../models/Department');
const Announcement = require('../models/Announcement');
const Complaint = require('../models/Complaint');
const LostFoundItem = require('../models/LostFoundItem');
const Event = require('../models/Event');
const EventRegistration = require('../models/EventRegistration');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');
const Subject = require('../models/Subject');
const Timetable = require('../models/Timetable');
const DateSheet = require('../models/DateSheet');

async function seedData(isAuto = false) {
  try {
    console.log('===========================================================');
    console.log('[Seed] Starting CampusFlow Realistic University Seeding...');
    console.log('===========================================================');

    // 1. Departments
    console.log('[Seed] Ensuring academic departments...');
    let deptCSE = await Department.findOne({ code: 'CSE' });
    let deptECE = await Department.findOne({ code: 'ECE' });
    let deptEE = await Department.findOne({ code: 'EE' });
    let deptME = await Department.findOne({ code: 'ME' });
    let deptCIVIL = await Department.findOne({ code: 'CIVIL' });

    if (!deptCSE) {
      deptCSE = await Department.create({
        name: 'Department of Computer Science and Engineering',
        code: 'CSE',
        description: 'Focusing on algorithms, artificial intelligence, software systems, and data analytics.',
      });
    }
    if (!deptECE) {
      deptECE = await Department.create({
        name: 'Department of Electronics and Communication Engineering',
        code: 'ECE',
        description: 'Specializing in embedded systems, telecommunications, VLSI, and signal processing.',
      });
    }
    if (!deptEE) {
      deptEE = await Department.create({
        name: 'Department of Electrical Engineering',
        code: 'EE',
        description: 'Specializing in power systems, renewable energy, and control engineering.',
      });
    }
    if (!deptME) {
      deptME = await Department.create({
        name: 'Department of Mechanical Engineering',
        code: 'ME',
        description: 'Encompassing robotics, thermodynamics, CAD/CAM design, and manufacturing.',
      });
    }
    if (!deptCIVIL) {
      deptCIVIL = await Department.create({
        name: 'Department of Civil Engineering',
        code: 'CIVIL',
        description: 'Covering structural analysis, environmental infrastructure, and geotechnical engineering.',
      });
    }

    // 2. Demo Evaluator Accounts
    console.log('[Seed] Configuring Evaluator Demo Accounts...');
    // A. Administrator: admin@ce.du.ac.in / 1234
    let primaryAdmin = await User.findOne({ email: 'admin@ce.du.ac.in' }).select('+password');
    if (!primaryAdmin) {
      primaryAdmin = new User({
        name: 'University Administrator (DU)',
        email: 'admin@ce.du.ac.in',
        password: '1234',
        role: 'admin',
        department: deptCSE._id,
        phone: '+91-11-2766-7777',
        status: 'active',
      });
      await primaryAdmin.save();
    } else {
      primaryAdmin.password = '1234';
      primaryAdmin.status = 'active';
      await primaryAdmin.save();
    }

    // Secondary Admin alias: admin@campusflow.edu / 1234
    let secondaryAdmin = await User.findOne({ email: 'admin@campusflow.edu' }).select('+password');
    if (!secondaryAdmin) {
      secondaryAdmin = new User({
        name: 'CampusFlow System Admin',
        email: 'admin@campusflow.edu',
        password: '1234',
        role: 'admin',
        department: deptCSE._id,
        phone: '+91-11-2766-7778',
        status: 'active',
      });
      await secondaryAdmin.save();
    } else {
      secondaryAdmin.password = '1234';
      secondaryAdmin.status = 'active';
      await secondaryAdmin.save();
    }

    // B. Faculty Demo Account: faculty@ce.du.ac.in / 1234
    let demoFaculty = await User.findOne({ email: 'faculty@ce.du.ac.in' }).select('+password');
    if (!demoFaculty) {
      demoFaculty = new User({
        name: 'Dr. Juhi Jain',
        email: 'faculty@ce.du.ac.in',
        password: '1234',
        role: 'faculty',
        department: deptCSE._id,
        phone: '+91-11-2766-7101',
        status: 'active',
      });
      await demoFaculty.save();
      await FacultyProfile.create({
        user: demoFaculty._id,
        employeeId: 'EMP-CSE-JJ',
        designation: 'Assistant Professor',
        specialization: ['Algorithms', 'Data Structures', 'Automata'],
        officeRoom: 'Block B, Faculty Cabin 204',
        cabinPhone: 'x4102',
      });
    } else {
      demoFaculty.password = '1234';
      demoFaculty.status = 'active';
      await demoFaculty.save();
    }

    // C. Student Demo Account: student@ce.du.ac.in / 1234
    let demoStudent = await User.findOne({ email: 'student@ce.du.ac.in' }).select('+password');
    if (!demoStudent) {
      demoStudent = new User({
        name: 'Aryan Sharma (Demo Student)',
        email: 'student@ce.du.ac.in',
        password: '1234',
        role: 'student',
        department: deptCSE._id,
        phone: '+91-98765-43210',
        status: 'active',
      });
      await demoStudent.save();
      await StudentProfile.findOneAndUpdate(
        { user: demoStudent._id },
        {
          user: demoStudent._id,
          studentId: 'STU-DEMO-2026',
          enrolmentNumber: '25DOCEBTCSDEMO',
          formNo: '250310000000',
          semester: 3,
          section: 'A',
          batch: '2025-2029',
          admissionYear: 2025,
        },
        { upsert: true, new: true }
      );
    } else {
      demoStudent.password = '1234';
      demoStudent.status = 'active';
      await demoStudent.save();
    }

    // 3. Faculty Records from Official Timetable
    console.log('[Seed] Seeding Faculty Records from Timetable...');
    const officialFacultyList = [
      { name: 'Dr. Juhi Jain', acronym: 'JJ', dept: deptCSE, designation: 'Assistant Professor', empId: 'EMP-FOT-001' },
      { name: 'Dr. Geetanjali Bhola', acronym: 'GB', dept: deptCSE, designation: 'Associate Professor', empId: 'EMP-FOT-002' },
      { name: 'Dr. Bhawna Rawat', acronym: 'BR', dept: deptCSE, designation: 'Assistant Professor', empId: 'EMP-FOT-003' },
      { name: 'Dr. Ahmad Zaman Khan', acronym: 'AZK', dept: deptEE, designation: 'Assistant Professor', empId: 'EMP-FOT-004' },
      { name: 'Dr. Ashutosh Pandey', acronym: 'AP', dept: deptCSE, designation: 'Assistant Professor', empId: 'EMP-FOT-005' },
      { name: 'Dr. Udita Sharma', acronym: 'UDS', dept: deptCSE, designation: 'Assistant Professor', empId: 'EMP-FOT-006' },
      { name: 'Dr. Anuradha Tomar', acronym: 'ART', dept: deptEE, designation: 'Professor', empId: 'EMP-FOT-007' },
      { name: 'Mr. Unmesh Shukla', acronym: 'US', dept: deptCSE, designation: 'Assistant Professor', empId: 'EMP-FOT-008' },
      { name: 'Dr. Jatin Sharma', acronym: 'JS', dept: deptCSE, designation: 'Assistant Professor', empId: 'EMP-FOT-009' },
      { name: 'Dr. Rekha R', acronym: 'RR', dept: deptECE, designation: 'Assistant Professor', empId: 'EMP-FOT-010' },
      { name: 'Dr. Manu Vardhan', acronym: 'MV', dept: deptCSE, designation: 'Associate Professor', empId: 'EMP-FOT-011' },
      { name: 'Dr. Sunil Kumar', acronym: 'SK', dept: deptCSE, designation: 'Assistant Professor', empId: 'EMP-FOT-012' },
      { name: 'Dr. Sanjeev Yadav', acronym: 'SY', dept: deptECE, designation: 'Assistant Professor', empId: 'EMP-FOT-013' },
      { name: 'Dr. Khushwant Sehra', acronym: 'KS', dept: deptECE, designation: 'Assistant Professor', empId: 'EMP-FOT-014' },
      { name: 'Prof. A.K. Tandon', acronym: 'AKT', dept: deptEE, designation: 'Professor & Dean', empId: 'EMP-FOT-015' },
      { name: 'Prof. Raj Senani', acronym: 'RSN', dept: deptECE, designation: 'Professor Emeritus', empId: 'EMP-FOT-016' },
      { name: 'Prof. Vanita Jain', acronym: 'VJ', dept: deptECE, designation: 'Professor & HOD', empId: 'EMP-FOT-017' },
      { name: 'Dr. Diptiranjan Samantray', acronym: 'DRS', dept: deptECE, designation: 'Associate Professor', empId: 'EMP-FOT-018' },
      { name: 'Dr. Jeetendra Prasad', acronym: 'JP', dept: deptEE, designation: 'Assistant Professor', empId: 'EMP-FOT-019' },
      { name: 'Dr. Arjun Tyagi', acronym: 'AT', dept: deptEE, designation: 'Assistant Professor', empId: 'EMP-FOT-020' },
    ];

    let facultyCreatedCount = 0;
    for (const fac of officialFacultyList) {
      const email = `${fac.acronym.toLowerCase()}@ce.du.ac.in`;
      let facUser = await User.findOne({ email });
      if (!facUser) {
        facUser = new User({
          name: fac.name,
          email,
          password: '1234',
          role: 'faculty',
          department: fac.dept._id,
          phone: '+91-11-2766-7000',
          status: 'active',
        });
        await facUser.save();
        await FacultyProfile.create({
          user: facUser._id,
          employeeId: fac.empId,
          designation: fac.designation,
          officeRoom: `Academic Block B, Room ${fac.acronym}`,
        });
        facultyCreatedCount++;
      }
    }
    console.log(`[Seed] Official Faculty synced: ${officialFacultyList.length} total (${facultyCreatedCount} newly created).`);

    // 4. Parse & Seed 338 Students from 'Enrolment number & Roll number 2025.pdf'
    console.log('[Seed] Parsing student records from official PDF...');
    const studentPdfPath = path.resolve(__dirname, '../../../docs/source-data/Enrolment number & Roll number 2025.pdf');
    let studentsSeeded = 0;

    if (fs.existsSync(studentPdfPath)) {
      const buf = fs.readFileSync(studentPdfPath);
      const parser = new PDFParse(new Uint8Array(buf));
      const res = await parser.getText();
      const lines = res.text.split('\n').map((l) => l.trim()).filter(Boolean);

      const lineRegex = /^(\d{12})\s+(.*?)\s+([A-Z\s\.]+?)\s+([^\s]+@[^\s]+)\s+(\d{11})\s+([A-Z0-9]+)$/;
      const parsedStudents = [];

      for (const line of lines) {
        const match = line.match(lineRegex);
        if (match) {
          parsedStudents.push({
            formNo: match[1],
            deptRaw: match[2],
            name: match[3].trim(),
            rollNumber: match[5],
            enrolmentNumber: match[6],
          });
        }
      }

      console.log(`[Seed] Successfully extracted ${parsedStudents.length} official student rows from PDF.`);

      for (let i = 0; i < parsedStudents.length; i++) {
        const s = parsedStudents[i];
        const instEmail = `${s.rollNumber}@ce.du.ac.in`;

        let targetDept = deptCSE;
        if (s.deptRaw.includes('Electrical')) targetDept = deptEE;
        else if (s.deptRaw.includes('Electronics')) targetDept = deptECE;

        // Alternate sections A and B
        const section = i % 2 === 0 ? 'A' : 'B';

        let u = await User.findOne({ email: instEmail });
        if (!u) {
          u = await User.create({
            name: s.name,
            email: instEmail,
            password: '1234',
            role: 'student',
            department: targetDept._id,
            status: 'active',
          });
        }

        let prof = await StudentProfile.findOne({ studentId: s.rollNumber });
        if (!prof) {
          await StudentProfile.create({
            user: u._id,
            studentId: s.rollNumber,
            enrolmentNumber: s.enrolmentNumber,
            formNo: s.formNo,
            semester: 3,
            section,
            batch: '2025-2029',
            admissionYear: 2025,
          });
          studentsSeeded++;
        }
      }
      console.log(`[Seed] Student records synced: ${parsedStudents.length} total (${studentsSeeded} newly created).`);
    } else {
      console.warn('[Seed] Warning: Enrolment PDF not found at', studentPdfPath);
    }

    // 5. Parse & Seed 142 UPC Subjects from 'Updated UPC_FOT.pdf'
    console.log('[Seed] Parsing official UPC courses & papers...');
    const upcPdfPath = path.resolve(__dirname, '../../../docs/source-data/Updated UPC_FOT.pdf');
    let subjectsSeeded = 0;

    if (fs.existsSync(upcPdfPath)) {
      const buf = fs.readFileSync(upcPdfPath);
      const parser = new PDFParse(new Uint8Array(buf));
      const res = await parser.getText();
      const lines = res.text.split('\n').map((l) => l.trim()).filter(Boolean);

      const upcRegex = /^(\d+)\s+(.*?)\s*(\d{10})\s+(.+?)\s+(-|[I|V|X\d]+)\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)$/;
      const subjectDocs = [];

      for (const line of lines) {
        const m = line.match(upcRegex);
        if (m) {
          const sNo = parseInt(m[1], 10);
          const preUpc = m[2].trim();
          const upc = m[3];
          const paperName = m[4].trim();
          const semesterRaw = m[5].trim();
          const l = parseInt(m[6], 10);
          const t = parseInt(m[7], 10);
          const p = parseInt(m[8], 10);
          const credits = parseInt(m[9], 10);

          let dept = 'General';
          let paperType = 'DSC';
          const parts = preUpc.split(/\s+/).filter((p) => p !== '-');
          if (parts.length === 1) {
            paperType = parts[0];
          } else if (parts.length >= 2) {
            dept = parts[0];
            paperType = parts.slice(1).join(' ');
          }

          subjectDocs.push({
            sNo,
            upcCode: upc,
            name: paperName,
            department: dept,
            paperType,
            semester: semesterRaw,
            lectureHours: l,
            tutorialHours: t,
            practicalHours: p,
            totalCredits: credits,
          });
        }
      }

      console.log(`[Seed] Extracted ${subjectDocs.length} official subjects from UPC PDF.`);
      await Subject.collection.dropIndexes().catch(() => {});
      for (const doc of subjectDocs) {
        await Subject.findOneAndUpdate({ sNo: doc.sNo }, doc, { upsert: true, new: true });
        subjectsSeeded++;
      }
      console.log(`[Seed] Successfully seeded/updated ${subjectsSeeded} subjects into database.`);
    } else {
      console.warn('[Seed] Warning: UPC PDF not found at', upcPdfPath);
    }

    // 6. Timetable for 2026-27 (2nd Year CSE-A and CSE-B + ECE & EE)
    console.log('[Seed] Seeding Official 2026-27 Weekly Timetable...');
    const timetableCount = await Timetable.countDocuments();
    if (timetableCount < 30) {
      await Timetable.deleteMany({});

      const timetableSlots = [
        // --- 2nd Year CSE-A ---
        // Monday
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Monday', timeSlot: '8-9 AM', subjectCode: 'PSCS-A', subjectName: 'Probability Statistics & Complex Systems', facultyAcronym: 'AZK', facultyName: 'Dr. Ahmad Zaman Khan', roomNumber: 'R2', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Monday', timeSlot: '9-10 AM', subjectCode: 'PSCS-A', subjectName: 'Probability Statistics & Complex Systems', facultyAcronym: 'AZK', facultyName: 'Dr. Ahmad Zaman Khan', roomNumber: 'R2', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Monday', timeSlot: '10-11 AM', subjectCode: 'ADA', subjectName: 'Analysis & Design of Algorithms', facultyAcronym: 'JJ', facultyName: 'Dr. Juhi Jain', roomNumber: 'R2', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Monday', timeSlot: '11 AM-12 PM', subjectCode: 'ADA', subjectName: 'Analysis & Design of Algorithms', facultyAcronym: 'JJ', facultyName: 'Dr. Juhi Jain', roomNumber: 'R2', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Monday', timeSlot: '1-2 PM', subjectCode: 'ADA (P)', subjectName: 'Algorithms Lab', facultyAcronym: 'JJ', facultyName: 'Dr. Juhi Jain', roomNumber: 'R3', type: 'Practical', subGroup: 'A1' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Monday', timeSlot: '2-3 PM', subjectCode: 'ADA (P)', subjectName: 'Algorithms Lab', facultyAcronym: 'JJ', facultyName: 'Dr. Juhi Jain', roomNumber: 'R3', type: 'Practical', subGroup: 'A1' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Monday', timeSlot: '3-4 PM', subjectCode: 'DBMS (P)', subjectName: 'Database Management Systems Lab', facultyAcronym: 'GB', facultyName: 'Dr. Geetanjali Bhola', roomNumber: 'R1', type: 'Practical', subGroup: 'A2' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Monday', timeSlot: '4-5 PM', subjectCode: 'DBMS (P)', subjectName: 'Database Management Systems Lab', facultyAcronym: 'GB', facultyName: 'Dr. Geetanjali Bhola', roomNumber: 'R1', type: 'Practical', subGroup: 'A2' },

        // Tuesday
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Tuesday', timeSlot: '8-9 AM', subjectCode: 'DBMS', subjectName: 'Database Management Systems', facultyAcronym: 'GB', facultyName: 'Dr. Geetanjali Bhola', roomNumber: 'R1', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Tuesday', timeSlot: '9-10 AM', subjectCode: 'DBMS', subjectName: 'Database Management Systems', facultyAcronym: 'GB', facultyName: 'Dr. Geetanjali Bhola', roomNumber: 'R1', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Tuesday', timeSlot: '10-11 AM', subjectCode: 'PSCS-A', subjectName: 'Probability Statistics & Complex Systems', facultyAcronym: 'AZK', facultyName: 'Dr. Ahmad Zaman Khan', roomNumber: 'R1', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Tuesday', timeSlot: '1-2 PM', subjectCode: 'FIT INDIA', subjectName: 'Value Addition - Fit India Movement', facultyAcronym: 'AP', facultyName: 'Dr. Ashutosh Pandey', roomNumber: 'Sports Complex', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Tuesday', timeSlot: '2-3 PM', subjectCode: 'FIT INDIA', subjectName: 'Value Addition - Fit India Movement', facultyAcronym: 'AP', facultyName: 'Dr. Ashutosh Pandey', roomNumber: 'Sports Complex', type: 'Lecture' },

        // Wednesday
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Wednesday', timeSlot: '8-9 AM', subjectCode: 'EVS-2', subjectName: 'Environmental Science: Theory to Practice - II', facultyAcronym: 'UDS', facultyName: 'Dr. Udita Sharma', roomNumber: 'R1', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Wednesday', timeSlot: '9-10 AM', subjectCode: 'EVS-2', subjectName: 'Environmental Science: Theory to Practice - II', facultyAcronym: 'UDS', facultyName: 'Dr. Udita Sharma', roomNumber: 'R1', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Wednesday', timeSlot: '10-11 AM', subjectCode: 'DSD', subjectName: 'Digital System Design', facultyAcronym: 'BR', facultyName: 'Dr. Bhawna Rawat', roomNumber: '314', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Wednesday', timeSlot: '1-2 PM', subjectCode: 'DSD (P)', subjectName: 'Digital System Design Lab', facultyAcronym: 'BR', facultyName: 'Dr. Bhawna Rawat', roomNumber: '513', type: 'Practical', subGroup: 'A2' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Wednesday', timeSlot: '2-3 PM', subjectCode: 'DSD (P)', subjectName: 'Digital System Design Lab', facultyAcronym: 'BR', facultyName: 'Dr. Bhawna Rawat', roomNumber: '513', type: 'Practical', subGroup: 'A2' },

        // Thursday
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Thursday', timeSlot: '8-9 AM', subjectCode: 'DBMS', subjectName: 'Database Management Systems', facultyAcronym: 'GB', facultyName: 'Dr. Geetanjali Bhola', roomNumber: 'R1', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Thursday', timeSlot: '9-10 AM', subjectCode: 'DSD', subjectName: 'Digital System Design', facultyAcronym: 'BR', facultyName: 'Dr. Bhawna Rawat', roomNumber: '214', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Thursday', timeSlot: '10-11 AM', subjectCode: 'DSD', subjectName: 'Digital System Design', facultyAcronym: 'BR', facultyName: 'Dr. Bhawna Rawat', roomNumber: '214', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Thursday', timeSlot: '1-2 PM', subjectCode: 'DSD (P)', subjectName: 'Digital System Design Lab', facultyAcronym: 'BR', facultyName: 'Dr. Bhawna Rawat', roomNumber: 'Basement Lab', type: 'Practical', subGroup: 'A1' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Thursday', timeSlot: '2-3 PM', subjectCode: 'DSD (P)', subjectName: 'Digital System Design Lab', facultyAcronym: 'BR', facultyName: 'Dr. Bhawna Rawat', roomNumber: 'Basement Lab', type: 'Practical', subGroup: 'A1' },

        // Friday
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Friday', timeSlot: '10-11 AM', subjectCode: 'ADA', subjectName: 'Analysis & Design of Algorithms', facultyAcronym: 'JJ', facultyName: 'Dr. Juhi Jain', roomNumber: 'R2', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Friday', timeSlot: '1-2 PM', subjectCode: 'ADA (P)', subjectName: 'Algorithms Lab', facultyAcronym: 'JJ', facultyName: 'Dr. Juhi Jain', roomNumber: 'R3', type: 'Practical', subGroup: 'A2' },
        { department: 'CSE', year: '2nd Year', section: 'A', day: 'Friday', timeSlot: '2-3 PM', subjectCode: 'ADA (P)', subjectName: 'Algorithms Lab', facultyAcronym: 'JJ', facultyName: 'Dr. Juhi Jain', roomNumber: 'R3', type: 'Practical', subGroup: 'A2' },

        // --- 2nd Year CSE-B ---
        // Monday
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Monday', timeSlot: '8-9 AM', subjectCode: 'DBMS (P)', subjectName: 'Database Management Systems Lab', facultyAcronym: 'GB', facultyName: 'Dr. Geetanjali Bhola', roomNumber: 'R3', type: 'Practical', subGroup: 'B1' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Monday', timeSlot: '9-10 AM', subjectCode: 'DBMS (P)', subjectName: 'Database Management Systems Lab', facultyAcronym: 'GB', facultyName: 'Dr. Geetanjali Bhola', roomNumber: 'R3', type: 'Practical', subGroup: 'B1' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Monday', timeSlot: '10-11 AM', subjectCode: 'DSD', subjectName: 'Digital System Design', facultyAcronym: 'BR', facultyName: 'Dr. Bhawna Rawat', roomNumber: 'R2', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Monday', timeSlot: '11 AM-12 PM', subjectCode: 'DSD', subjectName: 'Digital System Design', facultyAcronym: 'BR', facultyName: 'Dr. Bhawna Rawat', roomNumber: 'R2', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Monday', timeSlot: '1-2 PM', subjectCode: 'EVS-2', subjectName: 'Environmental Science - II', facultyAcronym: 'EKL', facultyName: 'Dr. Eklavya', roomNumber: '313', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Monday', timeSlot: '2-3 PM', subjectCode: 'EVS-2', subjectName: 'Environmental Science - II', facultyAcronym: 'EKL', facultyName: 'Dr. Eklavya', roomNumber: '313', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Monday', timeSlot: '3-4 PM', subjectCode: 'DSD (P)', subjectName: 'Digital System Design Lab', facultyAcronym: 'BR', facultyName: 'Dr. Bhawna Rawat', roomNumber: 'Basement Lab', type: 'Practical', subGroup: 'B2' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Monday', timeSlot: '4-5 PM', subjectCode: 'DSD (P)', subjectName: 'Digital System Design Lab', facultyAcronym: 'BR', facultyName: 'Dr. Bhawna Rawat', roomNumber: 'Basement Lab', type: 'Practical', subGroup: 'B2' },

        // Tuesday
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Tuesday', timeSlot: '8-9 AM', subjectCode: 'DSD (P)', subjectName: 'Digital System Design Lab', facultyAcronym: 'BR', facultyName: 'Dr. Bhawna Rawat', roomNumber: 'R3', type: 'Practical', subGroup: 'B1' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Tuesday', timeSlot: '9-10 AM', subjectCode: 'DSD (P)', subjectName: 'Digital System Design Lab', facultyAcronym: 'BR', facultyName: 'Dr. Bhawna Rawat', roomNumber: 'R3', type: 'Practical', subGroup: 'B1' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Tuesday', timeSlot: '10-11 AM', subjectCode: 'ADA', subjectName: 'Analysis & Design of Algorithms', facultyAcronym: 'JJ', facultyName: 'Dr. Juhi Jain', roomNumber: 'R2', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Tuesday', timeSlot: '1-2 PM', subjectCode: 'FSS', subjectName: 'Foundations of System Security', facultyAcronym: 'AKS', facultyName: 'Dr. Amit Kumar Sharma', roomNumber: 'Basement Lab', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Tuesday', timeSlot: '2-3 PM', subjectCode: 'FSS', subjectName: 'Foundations of System Security', facultyAcronym: 'AKS', facultyName: 'Dr. Amit Kumar Sharma', roomNumber: 'Basement Lab', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Tuesday', timeSlot: '3-4 PM', subjectCode: 'PSCS (P)', subjectName: 'Probability & Statistics Lab', facultyAcronym: 'AZK', facultyName: 'Dr. Ahmad Zaman Khan', roomNumber: 'R2', type: 'Practical', subGroup: 'B2' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Tuesday', timeSlot: '4-5 PM', subjectCode: 'PSCS (P)', subjectName: 'Probability & Statistics Lab', facultyAcronym: 'AZK', facultyName: 'Dr. Ahmad Zaman Khan', roomNumber: 'R2', type: 'Practical', subGroup: 'B2' },

        // Wednesday
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Wednesday', timeSlot: '8-9 AM', subjectCode: 'ADA (P)', subjectName: 'Algorithms Lab', facultyAcronym: 'JJ', facultyName: 'Dr. Juhi Jain', roomNumber: 'R2', type: 'Practical', subGroup: 'B2' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Wednesday', timeSlot: '9-10 AM', subjectCode: 'ADA (P)', subjectName: 'Algorithms Lab', facultyAcronym: 'JJ', facultyName: 'Dr. Juhi Jain', roomNumber: 'R2', type: 'Practical', subGroup: 'B2' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Wednesday', timeSlot: '10-11 AM', subjectCode: 'PSCS-B', subjectName: 'Probability Statistics & Complex Systems', facultyAcronym: 'AZK', facultyName: 'Dr. Ahmad Zaman Khan', roomNumber: 'R2', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Wednesday', timeSlot: '11 AM-12 PM', subjectCode: 'PSCS-B', subjectName: 'Probability Statistics & Complex Systems', facultyAcronym: 'AZK', facultyName: 'Dr. Ahmad Zaman Khan', roomNumber: 'R2', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Wednesday', timeSlot: '1-2 PM', subjectCode: 'DBMS (P)', subjectName: 'Database Management Systems Lab', facultyAcronym: 'GB', facultyName: 'Dr. Geetanjali Bhola', roomNumber: 'R3', type: 'Practical', subGroup: 'B2' },

        // Thursday
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Thursday', timeSlot: '8-9 AM', subjectCode: 'ADA', subjectName: 'Analysis & Design of Algorithms', facultyAcronym: 'JJ', facultyName: 'Dr. Juhi Jain', roomNumber: 'R1', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Thursday', timeSlot: '9-10 AM', subjectCode: 'ADA', subjectName: 'Analysis & Design of Algorithms', facultyAcronym: 'JJ', facultyName: 'Dr. Juhi Jain', roomNumber: 'R1', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Thursday', timeSlot: '1-2 PM', subjectCode: 'ADA (P)', subjectName: 'Algorithms Lab', facultyAcronym: 'JJ', facultyName: 'Dr. Juhi Jain', roomNumber: '513', type: 'Practical', subGroup: 'B1' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Thursday', timeSlot: '2-3 PM', subjectCode: 'ADA (P)', subjectName: 'Algorithms Lab', facultyAcronym: 'JJ', facultyName: 'Dr. Juhi Jain', roomNumber: '513', type: 'Practical', subGroup: 'B1' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Thursday', timeSlot: '3-4 PM', subjectCode: 'DSD', subjectName: 'Digital System Design', facultyAcronym: 'BR', facultyName: 'Dr. Bhawna Rawat', roomNumber: 'R2', type: 'Lecture' },

        // Friday
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Friday', timeSlot: '8-9 AM', subjectCode: 'DBMS', subjectName: 'Database Management Systems', facultyAcronym: 'GB', facultyName: 'Dr. Geetanjali Bhola', roomNumber: 'R2', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Friday', timeSlot: '9-10 AM', subjectCode: 'PSCS-B', subjectName: 'Probability Statistics & Complex Systems', facultyAcronym: 'AZK', facultyName: 'Dr. Ahmad Zaman Khan', roomNumber: 'R2', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Friday', timeSlot: '10-11 AM', subjectCode: 'FIT INDIA', subjectName: 'Value Addition - Fit India Movement', facultyAcronym: 'AZK', facultyName: 'Dr. Ahmad Zaman Khan', roomNumber: 'Sports Complex', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Friday', timeSlot: '11 AM-12 PM', subjectCode: 'FIT INDIA', subjectName: 'Value Addition - Fit India Movement', facultyAcronym: 'AZK', facultyName: 'Dr. Ahmad Zaman Khan', roomNumber: 'Sports Complex', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Friday', timeSlot: '1-2 PM', subjectCode: 'FSS', subjectName: 'Foundations of System Security', facultyAcronym: 'AKS', facultyName: 'Dr. Amit Kumar Sharma', roomNumber: 'Basement Lab', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Friday', timeSlot: '3-4 PM', subjectCode: 'DBMS', subjectName: 'Database Management Systems', facultyAcronym: 'GB', facultyName: 'Dr. Geetanjali Bhola', roomNumber: 'R2', type: 'Lecture' },
        { department: 'CSE', year: '2nd Year', section: 'B', day: 'Friday', timeSlot: '4-5 PM', subjectCode: 'DBMS', subjectName: 'Database Management Systems', facultyAcronym: 'GB', facultyName: 'Dr. Geetanjali Bhola', roomNumber: 'R2', type: 'Lecture' },

        // --- 2nd Year ECE-A ---
        { department: 'ECE', year: '2nd Year', section: 'A', day: 'Monday', timeSlot: '8-9 AM', subjectCode: 'EDC', subjectName: 'Electronic Devices & Circuits', facultyAcronym: 'DRS', facultyName: 'Dr. Diptiranjan Samantray', roomNumber: '213', type: 'Lecture' },
        { department: 'ECE', year: '2nd Year', section: 'A', day: 'Monday', timeSlot: '9-10 AM', subjectCode: 'DE', subjectName: 'Digital Electronics', facultyAcronym: 'KJL', facultyName: 'Dr. Kajal Kumari', roomNumber: '213', type: 'Lecture' },
        { department: 'ECE', year: '2nd Year', section: 'A', day: 'Wednesday', timeSlot: '10-11 AM', subjectCode: 'SS', subjectName: 'Signals & Systems', facultyAcronym: 'RR', facultyName: 'Dr. Rekha R', roomNumber: '314', type: 'Lecture' },
        { department: 'ECE', year: '2nd Year', section: 'A', day: 'Thursday', timeSlot: '1-3 PM', subjectCode: 'EDC (P)', subjectName: 'Electronic Circuits Lab', facultyAcronym: 'DRS', facultyName: 'Dr. Diptiranjan Samantray', roomNumber: '317', type: 'Practical', subGroup: 'A1' },

        // --- 2nd Year EE-A ---
        { department: 'EE', year: '2nd Year', section: 'A', day: 'Monday', timeSlot: '8-9 AM', subjectCode: 'EVS-2', subjectName: 'Environmental Science - II', facultyAcronym: 'UDS', facultyName: 'Dr. Udita Sharma', roomNumber: '314', type: 'Lecture' },
        { department: 'EE', year: '2nd Year', section: 'A', day: 'Tuesday', timeSlot: '9-10 AM', subjectCode: 'EM-1', subjectName: 'Electrical Machines - I', facultyAcronym: 'ART', facultyName: 'Dr. Anuradha Tomar', roomNumber: '212', type: 'Lecture' },
        { department: 'EE', year: '2nd Year', section: 'A', day: 'Wednesday', timeSlot: '10-11 AM', subjectCode: 'NA', subjectName: 'Network Analysis & Synthesis', facultyAcronym: 'AKT', facultyName: 'Prof. A.K. Tandon', roomNumber: '204', type: 'Lecture' },
        { department: 'EE', year: '2nd Year', section: 'A', day: 'Thursday', timeSlot: '1-3 PM', subjectCode: 'EM (P)', subjectName: 'Electrical Machines Lab', facultyAcronym: 'ART', facultyName: 'Dr. Anuradha Tomar', roomNumber: '513', type: 'Practical', subGroup: 'A1' },
      ];

      await Timetable.insertMany(timetableSlots);
      console.log(`[Seed] Seeded ${timetableSlots.length} weekly timetable slots.`);
    } else {
      console.log(`[Seed] Verified existing ${timetableCount} timetable slots in database.`);
    }

    // 7. Date Sheet Status Check
    const existingDateSheets = await DateSheet.countDocuments();
    if (existingDateSheets === 0) {
      console.log('[Seed] Initializing DateSheet collection in draft mode (empty state for students)...');
      await DateSheet.create({
        title: 'Official End-Term Theory Date Sheet - December 2026',
        academicSession: '2026-27',
        semester: 'Odd Semester (Dec 2026)',
        department: 'All (CSE, ECE, EE)',
        fileName: 'Exam theory datesheet-December,2026.pdf',
        fileUrl: '/source-data/Exam theory datesheet-December,2026.pdf',
        fileSize: '307 KB',
        status: 'draft', // Left in draft so empty state is displayed until published!
        notes: 'Official University of Delhi End-Term Theory Date Sheet',
      });
    }

    // 8. Rooms & Labs
    const existingRoomsCount = await Room.countDocuments();
    let rooms = [];
    if (existingRoomsCount === 0) {
      console.log('[Seed] Creating Classrooms and Laboratories...');
      rooms = await Room.insertMany([
        {
          roomId: 'LH-101',
          name: 'Main Lecture Hall Alpha (R1)',
          type: 'Classroom',
          building: 'Academic Block A',
          capacity: 120,
          facilities: ['HD Dual Projectors', 'Surround Audio', 'Smart Board', 'Air Conditioning'],
          status: 'Available',
        },
        {
          roomId: 'LH-102',
          name: 'Lecture Hall Beta (R2)',
          type: 'Classroom',
          building: 'Academic Block A',
          capacity: 90,
          facilities: ['HD Dual Projectors', 'Smart Board', 'Air Conditioning'],
          status: 'Available',
        },
        {
          roomId: 'LAB-302',
          name: 'Alan Turing Advanced Computing Lab (R3)',
          type: 'Laboratory',
          building: 'IT Block B',
          capacity: 60,
          facilities: ['High-Performance Workstations', 'Gigabit Ethernet', 'AC', 'UPS Backup'],
          status: 'Available',
        },
        {
          roomId: 'SEM-201',
          name: 'Sir C.V. Raman Seminar Hall',
          type: 'Seminar Hall',
          building: 'Science Center',
          capacity: 80,
          facilities: ['Wireless Mics', 'Projector', 'Podium Camera', 'Video Conferencing'],
          status: 'Available',
        },
        {
          roomId: 'AUD-MAIN',
          name: 'University Grand Auditorium',
          type: 'Auditorium',
          building: 'Student Activity Complex',
          capacity: 500,
          facilities: ['Stage Lighting', 'Dolby Acoustics', 'Green Rooms', 'Control Booth'],
          status: 'Available',
        },
      ]);
    } else {
      rooms = await Room.find();
    }

    // 9. Realistic Announcements from Official Campus Documents
    const existingAnnCount = await Announcement.countDocuments();
    if (existingAnnCount === 0) {
      console.log('[Seed] Seeding Realistic Campus Announcements...');
      await Announcement.insertMany([
        {
          title: 'Revised Academic Session 2026–27 Timetable Published',
          description:
            'The revised Odd Semester Timetable for Academic Session 2026–27 (effective from 17th September 2026) is officially released. All B.Tech students in CSE, ECE, and EE departments are advised to check their weekly schedules and room allocations.',
          category: 'Academic',
          author: primaryAdmin._id,
          targetAudience: 'All',
          priority: 'Urgent',
          status: 'published',
        },
        {
          title: 'Curriculum Scheme & Updated UPC Paper Codes',
          description:
            'The Faculty of Technology has updated the Unique Paper Codes (UPC) and credit allocations for DSC, DSE, GE, VAC, AEC, and SEC papers. Students may inspect their complete degree requirements under the Course Catalog.',
          category: 'Academic',
          author: primaryAdmin._id,
          targetAudience: 'Students',
          priority: 'Normal',
          status: 'published',
        },
        {
          title: 'Advance Notice: End-Term Theory Examinations December 2026',
          description:
            'Preparations for the End-Term Theory Examinations (December 2026 session) are underway. The authenticated date sheet and examination seating layout will be released shortly by the University Examination Branch.',
          category: 'Examination',
          author: primaryAdmin._id,
          targetAudience: 'All',
          priority: 'Normal',
          status: 'published',
        },
        {
          title: 'Alan Turing Computing Lab Access & Safety Protocols',
          description:
            'Students enrolled in Analysis & Design of Algorithms (ADA) and Database Management Systems (DBMS) lab practicals must carry their QR Campus Identity card for biometric and scanner verification at the entry gate.',
          category: 'Administrative',
          author: demoFaculty._id,
          targetAudience: 'Students',
          department: deptCSE._id,
          priority: 'Normal',
          status: 'published',
        },
      ]);
    }

    // 10. Complaints (Complaint Management remains 100% functional, Open Grievances removed)
    const existingCompCount = await Complaint.countDocuments();
    if (existingCompCount === 0) {
      console.log('[Seed] Seeding Sample Complaints for Management Module...');
      await Complaint.insertMany([
        {
          complaintId: 'CMP-2026-1001',
          student: demoStudent._id,
          title: 'Overhead Projector HDMI Cable in Lecture Hall R1',
          description: 'The primary projector in LH-101 (R1) intermittently flickers during data structures and algorithms slides.',
          category: 'Classroom',
          priority: 'Medium',
          location: 'Academic Block A, 1st Floor, LH-101 (R1)',
          status: 'In Progress',
          assignedTo: demoFaculty._id,
          resolutionNotes: 'Technician dispatched to replace the HDMI transceiver cable.',
          history: [
            {
              status: 'Submitted',
              changedBy: demoStudent._id,
              notes: 'Ticket lodged by student.',
              timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            },
            {
              status: 'Assigned',
              changedBy: primaryAdmin._id,
              notes: 'Assigned to Block In-Charge Dr. Juhi Jain.',
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            },
            {
              status: 'In Progress',
              changedBy: demoFaculty._id,
              notes: 'Technician dispatched to replace the HDMI transceiver cable.',
              timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            },
          ],
        },
        {
          complaintId: 'CMP-2026-1002',
          student: demoStudent._id,
          title: 'Wi-Fi Access Point dead zone in IT Block B 3rd Floor',
          description: 'Network dropouts observed near computing lab R3 during practical sessions.',
          category: 'Internet/Wi-Fi',
          priority: 'High',
          location: 'IT Block B, 3rd Floor East Wing',
          status: 'Submitted',
          history: [
            {
              status: 'Submitted',
              changedBy: demoStudent._id,
              notes: 'Ticket submitted with AP signal logs.',
              timestamp: new Date(),
            },
          ],
        },
      ]);
    }

    // 11. Lost & Found Items
    const existingLFCount = await LostFoundItem.countDocuments();
    if (existingLFCount === 0) {
      console.log('[Seed] Seeding Lost & Found Sample Items...');
      const lostItemDate = new Date(Date.now() - 24 * 60 * 60 * 1000);

      await LostFoundItem.insertMany([
        {
          title: 'Blue HP Laptop Sleeve with Power Brick',
          description: 'Navy blue padded laptop sleeve containing a 65W USB-C charger and spiral notebook.',
          category: 'Electronics',
          reportType: 'Lost',
          reporter: demoStudent._id,
          location: 'Central Library 1st Floor Study Cubicles',
          dateLostFound: lostItemDate,
          contactPreference: 'Email',
          status: 'Open',
        },
        {
          title: 'Found Dark Blue Laptop Charger and Notebook',
          description: 'Found a 65W laptop charger and student notebook left behind on study desk #14.',
          category: 'Electronics',
          reportType: 'Found',
          reporter: demoFaculty._id,
          location: 'Central Library First Floor',
          dateLostFound: lostItemDate,
          contactPreference: 'In-Person Admin Desk',
          status: 'Open',
        },
      ]);
    }

    // 12. Events
    const existingEvtCount = await Event.countDocuments();
    if (existingEvtCount === 0) {
      console.log('[Seed] Seeding Campus Events...');
      const eventDate1 = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const deadline1 = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

      const event1 = await Event.create({
        title: 'FoT Annual Hackathon "HackTech 2026"',
        description: 'A 36-hour software buildathon featuring challenges in Distributed Systems, AI, and Smart University Infrastructure.',
        category: 'Hackathon',
        organizer: demoFaculty._id,
        date: eventDate1,
        startTime: '09:00 AM',
        endTime: '06:00 PM',
        venue: 'University Grand Auditorium (AUD-MAIN)',
        registrationDeadline: deadline1,
        capacity: 250,
        registeredCount: 1,
        status: 'Upcoming',
      });

      await EventRegistration.create({
        event: event1._id,
        user: demoStudent._id,
        ticketToken: 'EVT-TKT-HACK-001',
        attended: false,
      });
    }

    console.log('===========================================================');
    console.log(' [Seed] CampusFlow Demo Credentials Ready:');
    console.log('===========================================================');
    console.log('  1. Primary Administrator:');
    console.log('     Email:    admin@ce.du.ac.in');
    console.log('     Password: 1234');
    console.log('  2. Admin Alias:');
    console.log('     Email:    admin@campusflow.edu');
    console.log('     Password: 1234');
    console.log('  3. Faculty Demo:');
    console.log('     Email:    faculty@ce.du.ac.in');
    console.log('     Password: 1234');
    console.log('  4. Student Demo:');
    console.log('     Email:    student@ce.du.ac.in');
    console.log('     Password: 1234');
    console.log('===========================================================');

    if (!isAuto) {
      await disconnectDB();
      process.exit(0);
    }
  } catch (error) {
    console.error('[Seed] Database seeding failed:', error);
    if (!isAuto) {
      process.exit(1);
    }
  }
}

async function ensureAdminAndSeed(connectFirst = false) {
  try {
    if (connectFirst) {
      await connectDB();
    }
    const adminUser = await User.findOne({ email: 'admin@ce.du.ac.in' });
    const facultyUser = await User.findOne({ email: 'faculty@ce.du.ac.in' });
    const studentUser = await User.findOne({ email: 'student@ce.du.ac.in' });
    const userCount = await User.countDocuments();
    const subjectsCount = await Subject.countDocuments();

    if (!adminUser || !facultyUser || !studentUser || userCount < 50 || subjectsCount < 100) {
      console.log('[AutoSeed] Missing demo accounts or full university dataset. Launching seed...');
      await seedData(true);
    } else {
      console.log('[AutoSeed] Verified primary administrator: admin@ce.du.ac.in and full university data.');
    }
  } catch (err) {
    console.error('[AutoSeed] Error ensuring admin credentials:', err);
  }
}

if (require.main === module) {
  connectDB().then(() => seedData(false));
}

module.exports = {
  seedData,
  ensureAdminAndSeed,
};
