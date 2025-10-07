// Быстрая проверка подключения к Supabase и R2 API
// Запустите: node scripts/test-connections.mjs

import { createClient } from '@supabase/supabase-js';

// Цвета для консоли
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  info: (msg) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  warn: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`)
};

async function testSupabase() {
  log.info('Testing Supabase connection...');
  
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    log.error('Supabase credentials not found in environment');
    log.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    return false;
  }
  
  try {
    const supabase = createClient(url, key);
    
    // Попробуем получить версию PostgreSQL
    const { data, error } = await supabase.rpc('version').single();
    
    if (error) {
      // Если RPC не работает, попробуем просто проверить подключение
      const { error: pingError } = await supabase.from('_dummy_').select('*').limit(1);
      if (pingError && !pingError.message.includes('relation') && !pingError.message.includes('does not exist')) {
        throw pingError;
      }
    }
    
    log.success(`Supabase connected: ${url}`);
    if (data) log.info(`PostgreSQL version: ${data}`);
    return true;
  } catch (err) {
    log.error(`Supabase connection failed: ${err.message}`);
    return false;
  }
}

async function testR2Api() {
  log.info('Testing R2 Worker API...');
  
  const apiUrl = process.env.VITE_API_URL || 'https://markirovka.sherhan1988hp.workers.dev/api';
  
  try {
    // Тест загрузки маленького файла
    const testContent = 'Test file content: ' + new Date().toISOString();
    const testBlob = new Blob([testContent], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', testBlob, 'test.txt');
    formData.append('key', `test/${Date.now()}.txt`);
    
    const uploadRes = await fetch(`${apiUrl}/r2/upload`, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      throw new Error(`Upload failed (${uploadRes.status}): ${text}`);
    }
    
    const { success, key, url: fileUrl } = await uploadRes.json();
    
    if (!success) {
      throw new Error('Upload response indicates failure');
    }
    
    log.success(`File uploaded: ${key}`);
    
    // Проверим, что файл доступен
    const downloadRes = await fetch(fileUrl);
    if (!downloadRes.ok) {
      throw new Error(`Download failed (${downloadRes.status})`);
    }
    
    const downloaded = await downloadRes.text();
    if (downloaded !== testContent) {
      throw new Error('Downloaded content does not match uploaded');
    }
    
    log.success('File download verified');
    log.info(`R2 API working: ${apiUrl}`);
    return true;
  } catch (err) {
    log.error(`R2 API test failed: ${err.message}`);
    if (err.message.includes('R2 binding is not configured')) {
      log.warn('Make sure R2 bucket binding is enabled in wrangler.toml');
      log.warn('Run: npx wrangler r2 bucket create markirovka-storage');
    }
    return false;
  }
}

async function testWorkerHealth() {
  log.info('Testing Worker health...');
  
  const workerUrl = 'https://markirovka.sherhan1988hp.workers.dev';
  
  try {
    const healthRes = await fetch(`${workerUrl}/health`);
    if (!healthRes.ok) {
      throw new Error(`Health check failed (${healthRes.status})`);
    }
    
    const versionRes = await fetch(`${workerUrl}/version`);
    if (!versionRes.ok) {
      throw new Error(`Version check failed (${versionRes.status})`);
    }
    
    const version = await versionRes.json();
    log.success(`Worker is healthy`);
    log.info(`Version: ${version.version}, Commit: ${version.commit}`);
    return true;
  } catch (err) {
    log.error(`Worker health check failed: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('\n' + colors.blue + '='.repeat(50) + colors.reset);
  console.log(colors.blue + '  Connection Tests for Markirovka' + colors.reset);
  console.log(colors.blue + '='.repeat(50) + colors.reset + '\n');
  
  const results = {
    worker: await testWorkerHealth(),
    supabase: await testSupabase(),
    r2: await testR2Api()
  };
  
  console.log('\n' + colors.blue + '='.repeat(50) + colors.reset);
  console.log(colors.blue + '  Summary' + colors.reset);
  console.log(colors.blue + '='.repeat(50) + colors.reset + '\n');
  
  Object.entries(results).forEach(([name, passed]) => {
    const status = passed ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`;
    console.log(`  ${name.padEnd(20)} ${status}`);
  });
  
  const allPassed = Object.values(results).every(r => r);
  
  console.log('\n' + colors.blue + '='.repeat(50) + colors.reset + '\n');
  
  if (allPassed) {
    log.success('All tests passed! System is ready.');
    process.exit(0);
  } else {
    log.error('Some tests failed. Check configuration.');
    process.exit(1);
  }
}

main().catch(err => {
  log.error(`Unexpected error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
