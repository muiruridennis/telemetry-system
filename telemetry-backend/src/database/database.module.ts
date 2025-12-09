import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import databaseConfig from '../config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [databaseConfig],
      isGlobal: true, // makes ConfigService globally available
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService], // ✅ inject ConfigService, not ConfigModule
      useFactory: (configService: ConfigService) => ({
        ...configService.get('database'), // database config from your file
      }),
    }),
  ],
})
export class DatabaseModule {}
