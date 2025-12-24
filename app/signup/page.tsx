"use client";
import  { useState } from "react";
import Step1 from "@/components/SignUp/Step1";
import Step2 from "@/components/SignUp/Step2";
import Step3 from "@/components/SignUp/Step3";
import Step4 from "@/components/SignUp/Step4";
import Step5 from "@/components/SignUp/Step5";
import { useRouter } from "next/navigation";
import toast, { Toaster } from "react-hot-toast";
import PaymentWrapper from "@/components/PaymentWrapper/paymentWrapper";
import { useUser } from "@/lib/useUser";
import { apiClient } from "@/lib/fetcher";

type FormDataType = {
  accountType: "Bidding" | "Seller";
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  phoneCode: string;
  phone: string;
  password: string;
  confirmPassword: string;
  termsAccepted: boolean;
  newsletter: boolean;
  billingCountry: string;
  billingAddressLine1: string;
  billingAddressLine2: string;
  billingCity: string;
  billingPostcode: string;
  shippingSameAsBilling: boolean;
  shippingCountry: string;
  shippingAddressLine1: string;
  shippingAddressLine2: string;
  shippingCity: string;
  shippingPostcode: string;
  cardHolderName: string;
};


export default function Page() {
  const router = useRouter();
  const { register } = useUser();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormDataType>({
    accountType: "Bidding",
    firstName: "",
    middleName: "",
    lastName: "",
    email: "",
    phoneCode: "+44",
    phone: "",
    password: "",
    confirmPassword: "",
    termsAccepted: false,
    newsletter: false,
    billingCountry: "",
    billingAddressLine1: "",
    billingAddressLine2: "",
    billingCity: "",
    billingPostcode: "",
    shippingSameAsBilling: true,
    shippingCountry: "",
    shippingAddressLine1: "",
    shippingAddressLine2: "",
    shippingCity: "",
    shippingPostcode: "",
    cardHolderName: "",
  });

  const callingCodes = [
    "+44",
    "+49",
    "+33",
    "+39",
    "+34",
    "+1",
    "+52",
    "+86",
    "+81",
    "+91",
    "+880",
    "+82",
    "+62",
  ];

  const totalSteps = 5;
  const steps = [
    { number: 1, title: "1" },
    { number: 2, title: "2" },
    { number: 3, title: "3" },
    { number: 4, title: "4" },
    { number: 5, title: "Final" },
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    switch (step) {
      case 1:
        if (!formData.accountType)
          newErrors.accountType = "Please select an account type";
        break;
      case 2:
        if (!formData.firstName) newErrors.firstName = "First name is required";
        if (!formData.lastName) newErrors.lastName = "Last name is required";
        if (!formData.email) newErrors.email = "Email is required";
        else if (!/\S+@\S+\.\S+/.test(formData.email))
          newErrors.email = "Invalid email format";
        if (!formData.phone) newErrors.phone = "Phone number is required";
        if (!formData.password) newErrors.password = "Password is required";
        else if (formData.password.length < 8)
          newErrors.password = "Password must be at least 8 characters";
        else if (
          !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(
            formData.password
          )
        ) {
          newErrors.password =
            "Password must include upper, lower, number, and special character";
        }
        if (formData.password !== formData.confirmPassword)
          newErrors.confirmPassword = "Passwords do not match";
        if (!formData.termsAccepted)
          newErrors.termsAccepted = "You must accept the terms and conditions";
        break;
      case 3:
        if (!formData.billingCountry)
          newErrors.billingCountry = "Country is required";
        if (!formData.billingAddressLine1)
          newErrors.billingAddressLine1 = "Address Line 1 is required";
        if (!formData.billingCity) newErrors.billingCity = "City is required";
        if (!formData.billingPostcode)
          newErrors.billingPostcode = "Postcode is required";
        break;
      case 4:
        if (!formData.shippingSameAsBilling) {
          if (!formData.shippingCountry)
            newErrors.shippingCountry = "Shipping country is required";
          if (!formData.shippingAddressLine1)
            newErrors.shippingAddressLine1 =
              "Shipping address Line 1 is required";
          if (!formData.shippingCity)
            newErrors.shippingCity = "Shipping city is required";
          if (!formData.shippingPostcode)
            newErrors.shippingPostcode = "Shipping postcode is required";
        }
        break;
      case 5:
        if (!formData.cardHolderName)
          newErrors.cardHolderName = "Card holder name is required";
        break;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = async () => {
    if (validateStep(currentStep)) {
      // If moving to step 5, trigger registration and setup intent
      if (currentStep === 4) {
        setLoading(true);
        try {
          // Step 4: Registration
          const registrationPayload = {
            accountType: formData.accountType,
            firstName: formData.firstName,
            middleName: formData.middleName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phoneCode + formData.phone,
            password: formData.password,
            termsAccepted: formData.termsAccepted,
            newsletter: formData.newsletter,
            billing: {
              country: formData.billingCountry,
              address1: formData.billingAddressLine1,
              address2: formData.billingAddressLine2,
              city: formData.billingCity,
              postcode: formData.billingPostcode,
            },
            shipping: formData.shippingSameAsBilling
              ? { sameAsBilling: true }
              : {
                  country: formData.shippingCountry,
                  address1: formData.shippingAddressLine1,
                  address2: formData.shippingAddressLine2,
                  city: formData.shippingCity,
                  postcode: formData.shippingPostcode,
                },
          };

          const regResponse = await register(registrationPayload);
          const { user } = regResponse;
          const { id: userId, stripeCustomerId: customerId } = user;
          setCustomerId(customerId);
          setUserId(userId);

          // Step 5: Setup Stripe Intent
          const intentResponse = await apiClient.post<{ clientSecret: string }>(
            '/stripe/setup-intent',
            { customerId }
          );
          console.log("Setup intent response:", intentResponse);
          const { clientSecret } = intentResponse;
          console.log("Extracted clientSecret:", clientSecret);
          setClientSecret(clientSecret);
        } catch (error) {
          console.error("Registration error:", error);
          if (error instanceof Error) {
            toast.error(error.message);
          } else {
            toast.error("Registration failed");
          }
          setLoading(false);
          return; // Don't proceed to next step
        } finally {
          setLoading(false);
        }
      }
      setCurrentStep((s) => Math.min(s + 1, totalSteps));
    }
  };
  const prevStep = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const StepIndicator = () => (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => (
        <div key={step.number} className="flex items-center flex-1">
          <div className="flex flex-col items-center">
            <div
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2
                ${
                  currentStep > step.number
                    ? "bg-purple-600 text-white border-purple-600"
                    : currentStep === step.number
                    ? "bg-white text-purple-600 border-purple-600"
                    : "bg-gray-200 text-gray-500 border-gray-200"
                }`}
            >
              {step.title}
            </div>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-2 ${
                currentStep > step.number ? "bg-purple-600" : "bg-gray-200"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // 🟣 CHANGED: wrap Step5 inside PaymentWrapper for Stripe
  const stepContents = [
    <Step1
      key="s1"
      formData={formData}
      handleInputChange={handleInputChange}
      errors={errors}
    />,
    <Step2
      key="s2"
      formData={formData}
      handleInputChange={handleInputChange}
      callingCodes={callingCodes}
      errors={errors}
    />,
    <Step3
      key="s3"
      formData={formData}
      handleInputChange={handleInputChange}
      errors={errors}
    />,
    <Step4
      key="s4"
      formData={formData}
      handleInputChange={handleInputChange}
      errors={errors}
    />,
    <PaymentWrapper key="s5" clientSecret={clientSecret}>
      <Step5
        onSubmit={() => router.push("/login")}
        loading={loading}
        customerId={customerId}
        userId={userId}
        clientSecret={clientSecret}
      />
    </PaymentWrapper>,
  ];
  // handleSubmit is now handled in nextStep when moving to step 5
  return (
    <div className="min-h-screen grid grid-cols-[965px_1fr]">
      <div className="bg-[#F2F0E9] flex flex-col items-center justify-center text-[#0E0E0E]">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            Create an account
          </h1>
          <p className="text-gray-600 mt-2">
            Create an account simply 5 easier steps
          </p>
        </div>

        <div className="max-w-170.5 mx-auto bg-white rounded-xl shadow-lg p-10">
          <StepIndicator />

          <div className="mb-8">{stepContents[currentStep - 1]}</div>

          <div className="flex justify-between">
            <div className="w-full">
              {currentStep < totalSteps && (
                <button
                  onClick={nextStep}
                  className="w-full px-6 py-2 bg-linear-to-br from-[#E95AFF] to-[#9F13FB] text-white rounded-full disabled:opacity-50"
                  disabled={loading}
                >
                  Save and Continue
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      <div
        style={{
          backgroundImage: "url('/image 67.png')",
          backgroundPosition: "center",
          backgroundSize: "cover",
          backgroundRepeat: "no-repeat",
        }}
      />
      <Toaster />
    </div>
  );
}
