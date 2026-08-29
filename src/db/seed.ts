import { db } from "./index";
import {
  users,
  shiftReports,
  patrolTasks,
  examQuestions,
  examSessions,
  auditLogs,
  onboardingLogbooks,
  biometricEnrollments,
} from "./schema";
import { generatePatrolQrPayload } from "../lib/hmac-qr";
import { count, eq } from "drizzle-orm";

export async function ensureSeeded() {
  // ۱. ایجاد کاربران سازمانی و سطوح دسترسی (در صورت عدم وجود)
  const existingUsers = await db.select({ total: count() }).from(users);
  let aliMohammadi: any;
  let rezaFarhadi: any;
  let drBahrami: any;
  let saraMousavi: any;
  let drGhasemi: any;

  if (Number(existingUsers[0]?.total || 0) === 0) {
    console.log("Seeding users...");
    const [u1] = await db
      .insert(users)
      .values({
        personnelCode: "583742",
        fullName: "علی محمدی",
        role: "security_officer",
        department: "انتظامات و حفاظت فیزیکی",
        postName: "پست ۲ - ورودی اورژانس و گشت سیار",
        passwordHash: "$2b$10$avicennaSecOfficerHash",
        badgeNumber: "SEC-IBN-042",
        nationalId: "0074928192",
      })
      .returning();
    aliMohammadi = u1;

    const [u2] = await db
      .insert(users)
      .values({
        personnelCode: "200201",
        fullName: "رضا فرهادی",
        role: "supervisor",
        department: "فرماندهی عملیات انتظامات",
        postName: "سوپروایزر وقت شیفت ۲۴ ساعته",
        passwordHash: "$2b$10$avicennaSupervisorHash",
        badgeNumber: "SUP-IBN-010",
        nationalId: "0031920192",
      })
      .returning();
    rezaFarhadi = u2;

    const [u3] = await db
      .insert(users)
      .values({
        personnelCode: "100101",
        fullName: "دکتر علیرضا بهرامی",
        role: "security_manager",
        department: "مدیریت حراست و دبیرخانه ستاد بحران",
        postName: "مدیر حراست و دبیر پدافند غیرعامل",
        passwordHash: "$2b$10$avicennaManagerHash",
        badgeNumber: "MGR-IBN-001",
        nationalId: "0019283741",
      })
      .returning();
    drBahrami = u3;

    const [u4] = await db
      .insert(users)
      .values({
        personnelCode: "440112",
        fullName: "سارا موسوی",
        role: "trainee",
        department: "انتظامات و پذیرش بانوان",
        postName: "جدیدالورود (روز ۷ از دوره ۱۴ روزه)",
        passwordHash: "$2b$10$avicennaTraineeHash",
        badgeNumber: "TRN-IBN-112",
        nationalId: "0018492011",
      })
      .returning();
    saraMousavi = u4;

    const [u5] = await db
      .insert(users)
      .values({
        personnelCode: "300199",
        fullName: "مهندس حمید قاسمی",
        role: "super_admin",
        department: "ریاست مرکز درمانی ابن‌سینا",
        postName: "ریاست بیمارستان (ناظر ارشد)",
        passwordHash: "$2b$10$avicennaAdminHash",
        badgeNumber: "EXC-IBN-000",
        nationalId: "0028192831",
      })
      .returning();
    drGhasemi = u5;
  } else {
    const allUsers = await db.select().from(users);
    aliMohammadi = allUsers.find((u) => u.personnelCode === "583742") || allUsers[0];
    rezaFarhadi = allUsers.find((u) => u.personnelCode === "200201") || allUsers[1] || allUsers[0];
    drBahrami = allUsers.find((u) => u.personnelCode === "100101") || allUsers[2] || allUsers[0];
    saraMousavi = allUsers.find((u) => u.personnelCode === "440112") || allUsers[3] || allUsers[0];
    drGhasemi = allUsers.find((u) => u.personnelCode === "300199") || allUsers[4] || allUsers[0];
  }

  // ۲. گزارش ۲۴ ساعته شیفت
  const existingShift = await db.select({ total: count() }).from(shiftReports);
  let currentShift: any;
  if (Number(existingShift[0]?.total || 0) === 0) {
    console.log("Seeding shift reports...");
    const [shift] = await db
      .insert(shiftReports)
      .values({
        shiftDate: "1403/12/05",
        shiftCode: "IBN-SINA-24H-0305",
        shiftType: "۰۷:۰۰ الی ۰۷:۰۰ روز بعد (چرخه ۲۴ ساعته شبانه‌روزی)",
        supervisorId: rezaFarhadi.id,
        personnelStatus: [
          {
            post: "پست ۱ - گیت اصلی جنوب (کنترل تردد مراجعین)",
            officerName: "حسین سلطانی",
            personnelCode: "581204",
            status: "PRESENT",
            handoverTime: "07:00",
            equipment: "بی‌سیم Hytera CH-1، گیت بازرسی فلزیاب فعال",
          },
          {
            post: "پست ۲ - ورودی اورژانس و تریاژ مرکزی",
            officerName: "علی محمدی",
            personnelCode: "583742",
            status: "PRESENT",
            handoverTime: "07:00",
            equipment: "بی‌سیم CH-1، جلیقه تاکتیکی، کارت‌خوان QR سیار",
          },
          {
            post: "پست ۳ - تاسیسات زیرزمین و موتورخانه مرکزی",
            officerName: "مهدی کریمی",
            personnelCode: "582910",
            status: "PRESENT",
            handoverTime: "07:00",
            equipment: "چراغ‌قوه ضد انفجار EX، دتکتور گاز مونوکسید",
          },
          {
            post: "پست ۴ - لابی اصلی و میز هدایت ملاقات‌کنندگان",
            officerName: "سارا موسوی (کارآموز) + مریم علیزاده",
            personnelCode: "440112",
            status: "PRESENT",
            handoverTime: "07:00",
            equipment: "سامانه صدور کارت همراه هوشمند",
          },
        ],
        eventsLog: [
          {
            time: "07:35",
            title: "تحویل و تحول کامل شیفت ۲۴ ساعته صبح به صبح",
            description:
              "تجهیزات، کلیدهای اتاق سرور و داروخانه مخدر با امضای سوپروایزر تحویل گردید.",
            severity: "NORMAL",
          },
          {
            time: "09:10",
            title: "اعلام آمادگی گیت اورژانس برای فرود بالگرد اورژانس هوایی",
            description:
              "مسیر آمبولانس و هلی‌پد توسط انتظامات پاکسازی و بیمار ترومایی به اتاق عمل منتقل شد.",
            severity: "CRITICAL",
          },
          {
            time: "11:45",
            title: "تست دوره‌ای سیستم اعلام و اطفاء حریق بخش بستری ۳",
            description: "تست شیرهای آتش‌نشانی و اسپرینکلرها با حضور کارشناس HSE انجام شد.",
            severity: "NORMAL",
          },
        ],
        equipmentCheck: [
          {
            item: "بی‌سیم‌های دیجیتال Hytera (۱۶ دستگاه)",
            status: "OPERATIONAL",
            batteryLevel: "100%",
            note: "تمام کانال‌های عملیاتی تست شد",
          },
          {
            item: "دوربین‌های مداربسته مرکز مانیتورینگ (۱۴۲ دوربین IP)",
            status: "OPERATIONAL",
            batteryLevel: "UPS ONLINE",
            note: "دوربین راهروی شرقی طبقه ۲ تنظیم فوکوس شد",
          },
          {
            item: "گیت‌های بازرسی اشعه ایکس و راکت فلزیاب دستی",
            status: "OPERATIONAL",
            batteryLevel: "98%",
            note: "کالیبراسیون صبحگاهی انجام شد",
          },
          {
            item: "کپسول‌های اطفاء حریق پودر و گاز CO2 راهروها",
            status: "OPERATIONAL",
            batteryLevel: "CHARGED",
            note: "فشارسنج در محدوده سبز",
          },
        ],
        contractorsLog: [
          {
            company: "شرکت تهویه مطبوع البرز (سرویس چیلر مرکزی)",
            permitNumber: "HW-1403-882",
            workType: "کار گرم (جوشکاری خط لوله تاسیسات)",
            entryTime: "08:15",
            exitTime: "در حال فعالیت",
            escortOfficer: "مهدی کریمی",
          },
        ],
        visitorsLog: [
          {
            name: "دکتر مسعود رضایی و هیئت همراه",
            organization: "بازرسان اداره نظارت بر درمان وزارت بهداشت",
            purpose: "بازرسی ادواری اورژانس و داروخانه بیمارستان",
            entryTime: "09:30",
            exitTime: "12:15",
            status: "COMPLETED",
          },
        ],
        vehicleLog: [
          {
            plate: "ایران ۱۱ - ۴۸۲ ج ۷۳",
            type: "آمبولانس اورژانس ۱۱۵ تهران (کد ۵۲۲)",
            driver: "امیر حسینی",
            entryTime: "08:50",
            mission: "انتقال بیمار قلبی حاد به CCU",
          },
          {
            plate: "ایران ۲۲ - ۹۱۹ ط ۴۵",
            type: "کامیونت ویژه امحاء زباله عفونی اتوکلاو",
            driver: "حسن مرادی",
            entryTime: "06:45",
            mission: "تخلیه پسماند بی‌خطر شده طبق پروتکل",
          },
        ],
        incidentsLog: [
          {
            code: "CODE_WHITE",
            title: "اعلام کد سفید (تنش کلامی همراه بیمار در تریاژ اورژانس)",
            time: "09:12",
            location: "اورژانس و تریاژ مرکزی",
            officerInvolved: "علی محمدی (کد 583742)",
            resolution:
              "با حضور سریع در کمتر از ۴۵ ثانیه و تکنیک‌های آرام‌سازی (De-escalation)، فرد به اتاق مشاوره هدایت و تنش بدون آسیب فیزیکی خاتمه یافت.",
            status: "RESOLVED",
          },
        ],
        violationsLog: [
          {
            time: "10:20",
            offender: "خودرو شخصی پلاک ۵۵ن۸۲۱",
            violation: "توقف غیرمجاز در مسیر ویژه تردد آمبولانس اورژانس",
            actionTaken: "نصب اخطاریه حراست و تماس با مالک جهت جابجایی فوری",
          },
        ],
        patientStatusLog: [
          {
            patientId: "ADM-99412",
            ward: "بخش ارتوپدی مردان (اتاق ۳۰۲)",
            issue: "اقدام به خروج بدون برگه تسویه حساب (ترخیص با رضایت شخصی همراه با تنش مالی)",
            actionTaken:
              "هماهنگی با مددکاری اجتماعی بیمارستان و سوپروایزر پرستاری؛ مشکل تقسیط هزینه حل شد.",
          },
        ],
        companionCardsLog: [
          {
            ward: "ICU جراحی قلب باز",
            activeCards: 12,
            issuedToday: 4,
            returnedToday: 3,
            notes: "تمام کارت‌های همراه دارای بارکد RFID معتبر هستند.",
          },
          {
            ward: "CCU مرکزی",
            activeCards: 8,
            issuedToday: 2,
            returnedToday: 2,
            notes: "ورود همراهان صرفاً در ساعات ملاقات مجاز کنترل شد.",
          },
        ],
        facilityChecklist: [
          {
            zone: "موتورخانه مرکزی و بویلر بخار",
            status: "SAFE",
            checkedBy: "مهدی کریمی",
            time: "08:15",
            notes: "فشار دیگ بخار ۴.۲ بار - بدون نشتی",
          },
          {
            zone: "مخزن اکسیژن مایع کرایوژنیک مرکزی (VIE)",
            status: "SAFE",
            checkedBy: "علی محمدی",
            time: "08:45",
            notes: "سطح مخزن ۷۸٪ - فشار خط نرمال ۵.۵ بار",
          },
          {
            zone: "اتاق سرور مرکزی PACS و HIS بیمارستان",
            status: "SAFE",
            checkedBy: "رضا فرهادی",
            time: "09:00",
            notes: "دمای اتاق سرور ۱۹.۲ درجه سانتی‌گراد - سنسور حریق فعال",
          },
        ],
        supervisorComment:
          "وضعیت کلان امنیتی و ایمنی بیمارستان ابن‌سینا در شیفت جاری مطلوب است. گشت‌های QR طبق زمان‌بندی در حال انجام می‌باشد.",
        isFinalized: false,
      })
      .returning();
    currentShift = shift;
  } else {
    const shifts = await db.select().from(shiftReports).limit(1);
    currentShift = shifts[0];
  }

  // ۳. نقاط گشت‌زنی QR Code
  const existingPatrols = await db.select({ total: count() }).from(patrolTasks);
  if (Number(existingPatrols[0]?.total || 0) === 0 && currentShift) {
    console.log("Seeding patrol tasks...");
    const patrolSpots = [
      {
        locationCode: "LOC-MTR-01",
        locationName: "موتورخانه مرکزی و تاسیسات زیرزمین",
        zoneLevel: "CRITICAL",
        assignedTime: "08:30",
        status: "RED",
        targetLat: 35.72872,
        targetLng: 51.44195,
        scannedTime: null,
        scannedLat: null,
        scannedLng: null,
        geoDistanceMeters: null,
        hmacSignatureVerified: false,
        notes: "نقطه کور تاسیساتی با پشتیبانی کش آفلاین PWA (IndexedDB)",
      },
      {
        locationCode: "LOC-ER-02",
        locationName: "اورژانس و تریاژ مرکزی",
        zoneLevel: "CRITICAL",
        assignedTime: "09:15",
        status: "GREEN",
        targetLat: 35.72912,
        targetLng: 51.4424,
        scannedTime: new Date(Date.now() - 3600 * 1000),
        scannedLat: 35.72911,
        scannedLng: 51.44239,
        geoDistanceMeters: 2.1,
        hmacSignatureVerified: true,
        notes: "اسکن در ساعت 09:14 توسط علی محمدی (تایید امضای HMAC و ژئوفنس ۲.۱ متر)",
      },
      {
        locationCode: "LOC-MED-03",
        locationName: "انبار تجهیزات پزشکی استراتژیک",
        zoneLevel: "HIGH",
        assignedTime: "10:00",
        status: "YELLOW",
        targetLat: 35.72888,
        targetLng: 51.44265,
        scannedTime: new Date(Date.now() - 1200 * 1000),
        scannedLat: 35.72889,
        scannedLng: 51.44264,
        geoDistanceMeters: 3.4,
        hmacSignatureVerified: true,
        notes: "اسکن توسط افسر گشت ثبت شد؛ در انتظار تایید نهایی سوپروایزر شیفت",
      },
      {
        locationCode: "LOC-PHARM-04",
        locationName: "داروخانه داروهای خاص و مخدر (گاوصندوق مرکزی)",
        zoneLevel: "CRITICAL",
        assignedTime: "12:00",
        status: "RED",
        targetLat: 35.72905,
        targetLng: 51.44208,
        scannedTime: null,
        scannedLat: null,
        scannedLng: null,
        geoDistanceMeters: null,
        hmacSignatureVerified: false,
        notes: "بازدید پلمب الکترونیکی درب خزانه داروهای تحت کنترل",
      },
      {
        locationCode: "LOC-MORGUE-05",
        locationName: "سردخانه و واحد پزشکی قانونی بیمارستان",
        zoneLevel: "HIGH",
        assignedTime: "15:30",
        status: "RED",
        targetLat: 35.7286,
        targetLng: 51.4418,
        scannedTime: null,
        scannedLat: null,
        scannedLng: null,
        geoDistanceMeters: null,
        hmacSignatureVerified: false,
        notes: "بررسی دمای برودت و دفاتر ثبت تحویل متوفی",
      },
      {
        locationCode: "LOC-ICU-06",
        locationName: "بخش مراقبت‌های ویژه ICU جراحی قلب",
        zoneLevel: "CRITICAL",
        assignedTime: "18:00",
        status: "GREEN",
        targetLat: 35.72935,
        targetLng: 51.44222,
        scannedTime: new Date(Date.now() - 7200 * 1000),
        scannedLat: 35.72934,
        scannedLng: 51.44222,
        geoDistanceMeters: 1.8,
        hmacSignatureVerified: true,
        notes: "کنترل درب‌های اضطراری خروج حریق و کپسول‌های راهرو",
      },
      {
        locationCode: "LOC-ROOF-07",
        locationName: "پشت‌بام، پد فرود بالگرد و دکل مخابراتی",
        zoneLevel: "NORMAL",
        assignedTime: "22:00",
        status: "RED",
        targetLat: 35.7294,
        targetLng: 51.4425,
        scannedTime: null,
        scannedLat: null,
        scannedLng: null,
        geoDistanceMeters: null,
        hmacSignatureVerified: false,
        notes: "بازدید چراغ‌های هشدار هوانوردی و قفل دسترسی بام",
      },
      {
        locationCode: "LOC-GEN-08",
        locationName: "اتاق دیزل ژنراتور اضطراری برق ۱۰۰۰ کاوآ",
        zoneLevel: "CRITICAL",
        assignedTime: "02:00",
        status: "RED",
        targetLat: 35.72868,
        targetLng: 51.44275,
        scannedTime: null,
        scannedLat: null,
        scannedLng: null,
        geoDistanceMeters: null,
        hmacSignatureVerified: false,
        notes: "بررسی مخزن سوخت گازوئیل ذخیره ۷۲ ساعته",
      },
    ];

    for (const spot of patrolSpots) {
      const payload = generatePatrolQrPayload(
        spot.locationCode,
        spot.locationName,
        spot.targetLat,
        spot.targetLng
      );

      await db.insert(patrolTasks).values({
        shiftReportId: currentShift.id,
        locationCode: spot.locationCode,
        locationName: spot.locationName,
        zoneLevel: spot.zoneLevel,
        qrCodeHash: payload.hmac,
        targetLat: spot.targetLat,
        targetLng: spot.targetLng,
        geofenceRadiusMeters: 35,
        assignedTime: spot.assignedTime,
        status: spot.status,
        scannedTime: spot.scannedTime,
        officerId: spot.status !== "RED" ? aliMohammadi.id : null,
        scannedLat: spot.scannedLat,
        scannedLng: spot.scannedLng,
        geoDistanceMeters: spot.geoDistanceMeters,
        hmacSignatureVerified: spot.hmacSignatureVerified,
        supervisorApprovedBy: spot.status === "GREEN" ? rezaFarhadi.id : null,
        notes: spot.notes,
      });
    }
  }

  // ۴. بانک سوالات
  const existingQuestions = await db.select({ total: count() }).from(examQuestions);
  if (Number(existingQuestions[0]?.total || 0) === 0) {
    console.log("Seeding exam questions...");
    const sampleQuestions = [
      {
        code: "IQ-001",
        category: "IQ",
        domainName: "کنترل دسترسی و تردد",
        questionText:
          "در صورتی که ۳ دوربین مداربسته راهروی شمالی هر کدام هر ۱۲ ثانیه یک فریم پردازشی ارسال کنند و سرور در هر ثانیه حداکثر ۲ فریم ثبت کند، چند درصد از ظرفیت پردازش سرور توسط این سه دوربین اشغال می‌شود؟",
        options: [
          { id: "A", text: "۱۲.۵٪" },
          { id: "B", text: "۲۵٪" },
          { id: "C", text: "۵۰٪" },
          { id: "D", text: "۸.۳٪" },
        ],
        correctOptionId: "A",
        points: 2,
        explanation:
          "هر دوربین در ثانیه ۱/۱۲ فریم ارسال می‌کند؛ سه دوربین جمعاً ۳/۱۲ = ۰.۲۵ فریم بر ثانیه. نسبت ۰.۲۵ به ۲ برابر ۱۲.۵٪ است.",
      },
      {
        code: "IQ-002",
        category: "IQ",
        domainName: "مدیریت بحران و حریق",
        questionText:
          "دنباله کدهای هشدار بیمارستانی بر اساس اولویت تخلیه عمودی به صورت زیر ثبت شده است: [کد قرمز طبقه ۴ -> کد ۳۳ طبقه ۲ -> کد نارنجی ورودی]. اگر آسانسور حمل بیمار فقط در اختیار اولویت حیاتی باشد، ترتیب صحیح دسترسی کدام است؟",
        options: [
          { id: "A", text: "کد ۳۳ احیا -> کد قرمز حریق -> کد نارنجی مواد شیمیایی" },
          { id: "B", text: "کد قرمز -> کد نارنجی -> کد ۳۳" },
          { id: "C", text: "کد نارنجی -> کد ۳۳ -> کد قرمز" },
          { id: "D", text: "هر سه همزمان با آسانسور عمومی" },
        ],
        correctOptionId: "A",
        points: 2,
        explanation:
          "در پروتکل تریاژ بیمارستانی ابن‌سینا، نجات جان فوری بیمار تحت احیا (کد ۳۳) و سپس مهار حریق و تخلیه ایزوله اولویت بالاتری دارد.",
      },
      {
        code: "IQ-003",
        category: "IQ",
        domainName: "کنترل دسترسی و تردد",
        questionText:
          "اگر رمز عبور درب اتاق سرور از ۴ رقم متمایز تشکیل شده باشد که مجموع دو رقم اول ۱۰ و حاصل‌ضرب دو رقم آخر ۱۲ باشد، کدام گزینه می‌تواند رمز معتبر باشد؟",
        options: [
          { id: "A", text: "۷۳۴۳ (۷+۳=۱۰، ۴×۳=۱۲)" },
          { id: "B", text: "۸۲۶۲ (ارقام تکراری دارد)" },
          { id: "C", text: "۹۱۴۳ (۹+۱=۱۰، ۴×۳=۱۲ با ۴ رقم متمایز ۹، ۱، ۴، ۳)" },
          { id: "D", text: "۵۵۳۴ (ارقام تکراری دارد)" },
        ],
        correctOptionId: "C",
        points: 2,
        explanation: "تنها گزینه C شامل ۴ رقم کاملاً متمایز (۹، ۱، ۴، ۳) است.",
      },
      {
        code: "EQ-001",
        category: "EQ",
        domainName: "مدیریت تعارض و EQ",
        questionText:
          "همراه یک بیمار تصادفی بدحال در تریاژ اورژانس با صدای بلند فریاد می‌زند و به شیشه پذیرش ضربه می‌زند. اولین و مؤثرترین واکنش حرفه‌ای افسر انتظامات چیست؟",
        options: [
          {
            id: "A",
            text: "حفظ فاصله ایمن، برقراری تماس چشمی محترمانه، دعوت به آرامش با لحن همدلانه و هدایت فوری درخواست او به سرپرستار تریاژ",
          },
          {
            id: "B",
            text: "استفاده بلافاصله از اسپری یا باتوم برای مهار فیزیکی قبل از هرگونه گفتگو",
          },
          {
            id: "C",
            text: "فریاد متقابل برای تسلط بر صحنه و اخراج فرد از سالن اورژانس",
          },
          {
            id: "D",
            text: "ترک محل و سپردن موضوع به کادر درمان بدون مداخله",
          },
        ],
        correctOptionId: "A",
        points: 2,
        explanation:
          "اصول De-escalation در کدهای سفید بیمارستانی تأکید بر همدلی اولیه، تفکیک هیجان از تهدید و هدایت مراجع به مسئول پاسخگو دارد.",
      },
      {
        code: "EQ-002",
        category: "EQ",
        domainName: "مدیریت تعارض و EQ",
        questionText:
          "در پایان شیفت ۱۲ ساعته شب، یکی از همکاران انتظامات در تحویل پست تأخیر ۳۰ دقیقه‌ای دارد و شما خسته‌اید. رفتار سازمانی صحیح چیست؟",
        options: [
          {
            id: "A",
            text: "ترک پست رأس ساعت مقرر حتی بدون حضور نیروی جایگزین",
          },
          {
            id: "B",
            text: "ماندن در پست تا رسیدن جایگزین، ثبت محترمانه ساعت تحویل در دفتر وقایع و اطلاع به سوپروایزر شیفت بدون تنش لفظی",
          },
          {
            id: "C",
            text: "درگیری لفظی شدید با همکار در حضور بیماران و مراجعین",
          },
          {
            id: "D",
            text: "خاموش کردن بی‌سیم و خوابیدن در اتاق استراحت",
          },
        ],
        correctOptionId: "B",
        points: 2,
        explanation:
          "پست‌های حساس بیمارستانی تحت هیچ شرایطی نباید بدون تحویل حضوری ترک شوند.",
      },
      {
        code: "TECH-001",
        category: "TECHNICAL",
        domainName: "مدیریت بحران و حریق",
        questionText:
          "در صورت وقوع حریق ناشی از اتصالی تابلو برق اتاق سرور یا تجهیزات پزشکی MRI، استفاده از کدام کپسول اطفاء حریق مجاز و استاندارد است؟",
        options: [
          { id: "A", text: "کپسول گاز دی‌اکسید کربن (CO2) یا عامل پاک (Clean Agent)" },
          { id: "B", text: "شیلنگ آب قرقره فایرباکس (آب تحت فشار)" },
          { id: "C", text: "کپسول کف شیمیایی (Foam)" },
          { id: "D", text: "پاشش آب و نمک" },
        ],
        correctOptionId: "A",
        points: 2,
        explanation:
          "حریق‌های کلاس E (تجهیزات الکتریکی و حساس پزشکی) صرفاً باید با گاز CO2 یا Clean Agent اطفاء شوند.",
      },
      {
        code: "TECH-002",
        category: "TECHNICAL",
        domainName: "کنترل دسترسی و تردد",
        questionText:
          "پیمانکار تاسیسات قصد ورود کپسول هواگاز و دستگاه جوشکاری به موتورخانه مجاور مخزن اکسیژن مرکزی را دارد. شرط الزامی صدور مجوز چیست؟",
        options: [
          {
            id: "A",
            text: "صدور «پرمیت کار گرم (Hot Work Permit)»، اندازه‌گیری گازهای قابل اشتعال، حضور ناظر ایمنی با کپسول آماده و فاصله حداقل ۱۵ متری از مخزن اکسیژن",
          },
          { id: "B", text: "صرفاً یادداشت نام راننده در دفتر نگهبانی درب پشت" },
          { id: "C", text: "اجازه شفاهی سرکارگر تاسیسات" },
          { id: "D", text: "ورود آزاد در شیفت شب" },
        ],
        correctOptionId: "A",
        points: 2,
        explanation:
          "اکسیژن مایع و گاز تحت فشار به شدت اشتعال را تشدید می‌کند و هرگونه کار گرم نیازمند پرمیت رسمی و ایزولاسیون ایمنی است.",
      },
      {
        code: "TECH-003",
        category: "TECHNICAL",
        domainName: "گزارش‌نویسی و تحویل شیفت",
        questionText:
          "کدام ویژگی در ثبت گزارش حادثه در دفتر یا فرم الکترونیکی ۲۴ ساعته انتظامات از نظر حقوقی و پزشکی قانونی «نقص و ضعف جدی» محسوب می‌شود؟",
        options: [
          {
            id: "A",
            text: "استفاده از عبارات مبهم و قضاوتی شخصی (مثل: «طرف مقصر بود و احتمالاً مست بود») به جای ثبت دقیق زمان، مکان، شهود و وقایع عینی",
          },
          {
            id: "B",
            text: "ذکر دقیق کد پرسنلی و ساعت وقوع حادثه با دقت دقیقه",
          },
          {
            id: "C",
            text: "پیوست کردن شماره دوربین مداربسته ضبط‌کننده صحنه",
          },
          {
            id: "D",
            text: "امضای دیجیتال و تایید سوپروایزر وقت",
          },
        ],
        correctOptionId: "A",
        points: 2,
        explanation:
          "گزارش‌نویسی انتظامی و حقوقی بیمارستانی باید کاملاً عینی، مستند به زمان و فاقد پیش‌داوری غیرپزشکی باشد.",
      },
      {
        code: "TECH-004",
        category: "TECHNICAL",
        domainName: "گزارش‌نویسی و تحویل شیفت",
        questionText:
          "هنگام تحویل شیفت ۲۴ ساعته (ساعت ۰۷:۰۰ صبح)، کدام قلم باید کتباً و با شمارش فیزیکی دوطرفه در چک‌لیست ثبت شود؟",
        options: [
          {
            id: "A",
            text: "تعداد بی‌سیم‌ها و باتری یدک، پلمب کلید گاوصندوق داروخانه مخدر، کارت‌های تردد مستر و گزارش حوادث باز شیفت قبل",
          },
          { id: "B", text: "فقط تعداد صندلی‌های اتاق مانیتورینگ" },
          { id: "C", text: "صرفاً سلام و احوال‌پرسی شفاهی" },
          { id: "D", text: "تحویل کلیدها بدون ثبت شماره سریال" },
        ],
        correctOptionId: "A",
        points: 2,
        explanation:
          "تحویل اقلام امنیتی استراتژیک مستلزم شمارش و امضای تحویل‌دهنده و تحویل‌گیرنده است.",
      },
      {
        code: "TECH-005",
        category: "TECHNICAL",
        domainName: "کنترل دسترسی و تردد",
        questionText:
          "اگر کدهای QR ضد تقلب گشت‌زنی دارای امضای HMAC-SHA256 و ژئوفنسینگ باشند، تلاش برای اسکن عکس گرفته‌شده از QR در منزل چه نتیجه‌ای دارد؟",
        options: [
          {
            id: "A",
            text: "سیستم به دلیل عدم تطابق مختصات GPS (خارج از شعاع ۳۵ متری Geofence) و یا انقضای توکن زمانی امضا، اسکن را رد و هشدار تقلب ثبت می‌کند",
          },
          { id: "B", text: "اسکن به عنوان سبز تایید می‌شود" },
          { id: "C", text: "گوشی کاربر خاموش می‌شود" },
          { id: "D", text: "هیچ لاگی در سرور ثبت نمی‌شود" },
        ],
        correctOptionId: "A",
        points: 2,
        explanation:
          "ترکیب امضای HMAC زمان‌دار به همراه مختصات Geofencing مانع از جعل از راه دور می‌شود.",
      },
      {
        code: "ONB-DAY01-01",
        category: "ONBOARDING_14D",
        domainName: "آیین‌نامه‌ها و چارت سازمانی ابن‌سینا",
        questionText:
          "در چارت فرماندهی حادثه بیمارستانی (HICS) مرکز درمانی ابن‌سینا، افسر ارشد انتظامات مستقیماً زیر نظر کدام جایگاه عملیاتی فعالیت می‌کند؟",
        options: [
          { id: "A", text: "رئیس شاخه امنیت و حراست (Security Branch Director)" },
          { id: "B", text: "مسئول داروخانه سرپایی" },
          { id: "C", text: "پیمانکار فضای سبز" },
          { id: "D", text: "حسابداری ترخیص" },
        ],
        correctOptionId: "A",
        points: 2,
        dayNumber: 1,
        explanation:
          "ساختار استاندارد HICS بیمارستانی شاخه امنیت را مستقیماً ذیل رئیس بخش عملیات تعریف می‌کند.",
      },
    ];

    for (const q of sampleQuestions) {
      await db.insert(examQuestions).values(q);
    }
  }

  // ۵. کارنامه‌ها
  const existingSessions = await db.select({ total: count() }).from(examSessions);
  if (Number(existingSessions[0]?.total || 0) === 0) {
    console.log("Seeding exam sessions...");
    await db.insert(examSessions).values({
      userId: aliMohammadi.id,
      examType: "PERIODIC_A",
      examTitle: "آزمون جامع دوره‌ای شایستگی، روانشناختی و تخصصی (فرم A - اسفند ۱۴۰۳)",
      scoreTotal: 86,
      scoreIQ: 28,
      scoreEQ: 16,
      scoreTechnical: 42,
      timeSpentSeconds: 2140,
      passed: true,
      answers: {
        "IQ-001": "A",
        "IQ-002": "A",
        "IQ-003": "C",
        "EQ-001": "A",
        "EQ-002": "B",
        "TECH-001": "A",
        "TECH-002": "A",
        "TECH-003": "B",
        "TECH-004": "B",
      },
      skillGapAnalysis: {
        personnelCode: "583742",
        fullName: "علی محمدی",
        totalScore: 86,
        statusBadge: "🟢 قبول ممتاز (واجد شرایط ارتقای رتبه)",
        thresholdPass: 70,
        thresholdPromotion: 80,
        domains: [
          {
            domainName: "کنترل دسترسی و تردد",
            scorePercent: 100,
            status: "EXCELLENT",
            barVisual: "[████████████████████] 100% 🟢",
          },
          {
            domainName: "مدیریت تعارض و EQ",
            scorePercent: 80,
            status: "GOOD",
            barVisual: "[████████████████░░░░] 80%  🟢",
          },
          {
            domainName: "مدیریت بحران و حریق",
            scorePercent: 90,
            status: "EXCELLENT",
            barVisual: "[██████████████████░░] 90%  🟢",
          },
          {
            domainName: "گزارش‌نویسی و تحویل شیفت",
            scorePercent: 40,
            status: "WEAK",
            barVisual: "[████████░░░░░░░░░░░░] 40%  🔴 (ضعف)",
          },
        ],
        mandatoryCourses: [
          {
            courseTitle:
              "دوره بازآموزی الزامی پدافند و حراست: «اصول گزارش‌نویسی و تحویل شیفت»",
            deadlineDays: 7,
          },
        ],
        smartShiftRecommendation: {
          assignedPost: "پست ۲ - ورودی اورژانس و تریاژ مرکزی",
          crisisRole: "افسر فرماندهی صحنه در مانور حریق",
        },
        recommendedAction:
          "شرکت در دوره تجدید آموزش «اصول گزارش‌نویسی و تحویل شیفت»",
      },
    });
  }

  // ۶. لاگ‌بوک ۱۴ روزه آموزش پرسنل جدیدالورود (در صورت خالی بودن)
  const existingLogbooks = await db.select({ total: count() }).from(onboardingLogbooks);
  if (Number(existingLogbooks[0]?.total || 0) === 0) {
    console.log("Seeding 14-day onboarding logbooks...");
    const logbookPlan = [
      {
        day: 1,
        title: "آشنایی با آیین‌نامه انضباطی، منشور اخلاقی و چارت سازمانی ابن‌سینا",
        trainerScorePractical: 88,
        trainerScoreTheory: 92,
        trainerComments: "مطالعه کامل آیین‌نامه‌ها انجام شد؛ تسلط بر سلسله مراتب حفاظتی خوب است.",
        trainerApproved: true,
        managerScoreConduct: 90,
        managerRemarks: "ارزیابی انضباطی تایید شد. اخلاق حرفه‌ای مناسب.",
        managerApproved: true,
        status: "FINAL_APPROVED",
      },
      {
        day: 2,
        title: "اصول حفاظت فیزیکی، تحویل پست و کار با بی‌سیم دیجیتال Hytera",
        trainerScorePractical: 85,
        trainerScoreTheory: 88,
        trainerComments: "آشنایی با کانال‌های عملیاتی و اصطلاحات مخابراتی اورژانس.",
        trainerApproved: true,
        managerScoreConduct: 88,
        managerRemarks: "تایید صلاحیت کار با شبکه بی‌سیم مرکز.",
        managerApproved: true,
        status: "FINAL_APPROVED",
      },
      {
        day: 3,
        title: "کنترل تردد مراجعین، گیت‌های بازرسی و صدور کارت همراه هوشمند",
        trainerScorePractical: 90,
        trainerScoreTheory: 86,
        trainerComments: "کار با سامانه صدور کارت همراه و نحوه هدایت مراجعین تست شد.",
        trainerApproved: true,
        managerScoreConduct: 92,
        managerRemarks: "رفتار همدلانه با بیماران و مراجعین بخش‌های ویژه.",
        managerApproved: true,
        status: "FINAL_APPROVED",
      },
      {
        day: 4,
        title: "تریاژ اورژانس و مدیریت کدهای سفید (کنترل خشم و De-escalation)",
        trainerScorePractical: 82,
        trainerScoreTheory: 90,
        trainerComments: "تمرین سناریوی درگیری لفظی در تریاژ؛ کنترل هیجانی رضایت‌بخش بود.",
        trainerApproved: true,
        managerScoreConduct: 85,
        managerRemarks: "تایید آموزش مهارتی مدیریت تعارض بیمارستانی.",
        managerApproved: true,
        status: "FINAL_APPROVED",
      },
      {
        day: 5,
        title: "ایمنی تاسیسات حساس (موتورخانه مرکزی، مخازن اکسیژن و امحاء زباله)",
        trainerScorePractical: 89,
        trainerScoreTheory: 91,
        trainerComments: "بازدید میدانی از تاسیسات زیرزمین و نکات ایمنی خطوط بخار و اکسیژن.",
        trainerApproved: true,
        managerScoreConduct: 90,
        managerRemarks: "تایید رعایت پروتکل‌های پدافند در اماکن حیاتی.",
        managerApproved: true,
        status: "FINAL_APPROVED",
      },
      {
        day: 6,
        title: "اطفاء حریق کلاس E، کار با کپسول‌های CO2 و فایرباکس‌های بیمارستان",
        trainerScorePractical: 94,
        trainerScoreTheory: 88,
        trainerComments: "شلیک عملیاتی کپسول پودر و CO2 در مانور محوطه باز بیمارستان.",
        trainerApproved: true,
        managerScoreConduct: 95,
        managerRemarks: "مهارت عالی در کار با ادوات اطفای حریق بیمارستانی.",
        managerApproved: true,
        status: "FINAL_APPROVED",
      },
      {
        day: 7,
        title: "گشت‌زنی QR Code با امضای HMAC و ژئوفنسینگ در نقاط کور",
        trainerScorePractical: 92,
        trainerScoreTheory: 94,
        trainerComments: "انجام موفقیت‌آمیز گشت نقاط ۸ گانه با تبلت PWA و کش آفلاین.",
        trainerApproved: true,
        managerScoreConduct: 93,
        managerRemarks: "تایید کارنامه پایان هفته اول؛ آمادگی برای دوره عملی هفته دوم.",
        managerApproved: true,
        status: "FINAL_APPROVED",
      },
      {
        day: 8,
        title: "مدیریت کدهای اضطراری بیمارستانی (کد ۳۳ احیا، کد قرمز حریق، کد زرد بحران)",
        trainerScorePractical: 80,
        trainerScoreTheory: 85,
        trainerComments: "تمرین مسیرهای بازگشایی آسانسور حمل بیمار در زمان کد ۳۳.",
        trainerApproved: true,
        managerScoreConduct: 0,
        managerRemarks: "در انتظار ثبت دستی ارزیابی مدیر حراست...",
        managerApproved: false,
        status: "TRAINER_APPROVED",
      },
      {
        day: 9,
        title: "حفاظت از داروخانه مخدر، خزانه اسناد و دوربین‌های نظارتی PACS",
        trainerScorePractical: 0,
        trainerScoreTheory: 0,
        trainerComments: "برنامه‌ریزی‌شده برای فردا ساعت ۰۹:۰۰...",
        trainerApproved: false,
        managerScoreConduct: 0,
        managerRemarks: "",
        managerApproved: false,
        status: "PENDING",
      },
      {
        day: 10,
        title: "اصول گزارش‌نویسی حقوقی و پزشکی قانونی در حوادث بیمارستان",
        trainerScorePractical: 0,
        trainerScoreTheory: 0,
        trainerComments: "در انتظار اجرا...",
        trainerApproved: false,
        managerScoreConduct: 0,
        managerRemarks: "",
        managerApproved: false,
        status: "PENDING",
      },
      {
        day: 11,
        title: "پرمیت‌های کار گرم و سرد، نظارت بر پیمانکاران تاسیسات",
        trainerScorePractical: 0,
        trainerScoreTheory: 0,
        trainerComments: "در انتظار اجرا...",
        trainerApproved: false,
        managerScoreConduct: 0,
        managerRemarks: "",
        managerApproved: false,
        status: "PENDING",
      },
      {
        day: 12,
        title: "مدیریت بیماران متواری و تنش‌های مالی ترخیص با مددکاری",
        trainerScorePractical: 0,
        trainerScoreTheory: 0,
        trainerComments: "در انتظار اجرا...",
        trainerApproved: false,
        managerScoreConduct: 0,
        managerRemarks: "",
        managerApproved: false,
        status: "PENDING",
      },
      {
        day: 13,
        title: "مانور سناریوی ترکیبی بحران زلزله و قطعی برق دیزل ژنراتور",
        trainerScorePractical: 0,
        trainerScoreTheory: 0,
        trainerComments: "در انتظار اجرا...",
        trainerApproved: false,
        managerScoreConduct: 0,
        managerRemarks: "",
        managerApproved: false,
        status: "PENDING",
      },
      {
        day: 14,
        title: "ارزیابی جامع عملیاتی نهایی و تحلیف خدمت در گیت اصلی",
        trainerScorePractical: 0,
        trainerScoreTheory: 0,
        trainerComments: "آزمون پایان دوره و اعطای نشان رسمی حراست ابن‌سینا.",
        trainerApproved: false,
        managerScoreConduct: 0,
        managerRemarks: "",
        managerApproved: false,
        status: "PENDING",
      },
    ];

    for (const lb of logbookPlan) {
      await db.insert(onboardingLogbooks).values({
        traineeId: saraMousavi.id,
        dayNumber: lb.day,
        dateString: `1403/12/${lb.day < 10 ? "0" + lb.day : lb.day}`,
        topicTitle: lb.title,
        trainerId: rezaFarhadi.id,
        trainerName: "رضا فرهادی (سرپرست آموزش انتظامات)",
        trainerScorePractical: lb.trainerScorePractical,
        trainerScoreTheory: lb.trainerScoreTheory,
        trainerComments: lb.trainerComments,
        trainerApproved: lb.trainerApproved,
        trainerSignedAt: lb.trainerApproved ? new Date() : null,
        managerId: drBahrami.id,
        managerScoreConduct: lb.managerScoreConduct,
        managerRemarks: lb.managerRemarks,
        managerApproved: lb.managerApproved,
        managerSignedAt: lb.managerApproved ? new Date() : null,
        status: lb.status,
      });
    }
  }

  // ۷. ثبت بیومتریک و اتصال به سامانه HIS بیمارستان ابن‌سینا
  const existingBiometrics = await db.select({ total: count() }).from(biometricEnrollments);
  if (Number(existingBiometrics[0]?.total || 0) <= 1) {
    console.log("Seeding biometric enrollments...");
    const [existSara] = await db
      .select()
      .from(biometricEnrollments)
      .where(eq(biometricEnrollments.userId, saraMousavi.id));

    if (!existSara) {
      await db.insert(biometricEnrollments).values({
        userId: saraMousavi.id,
        hisSourceSystem: "AVICENNA_HOSPITAL_HIS_V4",
        hisNationalCode: "0018492011",
        hisPersonnelId: "HIS-EMP-440112",
        hisSyncStatus: "SYNCHRONIZED",
        faceTemplateHash: "SHA256:E9F241BA7809C8DE81A7210FE98B4125CC9190",
        faceLivenessConfidence: 0.985,
        faceScanDate: new Date(),
        fingerprintHash: "FING_TMP_INDEX_R_78491048ACF90218490",
        fingerprintConfidence: 0.992,
        fingerprintScanDate: new Date(),
        fingerType: "RIGHT_INDEX",
        enrolledByManagerId: drBahrami.id,
        notes: "ثبت کامل اثر انگشت اپتیکال و بردار چهره بیومتریک با تایید مدیر حراست و استعلام وب‌سرویس HIS بیمارستان.",
      });
    }

    const [existAli] = await db
      .select()
      .from(biometricEnrollments)
      .where(eq(biometricEnrollments.userId, aliMohammadi.id));

    if (!existAli) {
      await db.insert(biometricEnrollments).values({
        userId: aliMohammadi.id,
        hisSourceSystem: "AVICENNA_HOSPITAL_HIS_V4",
        hisNationalCode: "0074928192",
        hisPersonnelId: "HIS-EMP-583742",
        hisSyncStatus: "SYNCHRONIZED",
        faceTemplateHash: "SHA256:F4B192A093CC18903EF829A09823419080A12",
        faceLivenessConfidence: 0.991,
        faceScanDate: new Date(),
        fingerprintHash: "FING_TMP_INDEX_R_99214088ACF1029190",
        fingerprintConfidence: 0.995,
        fingerprintScanDate: new Date(),
        fingerType: "RIGHT_INDEX",
        enrolledByManagerId: drBahrami.id,
        notes: "پروفایل بیومتریک افسر حراست تاییدشده در سامانه HIS.",
      });
    }
  }

  console.log("Avicenna Hospital Security database seed check completed!");
}
