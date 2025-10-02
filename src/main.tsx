import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './layout/Layout';
import ProtectedRoute from './routes/ProtectedRoute';

// Lazy loaded pages for code-splitting
const App = React.lazy(() => import('./App'));
const Docs = React.lazy(() => import('./Docs'));
const Production = React.lazy(() => import('./pages/Production'));
const Designer = React.lazy(() => import('./pages/Designer'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Users = React.lazy(() => import('./pages/Users'));
const Printing = React.lazy(() => import('./pages/Printing'));
const Labels = React.lazy(() => import('./pages/Labels'));
const Login = React.lazy(() => import('./pages/Login'));
import './index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <React.Suspense
        fallback={<div className='p-6 text-sm text-gray-500'>Загрузка...</div>}
      >
        <Routes>
          <Route element={<Layout />}>
            <Route path='/' element={<App />} />
            <Route path='/docs' element={<Docs />} />
            <Route element={<ProtectedRoute />}>
              <Route path='/production' element={<Production />} />
              <Route path='/users' element={<Users />} />
            </Route>
            <Route path='/designer' element={<Designer />} />
            <Route path='/labels' element={<Labels />} />
            <Route path='/printing' element={<Printing />} />
            <Route path='/reports' element={<Reports />} />
            <Route path='/login' element={<Login />} />
            <Route path='*' element={<Navigate to='/' replace />} />
          </Route>
        </Routes>
      </React.Suspense>
    </BrowserRouter>
  </React.StrictMode>
);
