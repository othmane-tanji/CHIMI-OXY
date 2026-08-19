import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDevisDto } from './dto/create-devis.dto';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

@Injectable()
export class DevisService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDevisDto) {
    const dateDevis = dto.dateDevis ? new Date(dto.dateDevis) : new Date();
    const numeroDevis = `CH-${dto.numeroDevisMiddle}-26`;

    // 1. Calculate totals
    let totalHt = 0;
    const linesData = dto.lignes.map((l) => {
      const quantiteKg = Number(l.nbSeaux) * Number(l.qtySeauKg);
      const montantHt = quantiteKg * Number(l.prixUnitaire);
      totalHt += montantHt;
      return {
        designation: l.designation,
        nbSeaux: l.nbSeaux,
        qtySeauKg: l.qtySeauKg,
        quantiteKg,
        prixUnitaire: l.prixUnitaire,
        montantHt,
      };
    });

    const totalTva = totalHt * 0.20; // 20% TVA
    const totalTtc = totalHt + totalTva;

    // 2. Save Devis in DB first
    const devis = await this.prisma.devis.create({
      data: {
        numeroDevis,
        numeroDevisMiddle: dto.numeroDevisMiddle,
        dateDevis,
        objet: dto.objet,
        clientNom: dto.clientNom,
        totalHt,
        totalTva,
        totalTtc,
        lignes: {
          create: linesData.map((l, idx) => ({
            designation: l.designation,
            nbSeaux: l.nbSeaux,
            qtySeauKg: l.qtySeauKg,
            quantiteKg: l.quantiteKg,
            prixUnitaire: l.prixUnitaire,
            montantHt: l.montantHt,
            ordre: idx,
          })),
        },
      },
      include: {
        lignes: true,
      },
    });

    // 3. Prepare directory
    const uploadsDir = path.join(process.cwd(), 'uploads', 'devis');
    fs.mkdirSync(uploadsDir, { recursive: true });

    // 4. Create temp JSON file for Python generator script
    const tempJsonFilename = `temp_${devis.id}.json`;
    const tempJsonPath = path.join(uploadsDir, tempJsonFilename);
    
    const pyPayload = {
      numeroDevisMiddle: devis.numeroDevisMiddle,
      clientNom: devis.clientNom,
      dateDevis: devis.dateDevis.toISOString().split('T')[0],
      objet: devis.objet,
      lignes: devis.lignes.map((l) => ({
        designation: l.designation,
        nbSeaux: Number(l.nbSeaux),
        qtySeauKg: Number(l.qtySeauKg),
        prixUnitaire: Number(l.prixUnitaire),
      })),
    };

    fs.writeFileSync(tempJsonPath, JSON.stringify(pyPayload, null, 2), 'utf-8');

    // 5. Run Python DOCX generator
    const docxFilename = `Devis_CH-${devis.numeroDevisMiddle}-26_${devis.id}.docx`;
    const docxOutputPath = path.join(uploadsDir, docxFilename);
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate-devis-docx.py');
    const command = `python "${scriptPath}" "${tempJsonPath}" "${docxOutputPath}"`;

