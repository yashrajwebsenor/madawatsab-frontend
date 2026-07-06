const routes = {
  home: "/",
  pricing: "/pricing",
  entryFee: "/entry-fee",
  spinReward: "/spin-reward",
  profile: "/my-profile",
  billing: "/billing",
  helpSupport: "/help-support",
  blockedUsers: "/blocked",
  search: "/search",
  requestAgent: "/request-agent",

  auth: {
    login: "/auth/login",
    verifyOtp: "/auth/verify-otp",
    referralCode: "/auth/referral-code",
  },
  onboarding: {
    step1: "/onboarding/steps/1",
    step2: "/onboarding/steps/2",
    step3: "/onboarding/steps/3",
    step4: "/onboarding/steps/4",
    step5: "/onboarding/steps/5",
    family: "/onboarding/family",
  },
  matches: {
    list: "/matches",
    details: (id: string) => `/matches/${id}`,
  },
  activity: "/activity",
  notifications: "/notifications",
  message: {
    index: "/message",
    chat: (id: string) => `/message/${id}`,
  },
};

export default routes;
