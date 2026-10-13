export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone: string;
}

export interface JwtResponse {
  token?: string;
  accessToken?: string;
  refreshToken: string;
  user: UserDto;
}

export interface UserDto {
  id: number;
  name: string;
  email: string;
  phone: string;
  roles: RoleDto[];
}

export interface RoleDto {
  id: string;
  name: string;
}