    try {
      await execAsync(command);
      
      // Clean up temp JSON
      if (fs.existsSync(tempJsonPath)) {
        fs.unlinkSync(tempJsonPath);
      }

      // Update docxPath in DB
      const dbDocxPath = `/uploads/devis/${docxFilename}`;
      const updatedDevis = await this.prisma.devis.update({
        where: { id: devis.id },
        data: { docxPath: dbDocxPath },
        include: { lignes: true },
      });

      return updatedDevis;
    } catch (err) {
      console.error('Error executing python docx generator:', err);
      // Clean up temp JSON if it exists
      if (fs.existsSync(tempJsonPath)) {
        fs.unlinkSync(tempJsonPath);
      }
      // Delete DB entry
      await this.prisma.devis.delete({ where: { id: devis.id } });
      throw new Error(`Erreur lors de la génération du document Word: ${err.message}`);
    }
  }

  async update(id: number, dto: CreateDevisDto) {
    const devisExistant = await this.findOne(id);
    const dateDevis = dto.dateDevis ? new Date(dto.dateDevis) : devisExistant.dateDevis;
    const numeroDevis = `CH-${dto.numeroDevisMiddle}-26`;

    // 1. Calculate totals
    let totalHt = 0;
    const linesData = dto.lignes.map((l) => {
      const quantiteKg = Number(l.nbSeaux) * Number(l.qtySeauKg);
      const montantHt = quantiteKg * Number(l.prixUnitaire);
      totalHt += montantHt;
      return {
        designation: l.designation,
        nbSeaux: l.nbSeaux,
        qtySeauKg: l.qtySeauKg,
        quantiteKg,
        prixUnitaire: l.prixUnitaire,
        montantHt,
      };
    });

    const totalTva = totalHt * 0.20; // 20% TVA
    const totalTtc = totalHt + totalTva;

    // Delete old physical docx if it exists
    if (devisExistant.docxPath) {
      const oldPath = path.join(process.cwd(), devisExistant.docxPath);
      if (fs.existsSync(oldPath)) {
        try {
          fs.unlinkSync(oldPath);
        } catch (e) {
          console.error('Erreur suppression ancien fichier Word:', e);
        }
      }
    }

    // 2. Perform DB update (delete lines first, then update devis & insert new lines)
    await this.prisma.devisLigne.deleteMany({
      where: { devisId: id },
    });

    const devis = await this.prisma.devis.update({
      where: { id },
      data: {
        numeroDevis,
        numeroDevisMiddle: dto.numeroDevisMiddle,
        dateDevis,
        objet: dto.objet,
        clientNom: dto.clientNom,
        totalHt,
        totalTva,
        totalTtc,
        lignes: {
          create: linesData.map((l, idx) => ({
            designation: l.designation,
            nbSeaux: l.nbSeaux,
            qtySeauKg: l.qtySeauKg,
            quantiteKg: l.quantiteKg,
            prixUnitaire: l.prixUnitaire,
            montantHt: l.montantHt,
            ordre: idx,
          })),
        },
      },
      include: {
        lignes: true,
      },
    });

    // 3. Prepare directory
    const uploadsDir = path.join(process.cwd(), 'uploads', 'devis');
    fs.mkdirSync(uploadsDir, { recursive: true });

    // 4. Create temp JSON file for Python generator script
    const tempJsonFilename = `temp_${devis.id}.json`;
    const tempJsonPath = path.join(uploadsDir, tempJsonFilename);
    
    const pyPayload = {
      numeroDevisMiddle: devis.numeroDevisMiddle,
      clientNom: devis.clientNom,
      dateDevis: devis.dateDevis.toISOString().split('T')[0],
      objet: devis.objet,
      lignes: devis.lignes.map((l) => ({
        designation: l.designation,
        nbSeaux: Number(l.nbSeaux),
        qtySeauKg: Number(l.qtySeauKg),
        prixUnitaire: Number(l.prixUnitaire),
      })),
    };

    fs.writeFileSync(tempJsonPath, JSON.stringify(pyPayload, null, 2), 'utf-8');

    // 5. Run Python DOCX generator
    const docxFilename = `Devis_CH-${devis.numeroDevisMiddle}-26_${devis.id}.docx`;
    const docxOutputPath = path.join(uploadsDir, docxFilename);
    const scriptPath = path.join(process.cwd(), 'scripts', 'generate-devis-docx.py');
    const command = `python "${scriptPath}" "${tempJsonPath}" "${docxOutputPath}"`;

    try {
      await execAsync(command);
      
      // Clean up temp JSON
      if (fs.existsSync(tempJsonPath)) {
        fs.unlinkSync(tempJsonPath);
      }

      // Update docxPath in DB
      const dbDocxPath = `/uploads/devis/${docxFilename}`;
      const updatedDevis = await this.prisma.devis.update({
        where: { id: devis.id },
        data: { docxPath: dbDocxPath },
        include: { lignes: true },
      });

      return updatedDevis;
    } catch (err) {
      console.error('Error executing python docx generator:', err);
      // Clean up temp JSON if it exists
      if (fs.existsSync(tempJsonPath)) {
        fs.unlinkSync(tempJsonPath);
      }
      throw new Error(`Erreur lors de la régénération du document Word: ${err.message}`);
    }
  }

  async findAll() {
    return this.prisma.devis.findMany({
      include: {
        lignes: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: number) {
    const devis = await this.prisma.devis.findUnique({
      where: { id },
      include: { lignes: true },
    });
    if (!devis) throw new NotFoundException('Devis introuvable');
    return devis;
  }

  async delete(id: number) {
    const devis = await this.findOne(id);
    
    // Clean up physical docx file
    if (devis.docxPath) {
      const physicalPath = path.join(process.cwd(), devis.docxPath);
      if (fs.existsSync(physicalPath)) {
        fs.unlinkSync(physicalPath);
      }
    }

    return this.prisma.devis.delete({
      where: { id },
    });
  }
}
