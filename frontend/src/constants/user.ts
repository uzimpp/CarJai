interface User {
  id: number;
  email: string;
  username: string;
  name: string;
  created_at: string;
}

interface UserRoles {
  buyer: boolean;
  seller: boolean;
}

interface UserProfiles {
  buyerComplete: boolean;
  sellerComplete: boolean;
}

interface UserMeData {
  user: User;
  roles: UserRoles;
  profiles: UserProfiles;
}

interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    expires_at: string;
  };
  message?: string;
}

interface MeResponse {
  success: boolean;
  data: UserMeData;
}

interface AuthError {
  success: false;
  error: string;
  code: number;
}

interface Buyer {
  id: number;
  province: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
}

interface Seller {
  id: number;
  displayName: string;
  about: string | null;
  mapLink: string | null;
}

interface SellerContact {
  id: number;
  sellerId: number;
  contactType: string;
  value: string;
  label: string | null;
}

interface BuyerRequest {
  province?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
}

interface SellerRequest {
  displayName: string;
  about?: string | null;
  mapLink?: string | null;
  contacts: SellerContactRequest[];
}

interface SellerContactRequest {
  contactType: string;
  value: string;
  label?: string | null;
}

interface ProfileData {
  user: User;
  roles: UserRoles;
  profiles: UserProfiles;
  buyer?: Buyer;
  seller?: Seller;
  contacts?: SellerContact[];
}

interface ProfileResponse {
  success: boolean;
  data: ProfileData;
}

interface BuyerResponse {
  success: boolean;
  data: Buyer;
  message?: string;
}

interface SellerResponse {
  success: boolean;
  data: {
    seller: Seller;
    contacts: SellerContact[];
  };
  message?: string;
}

interface SigninRequest {
  email_or_username: string;
  password: string;
}

interface SignupRequest {
  email: string;
  password: string;
  username: string;
  name: string;
}

interface GoogleAuthRequest {
  credential: string;
  mode: "signin" | "signup";
}

interface GoogleAuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    expires_at: string;
  };
  message?: string;
}

export type {
  User,
  UserRoles,
  UserProfiles,
  UserMeData,
  AuthResponse,
  MeResponse,
  AuthError,
  SigninRequest,
  SignupRequest,
  GoogleAuthRequest,
  GoogleAuthResponse,
  Buyer,
  Seller,
  SellerContact,
  BuyerRequest,
  SellerRequest,
  SellerContactRequest,
  ProfileData,
  ProfileResponse,
  BuyerResponse,
  SellerResponse,
};
