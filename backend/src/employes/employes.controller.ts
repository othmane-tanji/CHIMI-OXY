import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EmployesService } from './employes.service';
import { CreateEmployeDto } from './dto/create-employe.dto';
import { UpdateEmployeDto } from './dto/update-employe.dto';

@Controller('employes')
@UseGuards(JwtAuthGuard)
export class EmployesController {
  constructor(private employesService: EmployesService) {}

  @Get()
  findAll(@Query('societe') societe?: string) {
    return this.employesService.findAll(societe);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.employesService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateEmployeDto) {
    return this.employesService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateEmployeDto) {
    return this.employesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.employesService.remove(id);
  }
}
