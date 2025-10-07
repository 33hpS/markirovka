// Автоматическая инициализация базы данных Supabase
// Запустите: node --env-file=.env.local scripts/init-supabase-db.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

async function initDatabase() {
  log.info('Инициализация базы данных Supabase...\n');

  const url = process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    log.error('Отсутствуют необходимые переменные окружения');
    log.warn('Убедитесь что VITE_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY установлены в .env.local');
    log.warn('');
    log.warn('SUPABASE_SERVICE_ROLE_KEY можно найти в Supabase Dashboard:');
    log.warn('Settings → API → service_role key (secret)');
    return false;
  }

  try {
    // Используем service_role key для выполнения SQL
    const supabase = createClient(url, serviceKey);

    log.info('Чтение SQL схемы из database/schema.sql...');
    const schemaPath = join(__dirname, '..', 'database', 'schema.sql');
    const schema = readFileSync(schemaPath, 'utf-8');

    log.info('Выполнение SQL скрипта...\n');

    // Разбиваем на отдельные SQL команды и выполняем
    // Supabase REST API не поддерживает выполнение raw SQL через JS клиент
    // Поэтому даем инструкции пользователю
    
    log.warn('⚠️  ВНИМАНИЕ: Автоматическое выполнение SQL не поддерживается через JS клиент');
    log.warn('');
    log.info('Пожалуйста, выполните следующие шаги вручную:');
    log.info('');
    log.info('1. Откройте Supabase Dashboard:');
    log.info(`   ${colors.blue}https://supabase.com/dashboard/project/wjclhytzewfcalyybhab/sql${colors.reset}`);
    log.info('');
    log.info('2. Нажмите "New Query"');
    log.info('');
    log.info('3. Скопируйте содержимое файла database/schema.sql');
    log.info('');
    log.info('4. Вставьте в SQL Editor и нажмите "Run" (F5)');
    log.info('');
    log.info('Или используйте Supabase CLI:');
    log.info(`   ${colors.blue}supabase db push --db-url "postgresql://postgres:[PASSWORD]@db.wjclhytzewfcalyybhab.supabase.co:5432/postgres"${colors.reset}`);
    log.info('');

    // Проверяем существование хотя бы одной таблицы
    log.info('Проверка существующих таблиц...');
    const { data: tables, error } = await supabase.rpc('get_tables', {}).select('*');
    
    if (error) {
      // Если функция не существует, пробуем запросить products напрямую
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('count')
        .limit(1);
      
      if (productsError) {
        if (productsError.message.includes('relation') || productsError.message.includes('does not exist')) {
          log.error('Таблицы не найдены в базе данных');
          log.warn('База данных требует инициализации - выполните схему вручную (см. инструкции выше)');
          return false;
        }
        throw productsError;
      }
      
      log.success('Таблица products найдена - база данных уже инициализирована!');
      return true;
    }

    if (tables && tables.length > 0) {
      log.success(`Найдено таблиц: ${tables.length}`);
      tables.forEach(table => log.info(`  - ${table.tablename}`));
      return true;
    }

    log.warn('Таблицы не найдены - требуется инициализация');
    return false;

  } catch (err) {
    log.error(`Ошибка: ${err.message}`);
    console.error(err);
    return false;
  }
}

async function main() {
  console.log('\n' + colors.blue + '='.repeat(60) + colors.reset);
  console.log(colors.blue + '  Инициализация базы данных Supabase' + colors.reset);
  console.log(colors.blue + '='.repeat(60) + colors.reset + '\n');

  const success = await initDatabase();

  console.log('\n' + colors.blue + '='.repeat(60) + colors.reset + '\n');

  if (success) {
    log.success('База данных готова к использованию!');
    log.info('');
    log.info('Следующий шаг: запустите приложение');
    log.info('  npm run dev');
    process.exit(0);
  } else {
    log.error('Требуется ручная инициализация базы данных');
    log.info('');
    log.info('См. QUICKSTART.md раздел "1️⃣ Инициализация базы данных Supabase"');
    process.exit(1);
  }
}

main().catch(err => {
  log.error(`Неожиданная ошибка: ${err.message}`);
  console.error(err);
  process.exit(1);
});
