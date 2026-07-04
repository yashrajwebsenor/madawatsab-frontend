import {
  AttachmentStatus,
  AttachmentTypes,
  DietPreference,
  GalleryRequestStatus,
  HelpSupportStatus,
  InterestStatus,
  MessageTypes,
  PaymentTypes,
  PlanDurationTypes,
  ProfileFor,
  ReligiousFrequency,
  YesNo,
  YesNoSometimes,
} from "./enum";

export interface User {
  _id: string;
  mobile: string;
  email?: string;
  userType: string;
  isOnboardingCompleted: boolean;
  isPrivate: boolean;
  // Admin-granted trust marker. Renders a blue verified tick next to the
  // user's name across the web panel (discovery cards, profile detail).
  isVerified?: boolean;
  appLanguage: string;
  createdAt: string;
  annualIncome: string;
  community: string;
  dob: string;
  fullName: string;
  gender: string;
  height: number;
  isFamilyLivingWithUser: boolean;
  language: string;
  maritalStatus: string;
  maslak: string;
  profileFor: ProfileFor;
  qualification: string;
  sect: string;
  workSector: string;
  occupation: string;
  profilePhoto?: Photo;
  photos: Photo[];
  isEntryFeePaid: boolean;
  // Permanent app-access flag (paid entry fee OR entered while fee disabled).
  // The entry gate checks this, not isEntryFeePaid.
  hasAppAccess: boolean;
  spinReward: string;
  // Permanent spin-step-resolved flag (spun, or waived while disabled).
  // The spin gate checks this, not spinReward.
  spinResolved: boolean;
  // Rupee amount won from a partial-discount spin; subtracted from the entry
  // fee at checkout. Zero once spent or if the user won free entry outright.
  entryFeeDiscount: number;
  address: Address;
  family: Family | null;
  assignedAgent: string | null;
  userId: string;
  // Set by the backend when this user object is returned to another viewer:
  // true means the viewer should render the photo blurred.
  shouldBlur?: boolean;
  // True when this user has self-deleted their account. The backend masks the
  // record to a neutral stub ("Deleted User", no photo/PII); the UI renders a
  // placeholder and disables all interactions.
  isDeleted?: boolean;
  // User-initiated visibility pause. On the OWNER's profile this is the real
  // toggle state (drives the pause/resume UI). On another member's profile it
  // is only present (as a masked stub) via `isUnavailable` below — a connected
  // viewer still receives the full, unmasked profile.
  isPaused?: boolean;
  // Set by the backend when a PAUSED member's profile is opened by someone who
  // is NOT an existing connection: the record is masked to a neutral stub and
  // the detail page shows a "currently unavailable" screen.
  isUnavailable?: boolean;
  // Per-viewer flag: the current user has shortlisted this profile. Sent inline
  // by every profile/list endpoint so cards render their bookmark state without
  // a separate shortlist-ids request.
  isShortlisted?: boolean;
  contactViewBalance?: number;
  contactViewLifetime?: number;
  subscription: Subscription;

  // ---- Religious practice (optional, edited from My Profile) ----
  offerNamaz?: ReligiousFrequency;
  reciteQuran?: ReligiousFrequency;
  keepRoza?: YesNo;
  giveZakat?: ReligiousFrequency;
  performedHajjUmrah?: YesNo;
  wearHijab?: YesNoSometimes;

  // ---- Lifestyle & interests (optional, edited from My Profile) ----
  dietPreference?: DietPreference;
  languagesKnown?: string[];
  smoke?: YesNo;
  drink?: YesNo;
  cookFood?: YesNoSometimes;
  sports?: string[];
  hobbies?: string[];
  musics?: string[];
}

export interface SubscriptionCapabilities {
  canMessage: boolean;
  hasAdvancedFilters: boolean;
  canBlock: boolean;
  hasProfileBoost: boolean;
  hasRelationshipManager: boolean;
}

export interface Subscription {
  hasActivePlan: boolean;
  planName: string;
  planType: string | null;
  planDuration: string | null;
  expiryDate: string | null;
  capabilities: SubscriptionCapabilities;
  contactViewBalance: number;
  contactViewLifetime: number;
  // Remaining contact views (mirrors contactViewBalance) — kept for compatibility.
  viewCountRemaining: number;
}

// A downloadable billing record. Mirrors the shape the payments/invoices
// endpoints return (amount already converted to rupees server-side).
export interface Invoice {
  invoiceNumber: string | null;
  userId: string;
  userName: string | null;
  planName: string | null;
  paymentType: PaymentTypes;
  amount: number;
  currency: string;
  status: string;
  razorpayPaymentId: string | null;
  purchasedAt: string;
}

export interface Family {
  aboutFamily: string;
  familyType: string;
  fatherName: string;
  fatherOccupation: string;
  fatherContact: string;
  motherName: string;
  motherOccupation: string;
  motherContact: string;
}

export interface Address {
  countryId: number;
  stateId: number;
  cityId: number;
  pincode: number;
  countryName: string;
  stateName: string;
  cityName: string;
}

export interface Photo {
  _id: string;
  url: string;
  type?: AttachmentTypes;
  status?: AttachmentStatus;
}

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  data?: any;
  refetch?: () => void;
}

// One admin-configured spin-wheel outcome, as returned by GET /configs
// (parsed from the spinWheelSegments JSON string). No probability — odds
// aren't the client's business.
export interface SpinSegment {
  label: string;
  type: "discount" | "free_entry";
  amount: number;
  color?: string;
}

