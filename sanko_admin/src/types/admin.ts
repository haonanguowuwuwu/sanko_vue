export const ADMIN_TOKEN_KEY = 'sanko_admin_token'
export const ADMIN_PROFILE_KEY = 'sanko_admin_profile'

export interface AdminProfile {
  id: string
  username: string
  email: string
  role: string
  lastLoginAt: string
}

export interface AdminLoginResult {
  token: string
  profile: AdminProfile
}
