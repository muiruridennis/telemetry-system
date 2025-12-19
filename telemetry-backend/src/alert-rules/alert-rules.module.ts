import { Module } from '@nestjs/common';
import { AlertRulesService } from './alert-rules.service';
import { AlertRulesController } from './alert-rules.controller';
import { AlertsModule } from '../alerts/alerts.module';
import { AlertRule } from './entities/alert-rule.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports : [TypeOrmModule.forFeature([AlertRule]),AlertsModule],
  providers: [AlertRulesService],
  exports: [AlertRulesService],
  controllers: [AlertRulesController]
})
export class AlertRulesModule {}
