import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import {
  AuditLog,
  NotificationItem,
  Task,
  User,
  UserWithPasswordHash,
} from '../../types';

interface DatabaseSchema {
  users: UserWithPasswordHash[];
  tasks: Task[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

class Database {
  private data: DatabaseSchema = {
    users: [],
    tasks: [],
    notifications: [],
    auditLogs: [],
  };

  private initialized = false;

  constructor() {
    this.ensureDataDir();
  }

  private ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  public async init() {
    if (this.initialized) return;

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log('[Database] Loaded existing database from disk.');
      } catch (err) {
        console.error('[Database] Failed to read database file, re-initializing:', err);
        await this.seedInitialData();
      }
    } else {
      await this.seedInitialData();
    }

    // Always ensure the official initial Admin exists per Requirement 4
    await this.ensureInitialAdmin();

    this.initialized = true;
  }

  private async ensureInitialAdmin() {
    const adminEmail = process.env.ADMIN_INITIAL_EMAIL || 'almoosatradinghrd@gmail.com';
    const adminPassword = process.env.ADMIN_INITIAL_PASSWORD || 'Sairam009$';

    let admin = this.data.users.find((u) => u.email.toLowerCase() === adminEmail.toLowerCase());
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    if (!admin) {
      admin = {
        id: 'usr-admin-001',
        name: 'Tariq Al-Moosa',
        nameAr: 'طارق الموسى',
        employeeId: 'EMP-0001',
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        department: 'Executive HR & Administration',
        departmentAr: 'الموارد البشرية والإدارة التنفيذية',
        jobTitle: 'HR Director',
        jobTitleAr: 'مدير الموارد البشرية',
        managerId: null,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        status: 'ACTIVE',
        mustChangePassword: false,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        createdBy: 'SYSTEM_BOOTSTRAP',
        approvedBy: 'SYSTEM_BOOTSTRAP',
        approvalDate: new Date().toISOString(),
      };
      this.data.users.unshift(admin);
      this.save();
      console.log(`[Database] Initial Admin account provisioned: ${adminEmail}`);
    } else {
      // Ensure admin retains active status & role
      admin.role = 'ADMIN';
      admin.status = 'ACTIVE';
      admin.passwordHash = passwordHash;
      this.save();
    }
  }

