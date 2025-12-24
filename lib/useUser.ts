import { RegistrationData, LoginData } from "@/validation/validator";
import { apiClient } from "@/lib/fetcher";

type RegistrationResponse = {
  success: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    accountType: string;
    isVerified: boolean;
    stripeCustomerId: string;
  };
};

type LoginResponse = {
  success: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    accountType: string;
    isVerified: boolean;
    stripeCustomerId: string;
  };
};

type SessionUser = {
  id: string;
  stripeCustomerId: string | null;
  accountType: string;
  firstName: string;
  middleName: string | null;
  lastName: string;
  email: string;
  phone: string;
  termsAccepted: boolean;
  newsletter: boolean;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export const useUser = () => {
  const register = async (payload: RegistrationData) => {
    return await apiClient.post<RegistrationResponse>('/auth/register', payload);
  };

  const login = async (payload: LoginData) => {
    return await apiClient.post<LoginResponse>('/auth/login', payload);
  };

  const getUser = async (): Promise<SessionUser | null> => {
    return await apiClient.get<SessionUser | null>('/auth/session');
  };

  return { register, login, getUser };
};