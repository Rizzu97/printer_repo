export enum WebSocketEvents {
  REGISTER = "register",
  RAISE_PRINTER = "raise-printer",
}

export interface RegisterPayload {
  circuitId: string;
  posIds: string[];
}

export interface RegisterResponse {
  success?: boolean;
  error?: string;
}
