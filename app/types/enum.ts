export enum ProfileFor {
  self = "self",
  son = "son",
  daughter = "daughter",
  brother = "brother",
  sister = "sister",
  relative = "relative",
  friend = "friend",
}

export enum Gender {
  male = "male",
  female = "female",
}

export enum MaritalStatus {
  never_married = "never_married",
  divorced = "divorced",
  widowed = "widowed",
  awaiting_divorce = "awaiting_divorce",
}

export enum Sects {
  sunni = "sunni",
  shia = "shia",
  other = "other",
}

export enum FamilyTypes {
  joint = "joint",
  single = "single",
  nuclear = "nuclear",
  blended = "blended",
  extended = "extended",
}

export enum PaymentTypes {
  entry_fee = "entry_fee",
  plan = "plan",
}

export enum PlanDurationTypes {
  quarterly = "quarterly",
  half_yearly = "half_yearly",
  unlimited = "unlimited",
}

export enum SupportType {
  payments = "payments",
  profile = "profile",
  account = "account",
  matches = "matches",
  chat = "chat",
  privacy = "privacy",
  technical = "technical",
  other = "other",
}

export enum HelpSupportStatus {
  pending = "pending",
  resolved = "resolved",
}

export enum InterestStatus {
  pending = "pending",
  accepted = "accepted",
  declined = "declined",
}

export enum GalleryRequestStatus {
  pending = "pending",
  accepted = "accepted",
  declined = "declined",
}

export enum AttachmentTypes {
  ad_video = "ad_video",
  ad_banner = "ad_banner",
  profile_picture = "profile_picture",
  profile_photo = "profile_photo",
  chat_image = "chat_image",
  chat_video = "chat_video",
  report_evidence = "report_evidence",
}

// Reasons a user can pick when reporting another user. Mirrors the backend
// ReportReason enum.
export enum ReportReason {
  fraud = "fraud",
  fake_profile = "fake_profile",
  wrong_photos = "wrong_photos",
  inappropriate_content = "inappropriate_content",
  harassment = "harassment",
  spam = "spam",
  other = "other",
}

export enum AttachmentStatus {
  pending = "pending",
  approved = "approved",
}

export enum MetadataTypes {
  qualification = "qualification",
  occupation = "occupation",
  annual_income = "annual_income",
  caste = "caste",
  employed_in = "employed_in",
}

export enum MessageTypes {
  text = "text",
  image = "image",
  video = "video",
}

// Practice frequency for religious habits (namaz, quran recitation, zakat).
export enum ReligiousFrequency {
  during_ramadan = "during_ramadan",
  regularly = "regularly",
  sometimes = "sometimes",
  never = "never",
}

// Simple yes/no answers (roza, hajj/umrah, smoke, drink).
export enum YesNo {
  yes = "yes",
  no = "no",
}

// Yes/no with a partial option (hijab, cooking).
export enum YesNoSometimes {
  yes = "yes",
  no = "no",
  sometimes = "sometimes",
}

export enum DietPreference {
  vegetarian = "vegetarian",
  non_vegetarian = "non_vegetarian",
}
