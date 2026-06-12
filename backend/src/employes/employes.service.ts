import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEmployeDto } from './dto/create-employe.dto';
import { UpdateEmployeDto } from './dto/update-employe.dto';

@Injectable()
export class EmployesService {
  constructor(private prisma: PrismaService) {}

  findAll(societe?: string) {
    return this.prisma.employe.findMany({
      where: societe ? { societe: societe as any } : undefined,
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: number) {
    const employe = await this.prisma.employe.findUnique({ where: { id } });
    if (!employe) throw new NotFoundException('Employé non trouvé');
    return employe;
  }

  create(dto: CreateEmployeDto) {
    return this.prisma.employe.create({
      data: {
        ...dto,
        dateNaissance: dto.dateNaissance ? new Date(dto.dateNaissance) : undefined,
        dateEmbauche: new Date(dto.dateEmbauche),
      },
    });
  }

  async update(id: number, dto: UpdateEmployeDto) {
    await this.findOne(id);
    return this.prisma.employe.update({
      where: { id },
      data: {
        ...dto,
        dateNaissance: dto.dateNaissance ? new Date(dto.dateNaissance) : undefined,
        dateEmbauche: dto.dateEmbauche ? new Date(dto.dateEmbauche) : undefined,
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.employe.delete({ where: { id } });
  }
}
