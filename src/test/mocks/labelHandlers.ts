import { http, HttpResponse } from 'msw';

// Mock label endpoints
export const labelHandlers = [
  http.get('/api/labels', () => {
    return HttpResponse.json({
      success: true,
      data: [
        {
          id: '1',
          name: 'Product Label',
          description: 'Standard product label',
          qrCode: 'test-qr-code',
          category: 'product',
          dimensions: { width: 100, height: 50 },
          elements: [],
        },
      ],
    });
  }),

  http.post('/api/labels', () => {
    return HttpResponse.json({
      success: true,
      data: {
        id: '2',
        name: 'New Label',
        description: 'Newly created label',
        qrCode: 'new-qr-code',
        category: 'product',
        dimensions: { width: 100, height: 50 },
        elements: [],
      },
    });
  }),
];