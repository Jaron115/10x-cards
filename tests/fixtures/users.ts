/**
 * Test fixtures for user data
 */

export const mockUsers = {
  default: {
    id: "1",
    email: "test@example.com",
    created_at: new Date().toISOString(),
  },
  admin: {
    id: "2",
    email: "admin@example.com",
    created_at: new Date().toISOString(),
  },
};

export const mockAuthResponse = {
  user: mockUsers.default,
  session: {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
    token_type: "bearer",
    user: mockUsers.default,
  },
};
