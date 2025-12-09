import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs('database', (): TypeOrmModuleOptions => {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'postgres',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'admin',
    password: process.env.DATABASE_PASSWORD || 'password123',
    database: process.env.DATABASE_NAME || 'telemetry',

    // Entities
    entities: [__dirname + '/..//*.entity{.ts,.js}'],

    // Migrations
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    migrationsRun: !isProduction, // Auto-run migrations in dev

    // Synchronize (ONLY for development!)
    synchronize: !isProduction,

    // Logging
    logging: !isProduction,

    // SSL (for production)
    ssl: isProduction ? { rejectUnauthorized: false } : false,

    // Connection pooling
    extra: {
      max: 20, // Maximum connections
      connectionTimeoutMillis: 5000,
    },
  };
});