  private async seedInitialData() {
    const defaultManagerPassword = await bcrypt.hash('Manager123!', 10);
    const defaultEmployeePassword = await bcrypt.hash('Employee123!', 10);

    const initialUsers: UserWithPasswordHash[] = [
      {
        id: 'usr-sarah',
        name: 'Sarah Al-Otaibi',
        nameAr: 'سارة العتيبي',
        employeeId: 'EMP-0102',
        email: 's.otaibi@almoosa.com.sa',
        passwordHash: defaultManagerPassword,
        role: 'MANAGER',
        department: 'Marketing & Commercial Operations',
        departmentAr: 'التسويق والعمليات التجارية',
        jobTitle: 'Marketing & Operations Manager',
        jobTitleAr: 'مديرة التسويق والعمليات التجارية',
        managerId: 'usr-admin-001',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        status: 'ACTIVE',
        mustChangePassword: false,
        emailVerified: true,
        createdAt: '2026-10-15T08:00:00Z',
        createdBy: 'usr-admin-001',
        approvedBy: 'usr-admin-001',
        approvalDate: '2026-10-15T08:00:00Z',
      },
      {
        id: 'usr-khalid',
        name: 'Khalid Al-Ghamdi',
        nameAr: 'خالد الغامدي',
        employeeId: 'EMP-0105',
        email: 'k.ghamdi@almoosa.com.sa',
        passwordHash: defaultManagerPassword,
        role: 'MANAGER',
        department: 'Supply Chain & Logistics',
        departmentAr: 'سلاسل الإمداد والخدمات اللوجستية',
        jobTitle: 'Supply Chain Director',
        jobTitleAr: 'مدير سلاسل الإمداد واللوجستيات',
        managerId: 'usr-admin-001',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        status: 'ACTIVE',
        mustChangePassword: false,
        emailVerified: true,
        createdAt: '2026-10-16T08:00:00Z',
        createdBy: 'usr-admin-001',
        approvedBy: 'usr-admin-001',
        approvalDate: '2026-10-16T08:00:00Z',
      },
      {
        id: 'usr-ahmed',
        name: 'Ahmed Mansoor',
        nameAr: 'أحمد منصور',
        employeeId: 'EMP-0205',
        email: 'a.mansoor@almoosa.com.sa',
        passwordHash: defaultEmployeePassword,
        role: 'EMPLOYEE',
        department: 'Marketing & Commercial Operations',
        departmentAr: 'التسويق والعمليات التجارية',
        jobTitle: 'HR & Commercial Coordinator',
        jobTitleAr: 'منسق الموارد البشرية والعمليات',
        managerId: 'usr-sarah',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        status: 'ACTIVE',
        mustChangePassword: false,
        emailVerified: true,
        createdAt: '2026-10-18T09:00:00Z',
        createdBy: 'usr-sarah',
        approvedBy: 'usr-admin-001',
        approvalDate: '2026-10-18T09:30:00Z',
      },
      {
        id: 'usr-fatima',
        name: 'Fatima Al-Zahra',
        nameAr: 'فاطمة الزهراء',
        employeeId: 'EMP-0210',
        email: 'f.zahra@almoosa.com.sa',
        passwordHash: defaultEmployeePassword,
        role: 'EMPLOYEE',
        department: 'Marketing & Commercial Operations',
        departmentAr: 'التسويق والعمليات التجارية',
        jobTitle: 'Graphic & Content Specialist',
        jobTitleAr: 'أخصائية التصميم والمحتوى الرقمي',
        managerId: 'usr-sarah',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
        status: 'ACTIVE',
        mustChangePassword: false,
        emailVerified: true,
        createdAt: '2026-10-19T10:00:00Z',
        createdBy: 'usr-sarah',
        approvedBy: 'usr-admin-001',
        approvalDate: '2026-10-19T10:30:00Z',
      },
      {
        id: 'usr-omar',
        name: 'Omar Farooq',
        nameAr: 'عمر فاروق',
        employeeId: 'EMP-0312',
        email: 'o.farooq@almoosa.com.sa',
        passwordHash: defaultEmployeePassword,
        role: 'EMPLOYEE',
        department: 'Supply Chain & Logistics',
        departmentAr: 'سلاسل الإمداد والخدمات اللوجستية',
        jobTitle: 'Senior Logistics Specialist',
        jobTitleAr: 'أخصائي أول خدمات لوجستية',
        managerId: 'usr-khalid',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
        status: 'ACTIVE',
        mustChangePassword: false,
        emailVerified: true,
        createdAt: '2026-10-20T08:00:00Z',
        createdBy: 'usr-khalid',
        approvedBy: 'usr-admin-001',
        approvalDate: '2026-10-20T08:30:00Z',
      },
      {
        id: 'usr-layla',
        name: 'Layla Al-Nabil',
        nameAr: 'ليلى النبيل',
        employeeId: 'EMP-0315',
        email: 'l.nabil@almoosa.com.sa',
        passwordHash: defaultEmployeePassword,
        role: 'EMPLOYEE',
        department: 'Supply Chain & Logistics',
        departmentAr: 'سلاسل الإمداد والخدمات اللوجستية',
        jobTitle: 'Inventory Control Officer',
        jobTitleAr: 'مسؤولة مراقبة المخزون والجرد',
        managerId: 'usr-khalid',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        status: 'ACTIVE',
        mustChangePassword: false,
        emailVerified: true,
        createdAt: '2026-10-21T09:00:00Z',
        createdBy: 'usr-khalid',
        approvedBy: 'usr-admin-001',
        approvalDate: '2026-10-21T09:30:00Z',
      },
      // Sample pending onboarding request for Admin approval dashboard demonstration
      {
        id: 'usr-zaid',
        name: 'Zaid Al-Shamrani',
        nameAr: 'زيد الشمراني',
        employeeId: 'EMP-0220',
        email: 'z.shamrani@almoosa.com.sa',
        passwordHash: defaultEmployeePassword,
        role: 'EMPLOYEE',
        department: 'Marketing & Commercial Operations',
        departmentAr: 'التسويق والعمليات التجارية',
        jobTitle: 'E-Commerce Marketing Associate',
        jobTitleAr: 'مساعد تسويق التجارة الإلكترونية',
        managerId: 'usr-sarah',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
        status: 'PENDING_APPROVAL',
        mustChangePassword: true,
        emailVerified: true,
        createdAt: '2026-10-29T10:00:00Z',
        createdBy: 'usr-sarah',
        approvedBy: null,
        approvalDate: null,
      },
      // Sample suspended user
      {
        id: 'usr-suspended-01',
        name: 'Majed Al-Ghamdi',
        nameAr: 'ماجد الغامدي',
        employeeId: 'EMP-0991',
        email: 'm.ghamdi@almoosa.com.sa',
        passwordHash: defaultEmployeePassword,
        role: 'EMPLOYEE',
        department: 'Operations',
        departmentAr: 'العمليات',
        jobTitle: 'Operations Clerk',
        jobTitleAr: 'كاتب عمليات',
        managerId: 'usr-sarah',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
        status: 'SUSPENDED',
        mustChangePassword: false,
        emailVerified: true,
        createdAt: '2026-10-01T08:00:00Z',
        createdBy: 'usr-admin-001',
      },
    ];

    const initialTasks: Task[] = [
      {
        id: 'tsk-101',
        title: 'Onboard Q4 Branch Sales Representatives',
        titleAr: 'تهيئة وتدريب ممثلي المبيعات الجدد للربع الرابع',
        description:
          'Prepare employee contracts, issue security access badges, set up corporate emails, and organize mandatory orientation workshops for the 4 newly hired commercial reps in the Riyadh showroom.',
        descriptionAr:
          'تجهيز عقود العمل، وإصدار بطاقات الدخول الأمنية، وإعداد البريد الإلكتروني المؤسسي، وتنظيم ورشة التهيئة لـ 4 ممثلي مبيعات جدد في معرض الرياض الرئيسي.',
        assignedToId: 'usr-ahmed',
        assignedById: 'usr-sarah',
        priority: 'HIGH',
        status: 'IN_PROGRESS',
        category: 'HR_ONBOARDING',
        allocationDate: '2026-10-24T08:30:00Z',
        dueDate: '2026-11-04T15:00:00Z',
        createdAt: '2026-10-24T08:30:00Z',
        updatedAt: '2026-10-28T11:20:00Z',
        progress: 65,
        attachments: [
          {
            id: 'att-01',
            name: 'Sales_Orientation_Checklist_2026.pdf',
            sizeBytes: 1420000,
            type: 'application/pdf',
            url: '#',
            uploadedAt: '2026-10-24T08:35:00Z',
            uploadedById: 'usr-sarah',
            uploadedByName: 'Sarah Al-Otaibi',
          },
        ],
        comments: [
          {
            id: 'com-01',
            userId: 'usr-sarah',
            userName: 'Sarah Al-Otaibi',
            userRole: 'MANAGER',
            content: 'Please ensure badges are printed before Thursday morning orientation.',
            createdAt: '2026-10-24T09:00:00Z',
          },
        ],
      },
      {
        id: 'tsk-102',
        title: 'Brand Identity Assets for Annual Trade Fair',
        titleAr: 'تطوير تصاميم الهوية المعرض التجاري السنوي',
        description:
          'Design roll-up banners, brochures, company catalog sleeves, and social media announcements conforming to the 2026 AlMoosa Trading brand guidelines. High-res print files required.',
        descriptionAr:
          'تصميم الرول أب والكتيبات وأغلفة الكتالوجات وإعلانات منصات التواصل وفق الهوية المعتمدة لشركة الموسى التجارية لعام 2026 مع تسليم ملفات الطباعة عالية الدقة.',
        assignedToId: 'usr-fatima',
        assignedById: 'usr-sarah',
        priority: 'URGENT',
        status: 'ASSIGNED',
        category: 'MARKETING',
        allocationDate: '2026-10-22T09:00:00Z',
        dueDate: '2026-10-31T12:00:00Z',
        createdAt: '2026-10-22T09:00:00Z',
        updatedAt: '2026-10-29T08:45:00Z',
        progress: 90,
        attachments: [],
        comments: [],
      },
      {
        id: 'tsk-103',
        title: 'Warehouse Fire Safety & Evacuation Audit',
        titleAr: 'تدقيق السلامة والوقاية من الحرائق بمستودعات السلي',
        description:
          'Perform comprehensive physical inspection of fire extinguishers, emergency exits, alarm sensors, and conduct a scheduled drill for logistics team members in Al-Sulay Central Warehouse.',
        descriptionAr:
          'إجراء فحص ميداني شامل لطفايات الحريق ومخارج الطوارئ ومستشعرات الإنذار مع تنفيذ تجربة إخلاء وهمية لفريق المستودعات المركزي بالسلي.',
        assignedToId: 'usr-omar',
        assignedById: 'usr-khalid',
        priority: 'MEDIUM',
        status: 'IN_PROGRESS',
        category: 'COMPLIANCE',
        allocationDate: '2026-10-26T07:30:00Z',
        dueDate: '2026-11-10T11:00:00Z',
        createdAt: '2026-10-26T07:30:00Z',
        updatedAt: '2026-10-27T13:00:00Z',
        progress: 40,
        attachments: [],
        comments: [],
      },
      {
        id: 'tsk-104',
        title: 'Delivery Fleet Inspection & Registration Renewal',
        titleAr: 'تجديد فحص وتراخيص أسطول مركبات التوزيع',
        description:
          'Verify MVPI inspection certificates, renew Istimara vehicle licenses, and update maintenance logs for 12 refrigerated commercial vans.',
        descriptionAr:
          'فحص شهادات الفحص الدوري وتجديد استمارات المركبات وتحديث سجلات الصيانة الدورية لـ 12 شاحنة تبريد لنقل البضائع.',
        assignedToId: 'usr-omar',
        assignedById: 'usr-khalid',
        priority: 'HIGH',
        status: 'OVERDUE',
        category: 'OPERATIONS',
        allocationDate: '2026-10-18T08:00:00Z',
        dueDate: '2026-10-27T17:00:00Z',
        createdAt: '2026-10-18T08:00:00Z',
        updatedAt: '2026-10-26T14:00:00Z',
        progress: 25,
        attachments: [],
        comments: [],
      },
      {
        id: 'tsk-105',
        title: 'Q3 Physical Inventory Count Reconciliation',
        titleAr: 'مطابقة الجرد الفعلي لمخزون الربع الثالث',
        description:
          'Reconcile physical stock counts against ERP ledger balances, document SKU variances, and submit financial adjustment report for executive approval.',
        descriptionAr:
          'مطابقة الجرد الفعلي للمستودعات مع أرصدة نظام ERP المعتمد، وتوثيق الفروقات، وتقديم تقرير التسويات للإدارة المالية.',
        assignedToId: 'usr-layla',
        assignedById: 'usr-khalid',
        priority: 'HIGH',
        status: 'COMPLETED',
        category: 'PROCUREMENT',
        allocationDate: '2026-10-15T09:00:00Z',
        dueDate: '2026-10-25T16:00:00Z',
        createdAt: '2026-10-15T09:00:00Z',
        updatedAt: '2026-10-25T15:30:00Z',
        completedAt: '2026-10-25T15:30:00Z',
        progress: 100,
        attachments: [],
        comments: [],
      },
    ];

    const initialNotifications: NotificationItem[] = [
      {
        id: 'notif-01',
        recipientUserId: 'usr-ahmed',
        title: 'New Task Assigned',
        titleAr: 'تم تكليفك بمهمة جديدة',
        message: 'Sarah Al-Otaibi assigned you "Onboard Q4 Branch Sales Representatives"',
        messageAr: 'قامت سارة العتيبي بتكليفك بمهمة "تهيئة وتدريب ممثلي المبيعات الجدد للربع الرابع"',
        taskId: 'tsk-101',
        read: false,
        createdAt: '2026-10-24T08:30:00Z',
        type: 'ASSIGNMENT',
      },
      {
        id: 'notif-02',
        recipientUserId: 'usr-sarah',
        title: 'Task Progress Update',
        titleAr: 'تحديث في نسبة إنجاز المهمة',
        message: 'Ahmed Mansoor updated progress on "Onboard Q4 Branch Sales Representatives" to 65%.',
        messageAr: 'قام أحمد منصور بتحديث نسبة إنجاز مهمة المبيعات إلى 65%.',
        taskId: 'tsk-101',
        read: false,
        createdAt: '2026-10-28T11:20:00Z',
        type: 'STATUS_CHANGE',
      },
      {
        id: 'notif-03',
        recipientUserId: 'usr-admin-001',
        title: 'New Account Pending Approval',
        titleAr: 'حساب موظف جديد بانتظار الاعتماد',
        message: 'Zaid Al-Shamrani (EMP-0220) created by Sarah Al-Otaibi is awaiting approval.',
        messageAr: 'حساب زيد الشمراني (EMP-0220) بانتظار اعتماد الإدارة للموافقة على التفعيل.',
        taskId: null,
        read: false,
        createdAt: '2026-10-29T10:00:00Z',
        type: 'APPROVAL',
      },
    ];

    const initialAuditLogs: AuditLog[] = [
      {
        id: 'log-01',
        timestamp: '2026-10-30T08:00:00Z',
        actorId: 'SYSTEM_BOOTSTRAP',
        actorName: 'System Bootstrap',
        actorRole: 'ADMIN',
        action: 'SYSTEM_INIT',
        actionAr: 'تهيئة النظام',
        details: 'Initial secure database schema initialized with Admin account.',
        detailsAr: 'تمت تهيئة قاعدة البيانات الآمنة وتثبيت حساب المدير العام.',
        category: 'SECURITY',
        status: 'SUCCESS',
        ipAddress: '127.0.0.1',
      },
      {
        id: 'log-02',
        timestamp: '2026-10-29T10:05:00Z',
        actorId: 'usr-sarah',
        actorName: 'Sarah Al-Otaibi',
        actorRole: 'MANAGER',
        action: 'EMPLOYEE_INVITED',
        actionAr: 'تسجيل موظف جديد',
        details: 'Submitted onboarding profile for Zaid Al-Shamrani (EMP-0220), status PENDING_APPROVAL',
        detailsAr: 'تم إرسال طلب انضمام الموظف زيد الشمراني (EMP-0220) بحالة قيد الاعتماد',
        category: 'APPROVAL',
        status: 'SUCCESS',
        ipAddress: '10.14.20.104',
      },
    ];

    this.data = {
      users: initialUsers,
      tasks: initialTasks,
      notifications: initialNotifications,
      auditLogs: initialAuditLogs,
    };

    this.save();
    console.log('[Database] Seeded initial database.');
  }

