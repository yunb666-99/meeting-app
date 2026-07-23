export interface User {
  id: string;
  account: string;
  nickname: string;
  role: string;
  status: number;
  lastLogin: string;
  createdAt: string;
}

export interface Admin {
  id: string;
  account: string;
  nickname: string;
  role: string;
  status: number;
  createdAt: string;
}
