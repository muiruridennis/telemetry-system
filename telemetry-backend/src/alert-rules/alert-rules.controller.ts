import { Controller, Delete } from '@nestjs/common';
import { Post, Body, Get, Param } from '@nestjs/common';
import { Roles } from './../auth/decorators/roles.decorator';
import { AlertRulesService } from './alert-rules.service';
import { Role } from '../auth/enums/role.enum';
import { CreateAlertRuleDto } from './dto/create-alert-rule.dto';


@Controller('alert-rules')
export class AlertRulesController {
  constructor(private readonly alertRulesService: AlertRulesService) {}

  @Post()
  @Roles(Role.ADMIN)
  async create(@Body() createRuleDto: CreateAlertRuleDto) {
    return  await this.alertRulesService.create(createRuleDto);
  }

  @Get()
  findAll() {
    return this.alertRulesService.findAll();
  }

  @Post(':id/test')
  testRule(@Param('id') id: string, @Body() testData: any) {
    return this.alertRulesService.testRule(id, testData);
  }
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.alertRulesService.remove(id);
  }
}