  public save() {
    this.ensureDataDir();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  }

  // --- Users Operations ---
  public getUsers(): UserWithPasswordHash[] {
    return this.data.users;
  }

  public getPublicUsers(): User[] {
    return this.data.users.map(({ passwordHash, ...user }) => user);
  }

  public findUserById(id: string): UserWithPasswordHash | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public findUserByEmail(email: string): UserWithPasswordHash | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  public addUser(user: UserWithPasswordHash) {
    this.data.users.push(user);
    this.save();
  }

  public updateUser(id: string, updates: Partial<UserWithPasswordHash>) {
    const idx = this.data.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.data.users[idx] = { ...this.data.users[idx], ...updates };
      this.save();
      return this.data.users[idx];
    }
    return undefined;
  }

  public deleteUser(id: string) {
    this.data.users = this.data.users.filter((u) => u.id !== id);
    this.save();
  }

  // --- Tasks Operations ---
  public getTasks(): Task[] {
    return this.data.tasks;
  }

  public findTaskById(id: string): Task | undefined {
    return this.data.tasks.find((t) => t.id === id);
  }

  public addTask(task: Task) {
    if (task.position === undefined) {
      const empTasks = this.data.tasks.filter((t) => t.assignedToId === task.assignedToId);
      const minPos = empTasks.reduce((min, t) => Math.min(min, t.position ?? 0), 0);
      task.position = minPos <= 0 ? minPos - 1 : 0;
    }
    this.data.tasks.unshift(task);
    this.save();
  }

  public reorderTasksForEmployee(employeeId: string, orderedTaskIds: string[]): Task[] {
    const idToPosition = new Map<string, number>();
    orderedTaskIds.forEach((id, index) => {
      idToPosition.set(id, index);
    });

    this.data.tasks.forEach((t) => {
      if (t.assignedToId === employeeId && idToPosition.has(t.id)) {
        t.position = idToPosition.get(t.id);
        t.updatedAt = new Date().toISOString();
      }
    });

    this.save();
    return this.getTasksForEmployee(employeeId);
  }

  public getTasksForEmployee(employeeId: string): Task[] {
    const empTasks = this.data.tasks.filter((t) => t.assignedToId === employeeId);
    return empTasks.sort((a, b) => {
      const posA = a.position !== undefined ? a.position : 999999;
      const posB = b.position !== undefined ? b.position : 999999;
      if (posA !== posB) return posA - posB;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  public updateTask(id: string, updates: Partial<Task>) {
    const idx = this.data.tasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.data.tasks[idx] = { ...this.data.tasks[idx], ...updates, updatedAt: new Date().toISOString() };
      this.save();
      return this.data.tasks[idx];
    }
    return undefined;
  }

  public deleteTask(id: string) {
    this.data.tasks = this.data.tasks.filter((t) => t.id !== id);
    this.save();
  }

  // --- Notifications Operations ---
  public getNotifications(userId?: string): NotificationItem[] {
    if (!userId) return this.data.notifications;
    return this.data.notifications.filter((n) => n.recipientUserId === userId);
  }

  public addNotification(notification: NotificationItem) {
    this.data.notifications.unshift(notification);
    this.save();
  }

  public markNotificationAsRead(id: string, userId: string) {
    const notif = this.data.notifications.find((n) => n.id === id && n.recipientUserId === userId);
    if (notif) {
      notif.read = true;
      notif.readDate = new Date().toISOString();
      this.save();
    }
  }

  public markAllNotificationsAsRead(userId: string) {
    this.data.notifications.forEach((n) => {
      if (n.recipientUserId === userId) {
        n.read = true;
        n.readDate = new Date().toISOString();
      }
    });
    this.save();
  }

  // --- Audit Logs Operations ---
  public getAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  public addAuditLog(log: AuditLog) {
    this.data.auditLogs.unshift(log);
    this.save();
  }
}

export const db = new Database();
