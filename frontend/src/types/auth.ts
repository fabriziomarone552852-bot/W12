export interface TokenResponse {
  access_token: string;
  token_type: string;
  refresh_token?: string;
}

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  max_subtask_depth_user?: number | null;
}