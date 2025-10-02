import * as React from 'react';
import { Link } from 'react-router-dom';

import Badge from './components/ui/Badge';

const Docs: React.FC = () => {
  return (
    <div className='min-h-screen bg-white px-6 py-12 max-w-3xl mx-auto prose prose-sm'>
      <h1>Документация (WIP)</h1>
      <p>
        Раздел документации находится в процессе наполнения. Ниже планируемые
        подразделы и статус.
      </p>
      <ul>
        <li>
          <Badge color='indigo'>WIP</Badge> Архитектура модулей
        </li>
        <li>
          <Badge color='indigo'>WIP</Badge> API взаимодействие
        </li>
        <li>
          <Badge color='indigo'>WIP</Badge> Типы и схемы данных
        </li>
        <li>
          <Badge color='indigo'>WIP</Badge> Печать и профили принтеров
        </li>
        <li>
          <Badge color='indigo'>WIP</Badge> Pipeline деплоя
        </li>
      </ul>
      <p>
        Полный набор документации появится после стабилизации основных модулей.
      </p>
      <p>
        <Link to='/' className='text-indigo-600 hover:underline'>
          ← На главную
        </Link>
      </p>
    </div>
  );
};

export default Docs;
