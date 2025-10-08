import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LineOperator from '../LineOperator';

const {
  fetchProductsMock,
  fetchTemplatesMock,
  saveMock,
  addImageMock,
  addPageMock,
  setPropertiesMock,
  outputMock,
  html2canvasMock,
} = vi.hoisted(() => ({
  fetchProductsMock: vi.fn(),
  fetchTemplatesMock: vi.fn(),
  saveMock: vi.fn(),
  addImageMock: vi.fn(),
  addPageMock: vi.fn(),
  setPropertiesMock: vi.fn(),
  outputMock: vi.fn(),
  html2canvasMock: vi.fn(),
}));
let originalAlert: typeof window.alert;
let originalAnchorClick: HTMLAnchorElement['click'];
let anchorClickMock: ReturnType<typeof vi.fn>;
type CreateObjectURL = (obj: Blob | MediaSource) => string;
type RevokeObjectURL = (url: string) => void;
let createObjectURLSpy: ReturnType<typeof vi.fn>;
let revokeObjectURLSpy: ReturnType<typeof vi.fn>;
let originalCreateObjectURL: CreateObjectURL | undefined;
let originalRevokeObjectURL: RevokeObjectURL | undefined;

vi.mock('../../services/apiService', () => ({
  fetchProducts: fetchProductsMock,
  fetchTemplates: fetchTemplatesMock,
}));

vi.mock('jspdf', () => {
  const jsPDF = vi.fn().mockImplementation(() => ({
    addImage: addImageMock,
    addPage: addPageMock,
    setProperties: setPropertiesMock,
    output: outputMock,
    save: saveMock,
  }));

  return { jsPDF };
});

vi.mock('html2canvas', () => ({
  default: html2canvasMock,
}));

vi.mock('qrcode', () => ({
  toDataURL: vi.fn(() => Promise.resolve('data:image/png;base64,qr')),
}));

describe('LineOperator PDF generation', () => {
  beforeEach(() => {
    fetchProductsMock.mockResolvedValue([
      {
        id: 'product-1',
        name: 'Тестовое молоко',
        sku: 'MILK-001',
        categoryId: null,
        category: 'Молочные продукты',
        categoryCode: null,
        description: 'Натуральное молоко',
        price: 79.9,
        manufacturer: 'Ферма',
        weight: '1 л',
        status: 'active',
        stock: 10,
        minStock: 1,
        barcode: '4600000000012',
        qrData: 'https://example.com/MILK-001',
        unit: 'л',
        metadata: {},
      },
    ]);
    fetchTemplatesMock.mockResolvedValue([
      {
        id: 'template-1',
        name: 'Тестовый шаблон',
        category: 'Молочные продукты',
        description: 'Универсальный шаблон',
        thumbnail: '🏷️',
        elements: [],
        suitable: ['Молочные продукты', 'Универсальный'],
        version: '1.0.0',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ]);
    saveMock.mockClear();
    addImageMock.mockClear();
    addPageMock.mockClear();
    setPropertiesMock.mockClear();
    outputMock.mockReset();
    html2canvasMock.mockReset();

    const canvasStub = {
      toDataURL: vi.fn(() => 'data:image/png;base64,mock') as (
        type?: string
      ) => string,
    } as unknown as HTMLCanvasElement;

    html2canvasMock.mockResolvedValue(canvasStub);
    outputMock.mockImplementation(
      () => new Blob(['pdf'], { type: 'application/pdf' })
    );

    createObjectURLSpy = vi.fn(() => 'blob:mock-pdf');
    revokeObjectURLSpy = vi.fn();

    const urlGlobal = URL as unknown as {
      createObjectURL?: CreateObjectURL;
      revokeObjectURL?: RevokeObjectURL;
    };

    originalCreateObjectURL = urlGlobal.createObjectURL;
    originalRevokeObjectURL = urlGlobal.revokeObjectURL;

    urlGlobal.createObjectURL =
      createObjectURLSpy as unknown as CreateObjectURL;
    urlGlobal.revokeObjectURL =
      revokeObjectURLSpy as unknown as RevokeObjectURL;

    anchorClickMock = vi.fn();
    originalAnchorClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = anchorClickMock;
    originalAlert = window.alert;
    window.alert = vi.fn();
  });

  afterEach(() => {
    fetchProductsMock.mockReset();
    const urlGlobal = URL as unknown as {
      createObjectURL?: CreateObjectURL;
      revokeObjectURL?: RevokeObjectURL;
    };

    if (originalCreateObjectURL) {
      urlGlobal.createObjectURL = originalCreateObjectURL;
    } else {
      delete urlGlobal.createObjectURL;
    }

    if (originalRevokeObjectURL) {
      urlGlobal.revokeObjectURL = originalRevokeObjectURL;
    } else {
      delete urlGlobal.revokeObjectURL;
    }

    HTMLAnchorElement.prototype.click = originalAnchorClick;
    window.alert = originalAlert;
  });

  it('initiates PDF download when operator saves label as PDF', async () => {
    render(<LineOperator />);

    await waitFor(() => expect(fetchProductsMock).toHaveBeenCalled());

    const scanInput = screen.getByLabelText(/QR-код/i);
    fireEvent.change(scanInput, { target: { value: 'MILK-001' } });
    fireEvent.keyDown(scanInput, { key: 'Enter', code: 'Enter' });

    await screen.findByText(/Тестовое молоко/i);

    const printTypeSelect = screen.getByLabelText(/Тип печати/i);
    fireEvent.change(printTypeSelect, { target: { value: 'pdf' } });
    await waitFor(() => expect(printTypeSelect).toHaveValue('pdf'));

    const saveButton = await screen.findByRole('button', {
      name: /сохранить pdf/i,
    });
    expect(saveButton).not.toBeDisabled();
    fireEvent.click(saveButton);

    await waitFor(() => expect(addImageMock).toHaveBeenCalled());
    await waitFor(() => expect(outputMock).toHaveBeenCalledWith('blob'));
    await waitFor(() => expect(createObjectURLSpy).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(anchorClickMock).toHaveBeenCalledTimes(1));

    const downloadLink = await screen.findByRole('link', {
      name: /скачать последний pdf/i,
    });

    expect(downloadLink).toHaveAttribute('href', 'blob:mock-pdf');
    expect(saveMock).not.toHaveBeenCalled();
  });
});
