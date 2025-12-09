import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { join } from 'path';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'postgres',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'admin',
    password: process.env.DATABASE_PASSWORD || 'password123',
    database: process.env.DATABASE_NAME || 'telemetry',
    autoLoadEntities: true,

    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsRun: !isProduction,
    synchronize: true,
    logging: true,
    ssl: isProduction ? { rejectUnauthorized: false } : false,

    extra: {
      max: 20,
      connectionTimeoutMillis: 5000,
    },
  };
});
