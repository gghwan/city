export type Role = 'USER' | 'ADMIN';

export type FileType = 'SERVICE' | 'EMERGENCY' | 'TALK';

export interface SessionUser {
  id: string;
  username: string;
  role: Role;
}

export interface FileItem {
  id: number;
  type: FileType;
  name: string;
  description: string | null;
  storagePath: string;
  mimeType: string;
  sizeBytes: number | null;
  createdAt: string;
  signedUrl?: string;
}

export interface EmergencyContactItem {
  id: number;
  name: string;
  role: string;
  phone: string;
  note: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface LinkValue {
  url: string;
  updatedAt: string | null;
}

export interface LinkSet {
  map: LinkValue;
  card: LinkValue;
  talk: LinkValue;
}

export interface NoticeItem {
  id: number;
  title: string;
  content: string;
  isPinned: boolean;
  noticeType: 'GENERAL' | 'EMERGENCY';
  createdAt: string;
}

export interface AppMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type ScheduleSessionKey = 'AM' | 'PM';
export type SlotStatus = 'open' | 'assigned' | 'closed';

export interface SlotApplicationItem {
  applicationId: string;
  applicantId: string;
  applicantName: string;
  submittedAt: string;
  note: string | null;
}

export interface ScheduleSlotItem {
  slotNo: number;
  status: SlotStatus;
  label: string | null;
  memberName: string | null;
  isLeaderSlot: boolean;
  applications: SlotApplicationItem[];
}

export interface ScheduleSessionItem {
  key: ScheduleSessionKey;
  title?: string;
  time: string;
  zone: string;
  leader: string;
  adminMemo: string | null;
  slots: ScheduleSlotItem[];
}

export interface ScheduleDateItem {
  date: string;
  day: string;
  assignedGuestNos: number[];
  circuitServiceZoom: boolean;
  sessions: ScheduleSessionItem[];
}

export interface GuestProfileItem {
  no: number;
  congregation: string;
  name: string;
  gender: string;
  birthYear: number;
}

export interface ScheduleSeedData {
  meta: {
    title: string;
    campaignPeriod: { from: string; to: string };
    sourceImage: string;
    lastUpdated: string;
    notes: string[];
  };
  guests?: GuestProfileItem[];
  dates: ScheduleDateItem[];
  globalNotes: {
    applyContact: string;
    meetingPlace: string;
    specialDuty: string[];
  };
}

export interface MyScheduleApplicationItem {
  date: string;
  day: string;
  sessionKey: ScheduleSessionKey;
  time: string;
  zone: string;
  slotNo: number;
  status: 'pending' | 'assigned';
  submittedAt: string;
}

export type ReportMinistryType = 'CIRCUIT' | 'SUBWAY';
export type ReportShift = 'AM' | 'PM' | '';
export type ServiceReportStatus = 'DRAFT' | 'SUBMITTED';

export interface ServiceReportItem {
  id: number;
  reporterId: string;
  reporterName: string;
  reportDate: string;
  status: ServiceReportStatus;
  ministryType: ReportMinistryType;
  revisitCount: number;
  contactExchangeCount: number;
  visitRequestCount: number;
  bibleStudyProposalCount: number;
  bibleStudyStartCount: number;
  subwayShift: ReportShift;
  subwayLocation: string;
  magazineCount: number;
  brochureCount: number;
  subwayVisitRequestCount: number;
  notes: string;
  experienceServiceType: string;
  experienceType: string;
  experienceContent: string;
  createdAt: string;
  updatedAt: string;
}
