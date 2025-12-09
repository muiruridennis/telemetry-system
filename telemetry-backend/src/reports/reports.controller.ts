import { Controller, Get, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { RoleGuard } from '../auth/guards/role.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reports')
export class ReportsController {
    constructor(
        private readonly reportsService: ReportsService
    ) { }

    @Get()
  @UseGuards(JwtAuthGuard, RoleGuard)
    @Roles(Role.ADMIN, Role.REGULAR)
    async generatePdf(deviceId: string) {

        let result = this.reportsService.generatePdf(deviceId);
        return {
            message: 'Report generated successfully',
            result
        }
    }
    
}
