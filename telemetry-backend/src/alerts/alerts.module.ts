import { Module } from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './entities/alert-rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Alert])],
  providers: [AlertsService],
  controllers: [AlertsController],
  exports:[AlertsService]
})
export class AlertsModule {}
