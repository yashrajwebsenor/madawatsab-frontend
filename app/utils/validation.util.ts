import dayjs from "dayjs";
import * as yup from "yup";

export const loginSchema = yup.object({
  mobile: yup
    .string()
    .required("Mobile number is required")
    .typeError("Mobile number is required")
    .length(10, "Mobile number must be 10 digits"),
});

export const otpSchema: any = yup.object({
  otp: yup
    .string()
    .required("OTP is required")
    .typeError("OTP is required")
    .length(6, "OTP must be 6 digits"),
});

export const onboardingStep2Schema: any = yup.object({
  fullName: yup
    .string()
    .trim()
    .required("Full name is required")
    .min(3, "Full name must be at least 3 characters")
    .max(30, "Full name must be at most 30 characters"),
  dob: yup
    .string()
    .required("Date of birth is required")
    .test("is-18", "You must be at least 18 years old", (value) => {
      if (!value) return false;
      const age = dayjs().diff(dayjs(value), "year");
      return age >= 18;
    }),
  height: yup.string().required("Height is required"),
  country: yup.string().required("Country is required"),
  state: yup.string().required("State is required"),
  city: yup.string().required("City is required"),
});

export const onboardingStep3Schema: any = yup.object({
  maritalStatus: yup.string().required("Marital status is required"),
  language: yup.string().required("Language is required"),
  sect: yup.string().required("Sect is required"),
  qualification: yup.string().required("Qualification is required"),
  workSector: yup.string().required("Work sector is required"),
  occupation: yup.string().required("Occupation is required"),
  annualIncome: yup.string().required("Annual income is required"),
});

export const familyDetailsSchema: any = yup.object({
  familyType: yup.string().trim().required("Family type is required"),
  fatherName: yup.string().trim().required("Father name is required"),
  fatherOccupation: yup
    .string()
    .trim()
    .required("Father occupation is required"),
  motherName: yup.string().trim().required("Mother name is required"),
  motherOccupation: yup
    .string()
    .trim()
    .required("Mother occupation is required"),
  country: yup.string().required("Country is required"),
  state: yup.string().required("State is required"),
  city: yup.string().required("City is required"),
});

export const personalDetailsSchema: any = yup.object({
  fullName: yup
    .string()
    .trim()
    .required("Full name is required")
    .min(3, "Full name must be at least 3 characters")
    .max(30, "Full name must be at most 30 characters"),
  dob: yup
    .string()
    .required("Date of birth is required")
    .test("is-18", "You must be at least 18 years old", (value) => {
      if (!value) return false;
      const age = dayjs().diff(dayjs(value), "year");
      return age >= 18;
    }),
  gender: yup.string().required("Gender is required"),
  country: yup.string().required("Country is required"),
  state: yup.string().required("State is required"),
  city: yup.string().required("City is required"),
  sect: yup.string().required("Sect is required"),
});

export const educationDetailsSchema: any = yup.object({
  qualification: yup.string().required("Qualification is required"),
  workSector: yup.string().required("Work sector is required"),
  occupation: yup.string().required("Occupation is required"),
  annualIncome: yup.string().required("Annual income is required"),
});

export const aboutFamilySchema: any = yup.object({
  familyType: yup.string().trim().required("Family type is required"),
  fatherName: yup.string().trim().required("Father name is required"),
  fatherOccupation: yup
    .string()
    .trim()
    .required("Father occupation is required"),
  motherName: yup.string().trim().required("Mother name is required"),
  motherOccupation: yup
    .string()
    .trim()
    .required("Mother occupation is required"),
});

export const helpSupportSchema: any = yup.object({
  description: yup.string().trim().required("Description is required"),
  type: yup.string().required("Support type is required"),
});

// All religious / lifestyle fields are optional — users fill what they want.
export const religiousDetailsSchema: any = yup.object({
  offerNamaz: yup.string().optional(),
  reciteQuran: yup.string().optional(),
  keepRoza: yup.string().optional(),
  giveZakat: yup.string().optional(),
  performedHajjUmrah: yup.string().optional(),
  wearHijab: yup.string().optional(),
});

export const lifestyleDetailsSchema: any = yup.object({
  dietPreference: yup.string().optional(),
  languagesKnown: yup.array().of(yup.string()).optional(),
  smoke: yup.string().optional(),
  drink: yup.string().optional(),
  cookFood: yup.string().optional(),
  sports: yup.array().of(yup.string()).optional(),
  hobbies: yup.array().of(yup.string()).optional(),
  musics: yup.array().of(yup.string()).optional(),
});
