import {
  AttachmentTypes,
  HelpSupportStatus,
  InterestStatus,
  MessageTypes,
  PlanDurationTypes,
  ProfileFor,
} from "./enum";

export interface User {
  _id: string;
  mobile: string;
  email?: string;
  userType: string;
  isOnboardingCompleted: boolean;
  isPrivate: boolean;
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
  photos: Photo[];
  isEntryFeePaid: boolean;
  spinReward: string;
  address: Address;
  family: Family | null;
  assignedAgent: string | null;
  userId: string;
  // Set by the backend when this user object is returned to another viewer:
  // true means the viewer should render the photo blurred.
  shouldBlur?: boolean;
  contactViewBalance?: number;
  contactViewLifetime?: number;
  subscription: Subscription;
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

export interface Family {
  aboutFamily: string;
  familyType: string;
  fatherName: string;
  fatherOccupation: string;
  motherName: string;
  motherOccupation: string;
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
}

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  data?: any;
  refetch?: () => void;
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
}

export interface ChatRoomParticipant {
  _id: string;
  fullName: string;
  photos: Photo[];
  occupation: string;
  isPrivate?: boolean;
  // Backend-computed: blur this participant's avatar (no sub, or private target).
  shouldBlur?: boolean;
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
}
