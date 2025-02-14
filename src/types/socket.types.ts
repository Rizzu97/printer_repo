export enum WebSocketEvents {
  REGISTER = "register",
  RAISE_PRINTER = "raise-printer",
}

export interface RegisterPayload {
  circuitId: string;
  posIds: string[];
}

export interface RaisePrinterPayload {
  posId: string;
  circuitId: string;
  type: string;
  detail: any;
  timestamp: string;
}

export interface RegisterResponse {
  success?: boolean;
  error?: string;
}
