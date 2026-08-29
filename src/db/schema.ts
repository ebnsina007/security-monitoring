import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  jsonb,
  boolean,
  pgEnum,
  real,
} from "drizzle-orm/pg-core";

// نقش‌های سازمانی (RBAC & ABAC)
export const userRoleEnum = pgEnum("user_role", [
  "super_admin",
  "security_manager",
  "crisis_secretary",
  "supervisor",
  "security_officer",
  "trainee",
]);

// جدول کاربران سامانه ابن‌سینا
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  personnelCode: text("personnel_code").notNull().unique(),
  fullName: text("full_name").notNull(),
  role: userRoleEnum("role").default("security_officer").notNull(),
  department: text("department").notNull(),
  postName: text("post_name").notNull(), // مثلاً: پست ۲ (ورودی اورژانس)
  passwordHash: text("password_hash").notNull(),
  badgeNumber: text("badge_number"),
  avatarUrl: text("avatar_url"),
  nationalId: text("national_id"), // کدملی جهت اتصال به HIS
  hisPatientSystemId: text("his_patient_system_id"), // شناسه پرسنلی در وب‌سرویس HIS
  hasBiometricFace: boolean("has_biometric_face").default(false),
  hasBiometricFingerprint: boolean("has_biometric_fingerprint").default(false),
  biometricEnrolledAt: timestamp("biometric_enrolled_at"),
  biometricEnrolledBy: integer("biometric_enrolled_by"), // مدیر حراست ثبت‌کننده
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// جدول گزارش ۲۴ ساعته شیفت انتظامات (۰۷:۰۰ تا ۰۷:۰۰ روز بعد) - شامل ۱۰ بخش کامل
export const shiftReports = pgTable("shift_reports", {
  id: serial("id").primaryKey(),
  shiftDate: text("shift_date").notNull(), // YYYY-MM-DD
  shiftCode: text("shift_code").notNull(), // مثلاً SHIFT-14031204-24H
  shiftType: text("shift_type").notNull(), // 07:00-07:00 (24h)
  supervisorId: integer("supervisor_id").references(() => users.id),
  // بخش ۱: وضعیت حضور و غیاب و استقرار پرسنل در پست‌ها
  personnelStatus: jsonb("personnel_status").default([]),
  // بخش ۲: وقایع و رویدادهای مهم بیمارستان
  eventsLog: jsonb("events_log").default([]),
  // بخش ۳: وضعیت تجهیزات حراستی (بی‌سیم، گیت، دوربین، باتوم برقی، کپسول)
  equipmentCheck: jsonb("equipment_check").default([]),
  // بخش ۴: ثبت رفت‌وآمد پیمانکاران و مجوز کار گرم/سرد
  contractorsLog: jsonb("contractors_log").default([]),
  // بخش ۵: ثبت بازرسان وزارت بهداشت، حراست دانشگاه و مهمانان ویژه
  visitorsLog: jsonb("visitors_log").default([]),
  // بخش ۶: ثبت تردد آمبولانس‌ها و خودروهای ویژه
  vehicleLog: jsonb("vehicle_log").default([]),
  // بخش ۷: ثبت حوادث (کد سفید، کد قرمز، کد ۳۳، درگیری، سرقت)
  incidentsLog: jsonb("incidents_log").default([]),
  // بخش ۸: تخلفات و تذکرات انضباطی
  violationsLog: jsonb("violations_log").default([]),
  // بخش ۹: وضعیت بیماران خاص (متواری، ترخیص با تنش مالی، پزشکی قانونی)
  patientStatusLog: jsonb("patient_status_log").default([]),
  // بخش ۱۰: وضعیت کارت همراهان بخش‌های ویژه (ICU/CCU/اورژانس)
  companionCardsLog: jsonb("companion_cards_log").default([]),
  // چک‌لیست بازرسی اماکن حساس (موتورخانه، اکسیژن‌ساز، بانک خون، امحاء زباله)
  facilityChecklist: jsonb("facility_checklist").default([]),
  supervisorComment: text("supervisor_comment"),
  isFinalized: boolean("is_finalized").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// جدول چک‌لیست گشت‌زنی QR Code با امضای HMAC-SHA256 و ژئوفنسینگ
export const patrolTasks = pgTable("patrol_tasks", {
  id: serial("id").primaryKey(),
  shiftReportId: integer("shift_report_id").references(() => shiftReports.id),
  locationCode: text("location_code").notNull(),
  locationName: text("location_name").notNull(),
  zoneLevel: text("zone_level").notNull().default("CRITICAL"),
  qrCodeHash: text("qr_code_hash").notNull(),
  targetLat: real("target_lat").notNull(),
  targetLng: real("target_lng").notNull(),
  geofenceRadiusMeters: integer("geofence_radius_meters").default(35).notNull(),
  assignedTime: text("assigned_time").notNull(),
  scannedTime: timestamp("scanned_time"),
  officerId: integer("officer_id").references(() => users.id),
  status: text("status").default("RED").notNull(), // RED -> YELLOW -> GREEN
  scannedLat: real("scanned_lat"),
  scannedLng: real("scanned_lng"),
  geoDistanceMeters: real("geo_distance_meters"),
  hmacSignatureVerified: boolean("hmac_signature_verified").default(false),
  supervisorApprovedBy: integer("supervisor_approved_by").references(() => users.id),
  notes: text("notes"),
});

// بانک سوالات آزمون جامع شایستگی و ۱۴ روزه جدیدالورود
export const examQuestions = pgTable("exam_questions", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  category: text("category").notNull(), // "IQ" | "EQ" | "TECHNICAL" | "ONBOARDING_14D"
  domainName: text("domain_name").notNull(),
  questionText: text("question_text").notNull(),
  options: jsonb("options").notNull(),
  correctOptionId: text("correct_option_id").notNull(),
  points: integer("points").notNull().default(2),
  explanation: text("explanation").notNull(),
  dayNumber: integer("day_number"),
});

// جدول جلسات و کارنامه‌های آزمون شایستگی
export const examSessions = pgTable("exam_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  examType: text("exam_type").notNull(),
  examTitle: text("exam_title").notNull(),
  dayNumber: integer("day_number"),
  scoreTotal: integer("score_total").default(0).notNull(),
  scoreIQ: integer("score_iq").default(0).notNull(),
  scoreEQ: integer("score_eq").default(0).notNull(),
  scoreTechnical: integer("score_technical").default(0).notNull(),
  timeSpentSeconds: integer("time_spent_seconds").default(0),
  answers: jsonb("answers").default({}),
  skillGapAnalysis: jsonb("skill_gap_analysis").default({}),
  antiCheatViolations: integer("anti_cheat_violations").default(0),
  passed: boolean("passed").default(false).notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// جدول فرم دیجیتال لاگ‌بوک ارزیابی عملکرد ۱۴ روزه پرسنل جدیدالورود (Onboarding 14-Day Digital Logbook)
export const onboardingLogbooks = pgTable("onboarding_logbooks", {
  id: serial("id").primaryKey(),
  traineeId: integer("trainee_id").references(() => users.id).notNull(),
  dayNumber: integer("day_number").notNull(), // روز ۱ تا ۱۴
  dateString: text("date_string").notNull(), // تاریخ شمسی
  topicTitle: text("topic_title").notNull(), // موضوع روز (مثلا: آیین‌نامه انضباطی، گیت اورژانس، اطفای حریق)
  
  // ارزیابی توسط مربی / فرد آموزش‌دهنده (Manual Trainer Evaluation)
  trainerId: integer("trainer_id").references(() => users.id),
  trainerName: text("trainer_name").default("استاد ارشد آموزش حراست"),
  trainerScorePractical: integer("trainer_score_practical").default(0), // نمره مهارت عملی از ۱۰۰
  trainerScoreTheory: integer("trainer_score_theory").default(0), // نمره تئوری از ۱۰۰
  trainerComments: text("trainer_comments"), // توضیحات دستی مدرس
  trainerApproved: boolean("trainer_approved").default(false),
  trainerSignedAt: timestamp("trainer_signed_at"),

  // ارزیابی و تایید توسط مدیر حراست (Manual Security Manager Evaluation)
  managerId: integer("manager_id").references(() => users.id),
  managerScoreConduct: integer("manager_score_conduct").default(0), // نمره انضباط و صلاحیت حراستی از ۱۰۰
  managerRemarks: text("manager_remarks"), // یادداشت دستی مدیر حراست
  managerApproved: boolean("manager_approved").default(false),
  managerSignedAt: timestamp("manager_signed_at"),

  status: text("status").default("PENDING"), // PENDING, TRAINER_APPROVED, FINAL_APPROVED
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// جدول داده‌های ثبت بیومتریک و اتصال به سامانه HIS بیمارستان
export const biometricEnrollments = pgTable("biometric_enrollments", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  hisSourceSystem: text("his_source_system").default("AVICENNA_HOSPITAL_HIS_V4"),
  hisNationalCode: text("his_national_code").notNull(),
  hisPersonnelId: text("his_personnel_id").notNull(),
  hisSyncStatus: text("his_sync_status").default("CONNECTED"), // CONNECTED, SYNCHRONIZED, PENDING
  faceTemplateHash: text("face_template_hash"), // هش بردار بیومتریک چهره
  faceLivenessConfidence: real("face_liveness_confidence").default(0.98),
  faceScanDate: timestamp("face_scan_date"),
  fingerprintHash: text("fingerprint_hash"), // تمپلیت دیجیتال اثر انگشت
  fingerprintConfidence: real("fingerprint_confidence").default(0.99),
  fingerprintScanDate: timestamp("fingerprint_scan_date"),
  fingerType: text("finger_type").default("RIGHT_INDEX"), // انگشت اشاره راست
  enrolledByManagerId: integer("enrolled_by_manager_id").references(() => users.id),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// لاگ حسابرسی سامانه (تغییر وضعیت، اسکن آفلاین/آنلاین، تایید سوپروایزر)
export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  actionType: text("action_type").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: integer("entity_id"),
  description: text("description").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
