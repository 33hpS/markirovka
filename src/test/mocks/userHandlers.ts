import { http, HttpResponse } from 'msw';

// Mock user endpoints
export const userHandlers = [
  http.get('/api/users/me', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'admin',
      },
    });
  }),

  http.get('/api/users', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'admin',
        },
        {
          id: '2',
          email: 'user@example.com',
          firstName: 'Regular',
          lastName: 'User',
          role: 'worker',
        },
      ],
    });
  }),
];