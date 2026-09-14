import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LeadsService } from '../services/leads.service';
import { SubmitLeadDto } from '../dto/submit-lead.dto';

@ApiTags('Leads')
@Controller('lead')
export class LeadsController {
	constructor(private readonly leadsService: LeadsService) {}

	@Post('capture')
	@ApiOperation({
		summary: 'Capture a lead from guide/lead-magnet forms - creates or updates a user record and syncs to Beehiiv',
	})
	async captureLeadForm(@Body() dto: SubmitLeadDto) {
		return this.leadsService.captureLeadForm(dto);
	}
}
