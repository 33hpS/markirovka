import * as React from 'react';
import { useState } from 'react';

interface DesignElement {
  id: string;
  type: 'text' | 'qr' | 'image' | 'barcode';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  color?: string;
}

const DesignerInteractive: React.FC = () => {
  const [elements, setElements] = useState<DesignElement[]>([
    {
      id: '1',
      type: 'text',
      content: 'Название продукта',
      x: 10,
      y: 10,
      width: 200,
      height: 30,
      fontSize: 16,
      color: '#000000',
    },
    {
      id: '2',
      type: 'qr',
      content: 'https://example.com/product/123',
      x: 220,
      y: 10,
      width: 80,
      height: 80,
    },
  ]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [canvasSize] = useState({ width: 320, height: 200 }); // 80x50mm at 4px/mm
  const [showAddMenu, setShowAddMenu] = useState(false);

  const addElement = (type: DesignElement['type']) => {
    const newElement: DesignElement = {
      id: Date.now().toString(),
      type,
      content:
        type === 'text'
          ? 'Новый текст'
          : type === 'qr'
            ? 'https://example.com'
            : type === 'barcode'
              ? '1234567890'
              : 'image.jpg',
      x: 50,
      y: 50,
      width: type === 'text' ? 120 : 60,
      height: type === 'text' ? 20 : 60,
      ...(type === 'text' && { fontSize: 12 }),
      color: '#000000',
    };
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
    setShowAddMenu(false);
  };

  const updateElement = (id: string, updates: Partial<DesignElement>) => {
    setElements(prev =>
      prev.map(el => (el.id === id ? { ...el, ...updates } : el))
    );
  };

  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedElement(null);
  };

  const selectedEl = elements.find(el => el.id === selectedElement);

  return (
    <div className='p-6 max-w-7xl mx-auto'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-3xl font-bold'>Дизайнер этикеток</h1>
        <div className='flex gap-3'>
          <button className='px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50'>
            Сохранить шаблон
          </button>
          <button className='px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-500'>
            Предпросмотр печати
          </button>
        </div>
      </div>

      <div className='grid lg:grid-cols-4 gap-6'>
        {/* Tools Panel */}
        <div className='lg:col-span-1'>
          <div className='bg-white rounded-lg shadow p-4 mb-4'>
            <h3 className='font-medium mb-3'>Инструменты</h3>
            <div className='space-y-2'>
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className='w-full px-3 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-500'
              >
                + Добавить элемент
              </button>
              {showAddMenu && (
                <div className='space-y-1'>
                  <button
                    onClick={() => addElement('text')}
                    className='w-full px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50'
                  >
                    📝 Текст
                  </button>
                  <button
                    onClick={() => addElement('qr')}
                    className='w-full px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50'
                  >
                    📱 QR-код
                  </button>
                  <button
                    onClick={() => addElement('barcode')}
                    className='w-full px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50'
                  >
                    📊 Штрих-код
                  </button>
                  <button
                    onClick={() => addElement('image')}
                    className='w-full px-3 py-2 text-sm border border-gray-200 rounded hover:bg-gray-50'
                  >
                    🖼️ Изображение
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Properties Panel */}
          {selectedEl && (
            <div className='bg-white rounded-lg shadow p-4'>
              <h3 className='font-medium mb-3'>Свойства</h3>
              <div className='space-y-3'>
                <div>
                  <label
                    htmlFor='content-input'
                    className='block text-sm font-medium text-gray-700 mb-1'
                  >
                    Содержимое
                  </label>
                  <input
                    id='content-input'
                    type='text'
                    value={selectedEl.content}
                    onChange={e =>
                      updateElement(selectedEl.id, { content: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                  />
                </div>

                {selectedEl.type === 'text' && (
                  <>
                    <div>
                      <label
                        htmlFor='font-size-input'
                        className='block text-sm font-medium text-gray-700 mb-1'
                      >
                        Размер шрифта
                      </label>
                      <input
                        id='font-size-input'
                        type='number'
                        value={selectedEl.fontSize ?? 12}
                        onChange={e =>
                          updateElement(selectedEl.id, {
                            fontSize: parseInt(e.target.value),
                          })
                        }
                        className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500'
                      />
                    </div>
                    <div>
                      <label
                        htmlFor='color-input'
                        className='block text-sm font-medium text-gray-700 mb-1'
                      >
                        Цвет
                      </label>
                      <input
                        id='color-input'
                        type='color'
                        value={selectedEl.color ?? '#000000'}
                        onChange={e =>
                          updateElement(selectedEl.id, {
                            color: e.target.value,
                          })
                        }
                        className='w-full h-10 border border-gray-300 rounded-md'
                      />
                    </div>
                  </>
                )}

                <div className='grid grid-cols-2 gap-2'>
                  <div>
                    <label
                      htmlFor='x-input'
                      className='block text-sm font-medium text-gray-700 mb-1'
                    >
                      X
                    </label>
                    <input
                      id='x-input'
                      type='number'
                      value={selectedEl.x}
                      onChange={e =>
                        updateElement(selectedEl.id, {
                          x: parseInt(e.target.value),
                        })
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm'
                    />
                  </div>
                  <div>
                    <label
                      htmlFor='y-input'
                      className='block text-sm font-medium text-gray-700 mb-1'
                    >
                      Y
                    </label>
                    <input
                      id='y-input'
                      type='number'
                      value={selectedEl.y}
                      onChange={e =>
                        updateElement(selectedEl.id, {
                          y: parseInt(e.target.value),
                        })
                      }
                      className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm'
                    />
                  </div>
                </div>

                <button
                  onClick={() => deleteElement(selectedEl.id)}
                  className='w-full px-3 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-500'
                >
                  Удалить элемент
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className='lg:col-span-2'>
          <div className='bg-white rounded-lg shadow p-6'>
            <div className='flex justify-between items-center mb-4'>
              <h3 className='font-medium'>Холст (80×50mm)</h3>
              <div className='text-sm text-gray-500'>Масштаб: 1:1</div>
            </div>

            <div className='border-2 border-dashed border-gray-300 p-4 bg-gray-50'>
              <div
                className='relative bg-white border shadow-sm mx-auto'
                style={{
                  width: `${canvasSize.width}px`,
                  height: `${canvasSize.height}px`,
                }}
                role='button'
                tabIndex={0}
                onClick={() => setSelectedElement(null)}
                onKeyDown={e => e.key === 'Escape' && setSelectedElement(null)}
              >
                {elements.map(element => (
                  <div
                    key={element.id}
                    className={`absolute border cursor-pointer transition ${
                      selectedElement === element.id
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-transparent hover:border-gray-400'
                    }`}
                    style={{
                      left: element.x,
                      top: element.y,
                      width: element.width,
                      height: element.height,
                      fontSize: element.fontSize,
                      color: element.color,
                    }}
                    role='button'
                    tabIndex={0}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedElement(element.id);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedElement(element.id);
                      }
                    }}
                  >
                    {element.type === 'text' && (
                      <span className='block truncate'>{element.content}</span>
                    )}
                    {element.type === 'qr' && (
                      <div className='w-full h-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-xs'>
                        QR
                      </div>
                    )}
                    {element.type === 'barcode' && (
                      <div className='w-full h-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-xs'>
                        |||||||
                      </div>
                    )}
                    {element.type === 'image' && (
                      <div className='w-full h-full bg-gray-200 border-2 border-dashed border-gray-400 flex items-center justify-center text-xs'>
                        🖼️
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Templates & Export */}
        <div className='lg:col-span-1'>
          <div className='bg-white rounded-lg shadow p-4 mb-4'>
            <h3 className='font-medium mb-3'>Быстрые шаблоны</h3>
            <div className='space-y-2'>
              <button className='w-full p-3 border border-gray-200 rounded-md hover:bg-gray-50 text-left'>
                <div className='text-sm font-medium'>Базовый продукт</div>
                <div className='text-xs text-gray-500'>Название + QR</div>
              </button>
              <button className='w-full p-3 border border-gray-200 rounded-md hover:bg-gray-50 text-left'>
                <div className='text-sm font-medium'>Молочный</div>
                <div className='text-xs text-gray-500'>Логотип + данные</div>
              </button>
              <button className='w-full p-3 border border-gray-200 rounded-md hover:bg-gray-50 text-left'>
                <div className='text-sm font-medium'>Хлебобулочный</div>
                <div className='text-xs text-gray-500'>Срок + штрих-код</div>
              </button>
            </div>
          </div>

          <div className='bg-white rounded-lg shadow p-4'>
            <h3 className='font-medium mb-3'>Экспорт</h3>
            <div className='space-y-2'>
              <button className='w-full px-3 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-500'>
                📄 Скачать PDF
              </button>
              <button className='w-full px-3 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-500'>
                🖨️ ZPL для принтера
              </button>
              <button className='w-full px-3 py-2 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-50'>
                💾 Сохранить как PNG
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesignerInteractive;
