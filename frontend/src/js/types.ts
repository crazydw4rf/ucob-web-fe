export type ApiResponse<T = any> = {
  success: boolean;
  code: number;
  data: T;
};

export type ErrorResponse = ApiResponse<Error>;

export type Error = { message: string; kind: ErrorKind };

export const ErrorKind = {
  InternalServer: "InternalServer",
  NotFound: "NotFound",
  ResourceConflict: "ResourceConflict",
  ForeignKeyViolation: "ForeignKeyViolation",
  SessionExpired: "SessionExpired",
  TokenInvalid: "TokenInvalid",
  CredentialsInvalid: "CredentialsInvalid",
  BadRequest: "BadRequest",
} as const;

export type ErrorKind = (typeof ErrorKind)[keyof typeof ErrorKind];

export const TransactionStatus = {
  Accepted: "Accepted",
  Verified: "Verified",
  Rejected: "Rejected",
  Pending: "Pending",
} as const;

export const UserRole = {
  Admin: "Admin",
  User: "User",
} as const;
