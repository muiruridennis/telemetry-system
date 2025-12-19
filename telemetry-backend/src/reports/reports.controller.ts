import { Controller, Get, Param, UseGuards, Res, Req, Query } from '@nestjs/common';
import { ReportService } from './reports.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthenticationGuard } from '../auth/guards/jwt-auth.guard';
import type  RequestWithUser from '../auth/interfaces/requestWithUser.interface';
import type { Response } from 'express';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportService: ReportService) {}

  // @Get()
  // @UseGuards(JwtAuthenticationGuard, RolesGuard)
  // @Roles(Role.ADMIN, Role.REGULAR)
  // async generatePdf(deviceId: string) {
  //   let result = this.reportService.generatePdf(deviceId);
  //   return {
  //     message: 'Report generated successfully',
  //     result,
  //   };
  // }

  // @Get('device/:deviceId/pdf')
  // @Roles(Role.ADMIN, Role.REGULAR)
  // async generateDevicePdf(
  //   @Param('deviceId') deviceId: string,
  //   @Query('startDate') startDateStr: string,
  //   @Query('endDate') endDateStr: string,
  //   @Res() res: Response,
  //   @Req() req: RequestWithUser,
  // ) {
  //   // Device-specific report - NO RULES
  //   const pdf = await this.reportService.generateDeviceReport(
  //     deviceId,
  //     new Date(startDateStr),
  //     new Date(endDateStr),
  //     req.user.id,
  //   );
  //   res.set({ 'Content-Type': 'application/pdf' });
  //   res.send(pdf);
  // }

  // @Get('rules/pdf')
  // @Roles(Role.ADMIN) // Only admin can see rules configuration
  // async generateRulesPdf(@Res() res: Response, @Req() req: RequestWithUser) {
  //   // Rules configuration report - SEPARATE endpoint
  //   const pdf = await this.reportService.generateRulesReport(req.user.id);
  //   res.set({ 'Content-Type': 'application/pdf' });
  //   res.send(pdf);
  // }

  // @Get('system/pdf')
  // @Roles(Role.ADMIN)
  // async generateSystemPdf(
  //   @Query('startDate') startDateStr: string,
  //   @Query('endDate') endDateStr: string,
  //   @Res() res: eResponse,
  //   @Req() req: RequestWithUser,
  // ) {
  //   // System-wide health report
  //   const pdf = await this.reportService.generateSystemReport(
  //     new Date(startDateStr),
  //     new Date(endDateStr),
  //     req.user.id,
  //   );
  //   res.set({ 'Content-Type': 'application/pdf' });
  //   res.send(pdf);
  // }
}