export interface Plan {
  _id: string;
  name: string;
  type: string;
  tagline: string;
  features: string[];
  hasAdvancedFilters: boolean;
  canMessage: boolean;
  canBlock: boolean;
  hasProfileBoost: boolean;
  hasRelationshipManager: boolean;
  pricing: {
    duration: PlanDurationTypes;
    originalPrice: number;
    discountedPrice: number;
    contactViewLimit: number;
    badgeText: string | null;
  };
}

export interface HelpSupport {
  description: string;
  type: string;
  user: string;
  status: HelpSupportStatus;
  adminResponse: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export type ProfileMatch = User & {
  cardType: "profile";
  isInterestSent: boolean;
  isInterestReceived: boolean;
  // True once an interest in either direction is accepted — the two are
  // connected and can message each other.
  isConnected?: boolean;
  // Pending interest ids — present only while the request is pending, so the
  // detail page can cancel (sent) or accept/decline (received).
  sentInterestId?: string | null;
  receivedInterestId?: string | null;
  // My gallery request to this (private) profile — null when never requested.
  galleryRequestStatus?: GalleryRequestStatus | null;
  // Directed: did the viewer block this profile? Drives the Unblock UI + blocked
  // banner. The reverse direction is never exposed.
  isBlockedByMe?: boolean;
};

export type Match = ProfileMatch | (Advertisement & { cardType: "ad" });

export interface Advertisement {
  _id: string;
  title: string;
  description: string;
  banner: Photo;
  cardType?: "ad";
  ctaUrl?: string;
  ctaText?: string;
  targetGenders?: string[];
  targetCityIds?: number[];
}

export interface Interest {
  _id: string;
  senderId: User;
  receiverId: User;
  status: InterestStatus;
}

// A contact-unlock record (`contact_views`). Only the side requested via the
// list `type` param comes back populated as a User; the other stays an id.
export interface ContactView {
  _id: string;
  viewerId: User;
  profileId: User;
  createdAt: string;
}

// A private bookmark (`shortlists`): the current user shortlisted `targetId`.
export interface Shortlist {
  _id: string;
  targetId: User;
  createdAt: string;
}

// A profile-page visit (`profile_visits`). Only the side requested via the
// list `type` param comes back populated as a User; the other stays an id.
export interface ProfileVisit {
  _id: string;
  visitorId: User;
  visitedId: User;
  createdAt: string;
}

// A gallery (photo-access) request row, already transformed by the backend:
// `profile` is the other side of the request.
export interface GalleryRequestItem {
  _id: string;
  status: GalleryRequestStatus;
  createdAt: string;
  updatedAt: string;
  profile: User;
}

// A row in the merged All-tab feed: one of several received-activity types,
// normalised by the backend so `profile` is always the other party.
export type ActivityFeedType =
  | "interest"
  | "profile_visit"
  | "gallery_request"
  | "contact_view";

export interface ActivityFeedItem {
  _id: string;
  type: ActivityFeedType;
  status?: InterestStatus | GalleryRequestStatus;
  createdAt: string;
  profile: User;
}

// Per-tab + total unread counts for the Activity badges.
export interface ActivityUnreadCounts {
  interest: number;
  profile_visits: number;
  gallery_requests: number;
  contact_views: number;
  total: number;
}

// ---- Notifications ----

export type NotificationCategory =
  | "interests"
  | "visits"
  | "gallery"
  | "system";

export type NotificationType =
  | "interest_received"
  | "interest_accepted"
  | "gallery_request_received"
  | "gallery_request_approved"
  | "profile_visit"
  | "new_message"
  | "system";

export interface AppNotification {
  _id: string;
  type: NotificationType;
  title: string;
  body: string;
  // Precomputed in-app deep link the row/toast/push navigate to ("" = none).
  route: string;
  isRead: boolean;
  createdAt: string;
  // Populated actor (avatar/name); null/absent for system notifications.
  actorId?: User | null;
  data?: Record<string, any>;
}

// Per-category + total unread counts for the bell + notification tabs.
export interface NotificationUnreadCounts {
  interests: number;
  visits: number;
  gallery: number;
  system: number;
  total: number;
}

export interface ConnectionProfileItem {
  _id: string;
  status: InterestStatus;
  createdAt: string;
  updatedAt: string;
  profile: User;
  cardType: "profile";
}

export type ConnectionFeedItem =
  | ConnectionProfileItem
  | (Advertisement & { cardType: "ad" });

export interface ChatRoom {
  _id: string;
  lastMessage?: Message | null;
  participants: ChatRoomParticipant[];
  unreadCount: number;
  // Backend-computed per viewer. `isBlockedByMe` => the viewer blocked the other
  // participant (drives the Unblock composer). `messagingDisabled` => a block
  // exists in either direction (the blocked side fails the send neutrally).
  isBlockedByMe?: boolean;
  messagingDisabled?: boolean;
}

export interface ChatRoomParticipant {
  _id: string;
  fullName: string;
  profilePhoto?: Photo;
  photos: Photo[];
  occupation: string;
  isPrivate?: boolean;
  // Backend-computed: blur this participant's avatar (no sub, or private target).
  shouldBlur?: boolean;
  // True when this participant self-deleted their account (masked stub).
  isDeleted?: boolean;
}

export interface Attachment {
  url: string;
  type: AttachmentTypes;
}

export interface Message {
  _id: string;
  roomId: string;
  senderId: string;
  type: MessageTypes;
  content: string;
  isRead: boolean;
  createdAt: string;
  attachment?: Attachment | null;
  // Tombstone flag set by "delete for everyone". When true the client renders a
  // neutral placeholder instead of the original content/attachment.
  isDeleted?: boolean;
  deletedAt?: string;
}
