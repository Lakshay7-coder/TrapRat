import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const prisma = new PrismaClient();

// AES-256-GCM helpers for seed
const ENCRYPTION_KEY = crypto.createHash('sha256').update('0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef').digest();
function encryptField(text: string): string {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let enc = cipher.update(text, 'utf8', 'hex');
  enc += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${enc}`;
}

async function main() {
  console.log('🌱 Starting Kaushal Sankalp Database Seed...');

  // 1. Cleanup existing records
  await prisma.auditLog.deleteMany();
  await prisma.notificationLog.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.verificationAttempt.deleteMany();
  await prisma.anomalyFlag.deleteMany();
  await prisma.outcomeReason.deleteMany();
  await prisma.outcomeSkillRequirement.deleteMany();
  await prisma.courseSkill.deleteMany();
  await prisma.incentiveLedger.deleteMany();
  await prisma.identityLink.deleteMany();
  await prisma.consentRecord.deleteMany();
  await prisma.document.deleteMany();
  await prisma.outcomeFollowup.deleteMany();
  await prisma.outcome.deleteMany();
  await prisma.enrolment.deleteMany();
  await prisma.batch.deleteMany();
  await prisma.course.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.advisoryReport.deleteMany();
  await prisma.employer.deleteMany();
  await prisma.trainee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.trainingProvider.deleteMany();

  // 2. Skills Catalogue
  console.log('Creating Skills Catalogue...');
  const skillNames = [
    'Python Programming',
    'React.js',
    'SQL Databases',
    'Power BI',
    'Industrial Wiring',
    'PLC Programming',
    'CNC Machine Operation',
    'Quality Inspection',
    'Tally Prime & GST',
    'Medical Records Handling',
    'Solar PV Installation',
    'Customer Communication',
  ];

  const skillRecords: Record<string, any> = {};
  for (const name of skillNames) {
    const s = await prisma.skill.create({ data: { name, category: 'Technical' } });
    skillRecords[name] = s;
  }

  // 3. Training Providers
  console.log('Creating Training Providers...');
  const tp1 = await prisma.trainingProvider.create({
    data: {
      name: 'Kaushal Vikas Kendra - Pune Centre',
      code: 'TP-PUNE-01',
      district: 'Pune',
      state: 'Maharashtra',
      contactName: 'Sanjay Deshmukh',
      contactPhone: encryptField('9823011223'),
      contactEmail: 'contact@puneskills.org',
    },
  });

  const tp2 = await prisma.trainingProvider.create({
    data: {
      name: 'SkillCraft Institute of Advanced Technology',
      code: 'TP-MUM-02',
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      contactName: 'Pooja Iyer',
      contactPhone: encryptField('9819033445'),
      contactEmail: 'admissions@skillcraft.edu.in',
    },
  });

  const tp3 = await prisma.trainingProvider.create({
    data: {
      name: 'Pragati Technical Skill Academy',
      code: 'TP-NAG-03',
      district: 'Nagpur',
      state: 'Maharashtra',
      contactName: 'Rajesh Verma',
      contactPhone: encryptField('9765044556'),
      contactEmail: 'info@pragatiskills.org',
    },
  });

  // 4. Users (Admin, Provider Admins, Trainees)
  console.log('Creating Users...');
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  await prisma.user.createMany({
    data: [
      {
        email: 'admin@kaushalsankalp.gov.in',
        passwordHash,
        role: 'admin',
        name: 'National Admin Controller',
        phone: '9900112233',
      },
      {
        email: 'admin@puneskills.org',
        passwordHash,
        role: 'provider_admin',
        providerId: tp1.id,
        name: 'Pune Center Admin',
        phone: '9823011223',
      },
      {
        email: 'admin@skillcraft.edu.in',
        passwordHash,
        role: 'provider_admin',
        providerId: tp2.id,
        name: 'Mumbai Center Admin',
        phone: '9819033445',
      },
      {
        email: 'officer@skills.gov.in',
        passwordHash,
        role: 'field_officer',
        name: 'Ramesh Pawar (Field Officer)',
        phone: '9422019283',
      },
      {
        email: 'trainee@kaushalsankalp.gov.in',
        passwordHash,
        role: 'trainee',
        name: 'Aarav Patil',
        phone: '9822114477',
      },
    ],
  });

  // 5. Courses & Course Skills
  console.log('Creating Courses...');
  const c1 = await prisma.course.create({
    data: {
      providerId: tp1.id,
      name: 'Full Stack Web Development',
      code: 'CRS-IT-01',
      durationMonths: 6,
      sector: 'IT-ITeS',
      nsqfLevel: '5',
      courseSkills: {
        create: [
          { skillId: skillRecords['React.js'].id },
          { skillId: skillRecords['Python Programming'].id },
          { skillId: skillRecords['SQL Databases'].id },
        ],
      },
    },
  });

  const c2 = await prisma.course.create({
    data: {
      providerId: tp1.id,
      name: 'Industrial Automation & PLC',
      code: 'CRS-ENG-02',
      durationMonths: 4,
      sector: 'Electronics',
      nsqfLevel: '4',
      courseSkills: {
        create: [
          { skillId: skillRecords['PLC Programming'].id },
          { skillId: skillRecords['Industrial Wiring'].id },
        ],
      },
    },
  });

  const c3 = await prisma.course.create({
    data: {
      providerId: tp2.id,
      name: 'CNC Machine Operation & QA',
      code: 'CRS-MFG-03',
      durationMonths: 3,
      sector: 'Automotive & Capital Goods',
      nsqfLevel: '4',
      courseSkills: {
        create: [
          { skillId: skillRecords['CNC Machine Operation'].id },
          { skillId: skillRecords['Quality Inspection'].id },
        ],
      },
    },
  });

  const c4 = await prisma.course.create({
    data: {
      providerId: tp2.id,
      name: 'Data Analytics & Business Intelligence',
      code: 'CRS-IT-04',
      durationMonths: 4,
      sector: 'IT-ITeS',
      nsqfLevel: '6',
      courseSkills: {
        create: [
          { skillId: skillRecords['SQL Databases'].id },
          { skillId: skillRecords['Python Programming'].id },
        ],
      },
    },
  });

  const c5 = await prisma.course.create({
    data: {
      providerId: tp3.id,
      name: 'Rooftop Solar PV Installation',
      code: 'CRS-SOL-05',
      durationMonths: 3,
      sector: 'Green Energy',
      nsqfLevel: '4',
      courseSkills: {
        create: [
          { skillId: skillRecords['Solar PV Installation'].id },
          { skillId: skillRecords['Industrial Wiring'].id },
        ],
      },
    },
  });

  const c6 = await prisma.course.create({
    data: {
      providerId: tp3.id,
      name: 'Accounting Executive with Tally Prime',
      code: 'CRS-BFSI-06',
      durationMonths: 3,
      sector: 'BFSI',
      nsqfLevel: '4',
      courseSkills: {
        create: [
          { skillId: skillRecords['Tally Prime & GST'].id },
          { skillId: skillRecords['Customer Communication'].id },
        ],
      },
    },
  });

  // 6. Batches
  console.log('Creating Batches...');
  const batches = [];
  const b1 = await prisma.batch.create({
    data: {
      courseId: c1.id,
      providerId: tp1.id,
      batchCode: 'BAT-2025-PUN-01',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2025-12-01'),
      status: 'completed',
    },
  });
  batches.push(b1);

  const b2 = await prisma.batch.create({
    data: {
      courseId: c2.id,
      providerId: tp1.id,
      batchCode: 'BAT-2025-PUN-02',
      startDate: new Date('2025-08-01'),
      endDate: new Date('2025-12-01'),
      status: 'completed',
    },
  });
  batches.push(b2);

  const b3 = await prisma.batch.create({
    data: {
      courseId: c3.id,
      providerId: tp2.id,
      batchCode: 'BAT-2025-MUM-01',
      startDate: new Date('2025-09-01'),
      endDate: new Date('2025-12-01'),
      status: 'completed',
    },
  });
  batches.push(b3);

  const b4 = await prisma.batch.create({
    data: {
      courseId: c4.id,
      providerId: tp2.id,
      batchCode: 'BAT-2025-MUM-02',
      startDate: new Date('2025-07-01'),
      endDate: new Date('2025-11-01'),
      status: 'completed',
    },
  });
  batches.push(b4);

  const b5 = await prisma.batch.create({
    data: {
      courseId: c5.id,
      providerId: tp3.id,
      batchCode: 'BAT-2025-NAG-01',
      startDate: new Date('2025-08-15'),
      endDate: new Date('2025-11-15'),
      status: 'completed',
    },
  });
  batches.push(b5);

  const b6 = await prisma.batch.create({
    data: {
      courseId: c6.id,
      providerId: tp3.id,
      batchCode: 'BAT-2025-NAG-02',
      startDate: new Date('2025-10-01'),
      endDate: new Date('2026-01-01'),
      status: 'completed',
    },
  });
  batches.push(b6);

  // 7. Employers
  console.log('Creating Employers...');
  const emp1 = await prisma.employer.create({
    data: {
      name: 'Tata Consultancy & Engineering Services',
      contactPhone: encryptField('9822998877'),
      contactEmail: encryptField('hr.verify@tata.com'),
      district: 'Pune',
      state: 'Maharashtra',
      sector: 'IT & Engineering',
      isVerified: true,
      verificationCount: 14,
    },
  });

  const emp2 = await prisma.employer.create({
    data: {
      name: 'Mahindra Solar Power Systems Ltd',
      contactPhone: encryptField('9821887766'),
      contactEmail: encryptField('hiring@mahindrasolar.com'),
      district: 'Nagpur',
      state: 'Maharashtra',
      sector: 'Renewable Energy',
      isVerified: true,
      verificationCount: 8,
    },
  });

  const emp3 = await prisma.employer.create({
    data: {
      name: 'Precision Auto Tech Solutions',
      contactPhone: encryptField('9819776655'),
      contactEmail: encryptField('verify@precisionautotech.in'),
      district: 'Mumbai Suburban',
      state: 'Maharashtra',
      sector: 'Automotive',
      isVerified: true,
      verificationCount: 6,
    },
  });

  const emp4 = await prisma.employer.create({
    data: {
      name: 'FastTrack Logistics & Accounting Hub',
      contactPhone: encryptField('9765665544'),
      contactEmail: encryptField('admin@fasttracklogistics.in'),
      district: 'Nagpur',
      state: 'Maharashtra',
      sector: 'Logistics & BFSI',
      isVerified: false,
      verificationCount: 2,
    },
  });

  // 8. 40+ Trainees, Enrolments, Outcomes, Documents, Follow-ups
  console.log('Creating 40+ Trainees with full lifecycle...');

  const traineeNames = [
    { name: 'Aarav Patil', gender: 'male', district: 'Pune', cat: 'OBC', rural: 'rural', batchIdx: 0, outcome: 'employed', job: 'Junior Web Developer', emp: emp1, wageLow: 18000, wageHigh: 22000, docBonus: 20 },
    { name: 'Priya Sharma', gender: 'female', district: 'Pune', cat: 'General', rural: 'urban', batchIdx: 0, outcome: 'employed', job: 'Frontend Engineer', emp: emp1, wageLow: 22000, wageHigh: 26000, docBonus: 20 },
    { name: 'Rohan Deshmukh', gender: 'male', district: 'Pune', cat: 'SC', rural: 'rural', batchIdx: 0, outcome: 'employed', job: 'React Developer', emp: emp1, wageLow: 20000, wageHigh: 25000, docBonus: 10 },
    { name: 'Ananya Joshi', gender: 'female', district: 'Pune', cat: 'General', rural: 'urban', batchIdx: 0, outcome: 'self_employed', job: 'Freelance Web Designer', emp: null, wageLow: 15000, wageHigh: 20000, docBonus: 10 },
    { name: 'Sameer Kulkarni', gender: 'male', district: 'Pune', cat: 'General', rural: 'rural', batchIdx: 0, outcome: 'seeking_work', job: null, emp: null, wageLow: null, wageHigh: null, docBonus: 0 },
    
    { name: 'Vikas Jadhav', gender: 'male', district: 'Pune', cat: 'OBC', rural: 'rural', batchIdx: 1, outcome: 'employed', job: 'PLC Automation Technician', emp: emp1, wageLow: 17000, wageHigh: 21000, docBonus: 20 },
    { name: 'Sneha Shinde', gender: 'female', district: 'Pune', cat: 'EWS', rural: 'urban', batchIdx: 1, outcome: 'employed', job: 'Automation Maintenance Associate', emp: emp1, wageLow: 18000, wageHigh: 22000, docBonus: 10 },
    { name: 'Ganesh More', gender: 'male', district: 'Pune', cat: 'SC', rural: 'rural', batchIdx: 1, outcome: 'apprenticeship', job: 'Electrical Apprentice', emp: emp1, wageLow: 12000, wageHigh: 14000, docBonus: 10 },
    { name: 'Pooja Sawant', gender: 'female', district: 'Pune', cat: 'General', rural: 'rural', batchIdx: 1, outcome: 'studying', job: null, emp: null, wageLow: null, wageHigh: null, docBonus: 0 },
    { name: 'Kiran Gaikwad', gender: 'male', district: 'Pune', cat: 'ST', rural: 'rural', batchIdx: 1, outcome: 'employed', job: 'Control Panel Technician', emp: emp1, wageLow: 16000, wageHigh: 20000, docBonus: 10 },

    { name: 'Rahul Kamble', gender: 'male', district: 'Mumbai Suburban', cat: 'SC', rural: 'urban', batchIdx: 2, outcome: 'employed', job: 'CNC Machine Operator', emp: emp3, wageLow: 19000, wageHigh: 23000, docBonus: 20 },
    { name: 'Deepak Chavan', gender: 'male', district: 'Mumbai Suburban', cat: 'OBC', rural: 'urban', batchIdx: 2, outcome: 'employed', job: 'CNC Machine Operator', emp: emp3, wageLow: 19000, wageHigh: 23000, docBonus: 20 },
    { name: 'Nilesh Tambe', gender: 'male', district: 'Mumbai Suburban', cat: 'General', rural: 'urban', batchIdx: 2, outcome: 'employed', job: 'CNC Machine Operator', emp: emp3, wageLow: 19000, wageHigh: 23000, docBonus: 20 },
    { name: 'Manisha Gole', gender: 'female', district: 'Mumbai Suburban', cat: 'General', rural: 'urban', batchIdx: 2, outcome: 'employed', job: 'Quality Inspection Associate', emp: emp3, wageLow: 18000, wageHigh: 22000, docBonus: 10 },
    { name: 'Ajay Kadam', gender: 'male', district: 'Mumbai Suburban', cat: 'EWS', rural: 'urban', batchIdx: 2, outcome: 'seeking_work', job: null, emp: null, wageLow: null, wageHigh: null, docBonus: 0 },

    { name: 'Kavita Nair', gender: 'female', district: 'Mumbai Suburban', cat: 'General', rural: 'urban', batchIdx: 3, outcome: 'employed', job: 'Junior Data Analyst', emp: emp1, wageLow: 25000, wageHigh: 30000, docBonus: 20 },
    { name: 'Aditya Mehta', gender: 'male', district: 'Mumbai Suburban', cat: 'General', rural: 'urban', batchIdx: 3, outcome: 'employed', job: 'BI Reporting Analyst', emp: emp1, wageLow: 24000, wageHigh: 28000, docBonus: 20 },
    { name: 'Shweta Rao', gender: 'female', district: 'Mumbai Suburban', cat: 'OBC', rural: 'urban', batchIdx: 3, outcome: 'employed', job: 'SQL Data Coordinator', emp: emp1, wageLow: 22000, wageHigh: 26000, docBonus: 10 },
    { name: 'Kunal Shah', gender: 'male', district: 'Mumbai Suburban', cat: 'General', rural: 'urban', batchIdx: 3, outcome: 'self_employed', job: 'Analytics Consultant', emp: null, wageLow: 20000, wageHigh: 25000, docBonus: 10 },
    { name: 'Divya Iyer', gender: 'female', district: 'Mumbai Suburban', cat: 'General', rural: 'urban', batchIdx: 3, outcome: 'studying', job: null, emp: null, wageLow: null, wageHigh: null, docBonus: 0 },

    { name: 'Santosh Raut', gender: 'male', district: 'Nagpur', cat: 'OBC', rural: 'rural', batchIdx: 4, outcome: 'employed', job: 'Solar Rooftop Installer', emp: emp2, wageLow: 16000, wageHigh: 20000, docBonus: 20 },
    { name: 'Sunil Meshram', gender: 'male', district: 'Nagpur', cat: 'SC', rural: 'rural', batchIdx: 4, outcome: 'employed', job: 'Solar Site Technician', emp: emp2, wageLow: 17000, wageHigh: 21000, docBonus: 20 },
    { name: 'Pratibha Borkar', gender: 'female', district: 'Nagpur', cat: 'General', rural: 'rural', batchIdx: 4, outcome: 'employed', job: 'Solar Project Coordinator', emp: emp2, wageLow: 18000, wageHigh: 22000, docBonus: 10 },
    { name: 'Sachin Thakre', gender: 'male', district: 'Nagpur', cat: 'OBC', rural: 'rural', batchIdx: 4, outcome: 'self_employed', job: 'Solar Contractor', emp: null, wageLow: 25000, wageHigh: 35000, docBonus: 20 },
    { name: 'Anita Uike', gender: 'female', district: 'Nagpur', cat: 'ST', rural: 'rural', batchIdx: 4, outcome: 'employed', job: 'Solar Field Assistant', emp: emp2, wageLow: 15000, wageHigh: 18000, docBonus: 10 },

    { name: 'Pallavi Wankhede', gender: 'female', district: 'Nagpur', cat: 'SC', rural: 'urban', batchIdx: 5, outcome: 'employed', job: 'Accountant', emp: emp4, wageLow: 15000, wageHigh: 18000, docBonus: 10 },
    { name: 'Nitin Bhende', gender: 'male', district: 'Nagpur', cat: 'OBC', rural: 'rural', batchIdx: 5, outcome: 'employed', job: 'GST Billing Clerk', emp: emp4, wageLow: 14000, wageHigh: 17000, docBonus: 10 },
    { name: 'Rupali Kohale', gender: 'female', district: 'Nagpur', cat: 'General', rural: 'urban', batchIdx: 5, outcome: 'seeking_work', job: null, emp: null, wageLow: null, wageHigh: null, docBonus: 0 },
    { name: 'Dinesh Gond', gender: 'male', district: 'Nagpur', cat: 'ST', rural: 'rural', batchIdx: 5, outcome: 'apprenticeship', job: 'Accounts Trainee', emp: emp4, wageLow: 10000, wageHigh: 12000, docBonus: 10 },
    { name: 'Neelam Tiwari', gender: 'female', district: 'Nagpur', cat: 'EWS', rural: 'urban', batchIdx: 5, outcome: 'employed', job: 'Tally Operator', emp: emp4, wageLow: 16000, wageHigh: 19000, docBonus: 10 },

    // Additional trainees for robust analytics & anomalies
    { name: 'Mohit Agrawal', gender: 'male', district: 'Pune', cat: 'General', rural: 'urban', batchIdx: 0, outcome: 'employed', job: 'Junior Web Developer', emp: emp1, wageLow: 19000, wageHigh: 23000, docBonus: 10 },
    { name: 'Fatima Sheikh', gender: 'female', district: 'Mumbai Suburban', cat: 'OBC', rural: 'urban', batchIdx: 3, outcome: 'employed', job: 'Data Reporting Analyst', emp: emp1, wageLow: 24000, wageHigh: 28000, docBonus: 20 },
    { name: 'Tushar Mohite', gender: 'male', district: 'Pune', cat: 'OBC', rural: 'rural', batchIdx: 1, outcome: 'employed', job: 'PLC Automation Technician', emp: emp1, wageLow: 17000, wageHigh: 21000, docBonus: 10 },
    { name: 'Geeta Kolhe', gender: 'female', district: 'Nagpur', cat: 'OBC', rural: 'rural', batchIdx: 4, outcome: 'employed', job: 'Solar Rooftop Installer', emp: emp2, wageLow: 16000, wageHigh: 20000, docBonus: 20 },
    { name: 'Sanjay Bapat', gender: 'male', district: 'Pune', cat: 'General', rural: 'urban', batchIdx: 0, outcome: 'employed', job: 'Full Stack Engineer', emp: emp1, wageLow: 22000, wageHigh: 27000, docBonus: 20 },
    { name: 'Smita Kadam', gender: 'female', district: 'Mumbai Suburban', cat: 'SC', rural: 'urban', batchIdx: 2, outcome: 'employed', job: 'CNC Operator', emp: emp3, wageLow: 19000, wageHigh: 23000, docBonus: 10 },
    { name: 'Prakash Dhote', gender: 'male', district: 'Nagpur', cat: 'OBC', rural: 'rural', batchIdx: 5, outcome: 'employed', job: 'Tally Accountant', emp: emp4, wageLow: 16000, wageHigh: 19000, docBonus: 10 },
    { name: 'Harish Nimbalkar', gender: 'male', district: 'Pune', cat: 'General', rural: 'rural', batchIdx: 1, outcome: 'employed', job: 'PLC Engineer', emp: emp1, wageLow: 18000, wageHigh: 22000, docBonus: 10 },
    { name: 'Zoya Khan', gender: 'female', district: 'Mumbai Suburban', cat: 'General', rural: 'urban', batchIdx: 3, outcome: 'employed', job: 'Data Analyst', emp: emp1, wageLow: 26000, wageHigh: 31000, docBonus: 20 },
    { name: 'Bhupendra Yadav', gender: 'male', district: 'Nagpur', cat: 'OBC', rural: 'rural', batchIdx: 4, outcome: 'employed', job: 'Solar Maintenance Engineer', emp: emp2, wageLow: 19000, wageHigh: 23000, docBonus: 20 },
  ];

  let counter = 10001;
  const createdOutcomes = [];

  for (const tData of traineeNames) {
    const skillOutcomeId = `KSL-2026-${counter++}`;
    const rawPhone = `98${Math.floor(10000000 + Math.random() * 89999999)}`;
    const rawEmail = `${tData.name.toLowerCase().replace(/\s+/g, '.')}${counter}@example.com`;

    const trainee = await prisma.trainee.create({
      data: {
        skillOutcomeId,
        name: tData.name,
        gender: tData.gender,
        category: tData.cat,
        ruralUrban: tData.rural,
        phonePrimary: encryptField(rawPhone),
        email: encryptField(rawEmail),
        district: tData.district,
        state: 'Maharashtra',
        pincode: '411001',
        consentStatus: 'granted',
        consentTimestamp: new Date('2025-06-15'),
      },
    });

    // Consent records
    await prisma.consentRecord.createMany({
      data: [
        { traineeId: trainee.id, consentType: 'follow_up_contact', status: 'granted' },
        { traineeId: trainee.id, consentType: 'employer_contact', status: 'granted' },
        { traineeId: trainee.id, consentType: 'placement_tracking', status: 'granted' },
        { traineeId: trainee.id, consentType: 'analytics', status: 'granted' },
      ],
    });

    // Enrolment
    const selectedBatch = batches[tData.batchIdx];
    const enrolment = await prisma.enrolment.create({
      data: {
        traineeId: trainee.id,
        batchId: selectedBatch.id,
        enrolmentDate: selectedBatch.startDate,
        status: 'completed',
        attendancePercent: 88.5,
        assessmentScore: 82.0,
        certificateNumber: `CERT-${selectedBatch.batchCode}-${trainee.id.slice(0, 6).toUpperCase()}`,
        certificateIssuedDate: selectedBatch.endDate,
      },
    });

    // Outcome & Trust Score
    const isEmployed = tData.outcome === 'employed' || tData.outcome === 'self_employed' || tData.outcome === 'apprenticeship';
    const source = tData.emp ? 'employer_confirm' : tData.outcome === 'self_employed' ? 'document' : 'trainee_self_report';
    const isVerified = tData.emp ? true : false;

    let score = isEmployed ? 40 : 25;
    if (isVerified) score += 20; // employer bonus
    score += tData.docBonus; // doc bonus
    score += 15; // recency bonus <=30d

    const breakdown = [
      { component: `${source}_base`, points: isEmployed ? 40 : 25 },
      ...(isVerified ? [{ component: 'employer_verified_bonus', points: 20 }] : []),
      ...(tData.docBonus > 0 ? [{ component: 'verified_documents', points: tData.docBonus }] : []),
      { component: 'recency_30d', points: 15 },
    ];

    const outcome = await prisma.outcome.create({
      data: {
        traineeId: trainee.id,
        enrolmentId: enrolment.id,
        outcomeType: tData.outcome,
        outcomeDate: selectedBatch.endDate || new Date(),
        employerId: tData.emp ? tData.emp.id : null,
        jobRole: tData.job,
        wageBandLow: tData.wageLow,
        wageBandHigh: tData.wageHigh,
        isRelatedToTraining: 'yes',
        source,
        trustScore: Math.min(100, score),
        trustBreakdown: JSON.stringify(breakdown),
        isVerified,
        verifiedAt: isVerified ? new Date() : null,
        verifiedBy: isVerified ? `Verified Employer Partner: ${tData.emp?.name}` : null,
        verificationLevel: isVerified ? 2 : 1,
        confidenceLabel: isVerified ? 'confirmed_trainee' : 'self_reported',
        employmentType: 'full_time',
      },
    });
    createdOutcomes.push(outcome);

    // Documents
    if (tData.docBonus > 0) {
      await prisma.document.create({
        data: {
          traineeId: trainee.id,
          outcomeId: outcome.id,
          docType: tData.outcome === 'self_employed' ? 'udyam_cert' : 'joining_letter',
          fileUrl: `/uploads/sample_${trainee.skillOutcomeId}_offer.pdf`,
          contentHash: crypto.createHash('sha256').update(`DOC_${trainee.id}_${outcome.id}`).digest('hex'),
          verificationStatus: 'verified',
          verifiedBy: 'Verification Officer',
          verifiedAt: new Date(),
        },
      });
    }

    // Follow-ups
    for (const days of [30, 90, 180, 365]) {
      const scheduledDate = new Date(new Date().getTime() + days * 24 * 3600 * 1000);
      await prisma.outcomeFollowup.create({
        data: {
          traineeId: trainee.id,
          outcomeId: outcome.id,
          scheduledDate,
          status: days === 30 ? 'completed' : 'pending',
          channel: days === 30 ? 'whatsapp' : 'sms',
          responseData: days === 30 ? JSON.stringify({ isEmployed: true, wageConfirmed: true }) : null,
          actualDate: days === 30 ? new Date() : null,
          notes: `Cadence follow-up +${days} days`,
        },
      });
    }

    // Reasons for non-placement if seeking work
    if (tData.outcome === 'seeking_work') {
      await prisma.outcomeReason.create({
        data: {
          outcomeId: outcome.id,
          kind: 'non_placement',
          category: 'skill_mismatch',
          rawText: 'Local companies were seeking Power BI and Python automation skills not fully covered in old syllabus',
          confidence: 0.94,
        },
      });
    }
  }

  // 9. Anomaly Flags Fixtures (covering 5+ rules)
  console.log('Creating Seed Anomaly Flags...');
  await prisma.anomalyFlag.createMany({
    data: [
      {
        ruleCode: 'identical_batch_details',
        severity: 'high',
        status: 'open',
        reason: '3 trainees in Batch BAT-2025-MUM-01 share identical job role, employer, and start date',
        entityType: 'outcome',
        entityId: createdOutcomes[10]?.id || 'SAMPLE_ID',
        outcomeId: createdOutcomes[10]?.id,
        evidence: JSON.stringify({ batchCode: 'BAT-2025-MUM-01', identicalRole: 'CNC Machine Operator', count: 3 }),
        slaDeadline: new Date(Date.now() + 48 * 3600 * 1000),
      },
      {
        ruleCode: 'employer_bulk_confirm',
        severity: 'high',
        status: 'under_review',
        reason: 'Tata Consultancy confirmed 14 trainees exceeding the bulk threshold within 7 days',
        entityType: 'employer',
        entityId: emp1.id,
        evidence: JSON.stringify({ employer: emp1.name, totalConfirmed: 14, threshold: 10 }),
        slaDeadline: new Date(Date.now() + 24 * 3600 * 1000),
      },
      {
        ruleCode: 'duplicate_document',
        severity: 'medium',
        status: 'open',
        reason: 'Identical offer letter document content hash detected across 2 trainees',
        entityType: 'document',
        entityId: 'DOC-HASH-MATCH',
        evidence: JSON.stringify({ contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' }),
        slaDeadline: new Date(Date.now() + 72 * 3600 * 1000),
      },
      {
        ruleCode: 'impossible_timeline',
        severity: 'medium',
        status: 'resolved',
        reviewNote: 'Verified candidate joined as early intern during the last month of practical training.',
        reviewedBy: 'admin@kaushalsankalp.gov.in',
        reason: 'Outcome placement date coincided with early training period',
        entityType: 'outcome',
        entityId: createdOutcomes[0]?.id || 'SAMPLE_OUTCOME',
        outcomeId: createdOutcomes[0]?.id,
        resolvedAt: new Date(),
      },
    ],
  });

  // 10. Quarterly Advisory Reports
  console.log('Creating Seed Advisory Reports...');
  await prisma.advisoryReport.create({
    data: {
      providerId: tp1.id,
      period: '2025-Q4',
      summary: JSON.stringify({
        providerName: tp1.name,
        period: '2025-Q4',
        totalCoursesEvaluated: 2,
        curriculumGaps: [
          {
            courseName: 'Full Stack Web Development',
            missingSkills: [{ skillName: 'Power BI', missingPercentage: 35 }, { skillName: 'Docker', missingPercentage: 28 }],
          },
        ],
        recommendedActions: [
          'Add a 2-week module on cloud containerization & Power BI reporting',
          'Conduct employer guest lectures with Tata Consultancy team',
        ],
      }),
      fileUrl: '/reports/advisory_TP-PUNE-01_2025-Q4.pdf',
    },
  });

  // 11. Audit Logs (Tamper-evident chain)
  console.log('Creating Seed Audit Logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        entityType: 'System',
        entityId: 'ROOT',
        action: 'SYSTEM_INITIALIZED',
        performedBy: 'admin@kaushalsankalp.gov.in',
        changes: JSON.stringify({ status: 'Database seed completed successfully' }),
        prevHash: 'GENESIS_BLOCK_HASH',
        entryHash: 'd7a8fbb307d7809469ca9abcb0082e4f8d5651e46d3cdb762d02d0bf37c9e592',
      },
    ],
  });

  console.log('🎉 Kaushal Sankalp Database Seed Completed Successfully!');
  console.log('----------------------------------------------------');
  console.log('Admin Credentials:');
  console.log('  Email: admin@kaushalsankalp.gov.in');
  console.log('  Password: Admin@123');
  console.log('Provider Credentials:');
  console.log('  Email: admin@puneskills.org');
  console.log('  Password: Admin@123');
  console.log('----------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
