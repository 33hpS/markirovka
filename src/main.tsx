import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './layout/Layout';
import ProtectedRoute from './routes/ProtectedRoute';

// Lazy loaded pages for code-splitting
const App = React.lazy(() => import('./App'));
const Docs = React.lazy(() => import('./pages/Docs'));
const Production = React.lazy(() => import('./pages/Production'));
const Designer = React.lazy(() => import('./pages/Designer'));
const DesignerEditor = React.lazy(() => import('./pages/DesignerEditor'));
const Reports = React.lazy(() => import('./pages/Reports'));
const Users = React.lazy(() => import('./pages/Users'));
const Printing = React.lazy(() => import('./pages/Printing'));
const Labels = React.lazy(() => import('./pages/Labels'));
const Products = React.lazy(() => import('./pages/Products'));
const LineOperator = React.lazy(() => import('./pages/LineOperator'));
const Login = React.lazy(() => import('./pages/Login'));
const SystemStatus = React.lazy(() => import('./pages/SystemStatus'));
import './index.css';

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <BrowserRouter>
          <AuthProvider>
            <React.Suspense
              fallback={
                <div className='p-6 text-sm text-gray-500'>Загрузка...</div>
              }
            >
              <Routes>
                <Route path='/' element={<Navigate to='/login' replace />} />
                <Route path='/login' element={<Login />} />
                <Route element={<Layout />}>
                  <Route path='/home' element={<App />} />
                  <Route path='/docs' element={<Docs />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path='/production' element={<Production />} />
                    <Route path='/users' element={<Users />} />
                  </Route>
                  <Route path='/designer' element={<Designer />} />
                  <Route path='/designer/editor' element={<DesignerEditor />} />
                  <Route path='/labels' element={<Labels />} />
                  <Route path='/products' element={<Products />} />
                  <Route path='/line-operator' element={<LineOperator />} />
                  <Route path='/printing' element={<Printing />} />
                  <Route path='/reports' element={<Reports />} />
                  <Route path='/system-status' element={<SystemStatus />} />
                  <Route path='*' element={<Navigate to='/home' replace />} />
                </Route>
              </Routes>
            </React.Suspense>
          </AuthProvider>
        </BrowserRouter>
      </LanguageProvider>
    </ThemeProvider>
  </React.StrictMode>
);
