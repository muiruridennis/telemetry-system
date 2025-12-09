import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import  databaseConfig  from '../config/database.config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
    imports : [
        ConfigModule.forRoot({
            load: [databaseConfig],
            isGlobal:true
            
            
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigModule],
            useFactory: (configService: ConfigService) => ({ ...configService.get('database') }),
        })
    ],
})
export class DatabaseModule {}
