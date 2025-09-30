import { http, HttpResponse } from 'msw';

// Mock authentication endpoints
export const authHandlers = [
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      success: true,
      data: {
        token: 'mock-jwt-token',
        user: {
          id: '1',
          email: 'test@example.com',
          role: 'admin',
        },
      },
    });
  }),

  http.post('/api/auth/refresh', () => {
    return HttpResponse.json({
      success: true,
      data: {
        token: 'mock-refreshed-jwt-token',
      },
    });
  }),

  http.post('/api/auth/logout', () => {
    return HttpResponse.json({
      success: true,
    });
  }),
];