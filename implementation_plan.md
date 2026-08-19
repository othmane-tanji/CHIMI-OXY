# Implementation Plan - Bon de Livraison (BL) Management

This plan details the implementation of a "Bon de Livraison" (Delivery Note) management system. It will reuse the sales invoice (Facture de Vente) template but will conditionally hide price/totals details, rename header labels, and output a custom PDF layout.

## User Review Required

> [!IMPORTANT]
> The database schema changes require running a Prisma migrate or db push command to add `hasBl` and `pdfPathBl` fields to the `FactureVente` table. This is safe to run and does not destroy existing data.

> [!NOTE]
> The input field `numeroAttach` will be shared for both `N° Attach.` (on invoices) and `Mode de livraison` (on BLs) to keep the form unified, as requested.

## Proposed Changes

### Database & Schema

#### [MODIFY] [schema.prisma](file:///c:/Users/othaad/Desktop/OXY-CHIMI/CHMIRAL/CHMIRAL/backend/prisma/schema.prisma)
- Add optional fields to the `FactureVente` model:
  - `hasBl` (Boolean, default `false`)
  - `pdfPathBl` (String, nullable)

---

### Backend Components

#### [MODIFY] [create-facture.dto.ts](file:///c:/Users/othaad/Desktop/OXY-CHIMI/CHMIRAL/CHMIRAL/backend/src/factures/dto/create-facture.dto.ts)
- Add optional `hasBl` boolean parameter to `CreateFactureVenteDto`.

#### [MODIFY] [update-facture.dto.ts](file:///c:/Users/othaad/Desktop/OXY-CHIMI/CHMIRAL/CHMIRAL/backend/src/factures/dto/update-facture.dto.ts)
- Add optional `hasBl` boolean parameter to `UpdateFactureVenteDto`.

#### [MODIFY] [factures.service.ts](file:///c:/Users/othaad/Desktop/OXY-CHIMI/CHMIRAL/CHMIRAL/backend/src/factures/factures.service.ts)
- Update `createVente` and `updateVente` to save the `hasBl` status and conditionally trigger `generateFactureVentePdfFile` for both the invoice PDF and BL PDF.
- If `hasBl` is true, generate the BL PDF at `storage/pdfs/factures/vente/bl-[societe]-[num].pdf` with the flag `isBl: true`.
- Update `toPdfData` to handle passing data to the PDF generator.

#### [MODIFY] [factures.controller.ts](file:///c:/Users/othaad/Desktop/OXY-CHIMI/CHMIRAL/CHMIRAL/backend/src/factures/factures.controller.ts)
- Add endpoint `@Get('vente/:id/bl/pdf')` to download the generated Bon de Livraison PDF.

#### [MODIFY] [facture-pdf.generator.ts](file:///c:/Users/othaad/Desktop/OXY-CHIMI/CHMIRAL/CHMIRAL/backend/src/common/facture-pdf.generator.ts)
- Extend `FacturePdfData` with optional `isBl?: boolean`.
- In `generateFactureVentePdf`, if `isBl` is true:
  1. Draw a colored `<rect>` to cover the pre-printed `FACTURE` header block and write `BON DE LIVRAISON` inside.
     - **OXYRAL**: Draw solid blue `#0330a0` box at `x: 400, y: 60, w: 600, h: 138`. Write `BON DE LIVRAISON` in white.
     - **CHIMIRAL**: Draw solid white `#ffffff` box at `x: 505, y: 45, w: 540, h: 140`. Write `BON DE LIVRAISON` in black/dark grey.
  2. Cover the label `N° ATTACH` with a white rectangle and write `Mode de livraison` above the value.
     - **OXYRAL**: Cover label at `x: 484, y: 495, w: 184, h: 30`. Write `Mode de livraison` in black/dark grey.
     - **CHIMIRAL**: Cover label at `x: 494, y: 515, w: 184, h: 30`. Write `Mode de livraison` in black/dark grey.
  3. Cover the `MONTANT H.T` header and hide row amounts:
     - Draw white rectangle over the header cell (`x: 829`, width `186`, `y` height covering header).
     - Do not append SVG text for `ligne.montantHt` inside the rows loops.
  4. Cover the `TOTAL HORS TAXE` row extremity box (leaving `Chantier : Tanger` visible on the left for Marjane).
     - Draw white rectangle over the bottom-right table cell (`x: 550, y: 1025, w: 465, h: 40`).
  5. Cover the 3 bottom summary boxes (`TOTAL HT`, `TOTAL TVA`, `TOTAL TTC`) and the "Arrêté la présente..." text band.
     - Draw white rectangle over `x: 50, y: 1110, w: 980, h: 175`.
     - Skip drawing `montantEnLettres` text.

---

### Frontend Components

#### [MODIFY] [api.ts](file:///c:/Users/othaad/Desktop/OXY-CHIMI/CHMIRAL/CHMIRAL/frontend/src/lib/api.ts)
- Add method `downloadVenteBlPdf(id: number, filename: string)` to download the BL PDF.

#### [MODIFY] [page.tsx](file:///c:/Users/othaad/Desktop/OXY-CHIMI/CHMIRAL/CHMIRAL/frontend/src/app/factures/page.tsx)
- Add new tabs: `bl-oxyral` and `bl-chimiral`.
- Update invoice forms:
  - Change input label of `numeroAttach` to `N° Attach. / Mode de livraison`.
  - Add a checkbox "Création avec bon de livraison" to enable/disable `hasBl`.
- Update invoice details and list views:
  - If viewing a BL tab:
    - Filter invoices where `hasBl === true`.
    - Change columns: show `N° Bon de Livraison` (same as invoice number), `Client`, `Date`, `Mode de livraison` (maps to `numeroAttach`), `PDF` (downloads the BL PDF), and `Actions`.

## Verification Plan

### Automated Tests
- Write a node script `backend/scripts/test-bl-preview.js` to generate BL PDFs for OXYRAL and CHIMIRAL.
- Convert generated PDFs to PNG images to verify there is no text overlap or incorrect background coverage.

### Manual Verification
- Run the NestJS backend and Next.js frontend.
- Go to "Factures de vente OXYRAL" tab, create a new sales invoice with the "Création avec bon de livraison" checkbox checked and a value in "N° Attach. / Mode de livraison".
- Verify that a BL PDF is generated and appears in the new "Bons de livraison OXYRAL" tab.
- Download both PDFs to confirm columns are blank/renamed on the BL and correctly populated on the Invoice.
