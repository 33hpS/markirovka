import React from 'react';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Маркировочная система
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Система управления производством и маркировкой этикеток
        </p>
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Проект успешно развёрнут! 🎉
          </p>
          <div className="inline-flex space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              React 18
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              TypeScript
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              Vite
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
              Tailwind CSS
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;