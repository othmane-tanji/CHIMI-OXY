import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFournisseurDto } from './dto/create-fournisseur.dto';
import { UpdateFournisseurDto } from './dto/update-fournisseur.dto';

@Injectable()
export class FournisseursService {
  constructor(private prisma: PrismaService) {}

  findAll(societe?: string) {
    return this.prisma.fournisseur.findMany({
      where: societe ? { societe: societe as any } : undefined,
      orderBy: { nomFournisseur: 'asc' },
    });
  }

  async findOne(id: number) {
    const fournisseur = await this.prisma.fournisseur.findUnique({ where: { id } });
    if (!fournisseur) throw new NotFoundException('Fournisseur non trouvé');
    return fournisseur;
  }

  create(dto: CreateFournisseurDto) {
    return this.prisma.fournisseur.create({ data: dto });
  }

  async update(id: number, dto: UpdateFournisseurDto) {
    await this.findOne(id);
    return this.prisma.fournisseur.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    return this.prisma.fournisseur.delete({ where: { id } });
  }
}
