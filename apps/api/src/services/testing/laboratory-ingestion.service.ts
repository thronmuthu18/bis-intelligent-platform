import { prisma } from '../../db/client.js';
import { VERIFIED_SEED_LABORATORIES, RawLaboratorySeed } from '../../data/seedLaboratories.js';
import { normalizeIsNumber } from '../ingestion/normalizer.js';

export interface LaboratoryIngestResult {
  labsProcessed: number;
  labsCreated: number;
  labsUpdated: number;
  capabilitiesCreated: number;
  ingestionRunId: string;
}

/**
 * Ingests authoritative laboratory records into the BIS Knowledge Repository.
 */
export async function ingestVerifiedLaboratories(
  labs: RawLaboratorySeed[] = VERIFIED_SEED_LABORATORIES,
  triggeredBy: string = 'SYSTEM_SEED'
): Promise<LaboratoryIngestResult> {
  const ingestionRun = await prisma.ingestionRun.create({
    data: {
      sourceName: 'BIS LIMS & NABL Official Laboratory Directories',
      sourceUrl: 'https://www.lims.bis.gov.in',
      status: 'RUNNING',
      triggeredBy,
    },
  });

  let createdCount = 0;
  let updatedCount = 0;
  let capsCount = 0;

  try {
    for (const rawLab of labs) {
      // 1. Ensure SourceDocument for the Laboratory
      let sourceDoc = await prisma.sourceDocument.findFirst({
        where: { url: rawLab.sourceUrl },
      });

      if (!sourceDoc) {
        sourceDoc = await prisma.sourceDocument.create({
          data: {
            title: rawLab.sourceTitle,
            url: rawLab.sourceUrl,
            sourceType: rawLab.isBisLab ? 'BIS_OFFICIAL' : 'OTHER_REFERENCE',
            authorityLevel: rawLab.authorityLevel,
            documentType: 'Official Laboratory Directory Record',
            status: 'ACTIVE',
          },
        });
      }

      // 2. Upsert Laboratory Record
      let laboratory = await prisma.laboratory.findFirst({
        where: {
          OR: [{ code: rawLab.code }, { name: rawLab.name, city: rawLab.city }],
        },
      });

      if (!laboratory) {
        laboratory = await prisma.laboratory.create({
          data: {
            name: rawLab.name,
            code: rawLab.code,
            organizationType: rawLab.organizationType,
            address: rawLab.address,
            city: rawLab.city,
            state: rawLab.state,
            country: rawLab.country || 'India',
            pincode: rawLab.pincode,
            phone: rawLab.phone,
            email: rawLab.email,
            website: rawLab.website,
            isNabl: rawLab.isNabl,
            isBisLab: rawLab.isBisLab,
            status: rawLab.status || 'ACTIVE',
            sourceDocumentId: sourceDoc.id,
            sourceUrl: rawLab.sourceUrl,
            authorityLevel: rawLab.authorityLevel,
            isVerified: true,
            isActive: true,
            lastVerifiedAt: new Date(),
          },
        });
        createdCount++;
      } else {
        laboratory = await prisma.laboratory.update({
          where: { id: laboratory.id },
          data: {
            organizationType: rawLab.organizationType,
            address: rawLab.address,
            city: rawLab.city,
            state: rawLab.state,
            pincode: rawLab.pincode,
            phone: rawLab.phone,
            email: rawLab.email,
            website: rawLab.website,
            isNabl: rawLab.isNabl,
            isBisLab: rawLab.isBisLab,
            sourceDocumentId: sourceDoc.id,
            sourceUrl: rawLab.sourceUrl,
            authorityLevel: rawLab.authorityLevel,
            isVerified: true,
            isActive: true,
            lastVerifiedAt: new Date(),
          },
        });
        updatedCount++;
      }

      // 3. Process capabilities
      for (const cap of rawLab.capabilities) {
        const canonicalNum = normalizeIsNumber(cap.standardNumber);
        const standard = await prisma.standard.findFirst({
          where: {
            OR: [
              { isNumber: cap.standardNumber },
              { canonicalNumber: canonicalNum },
            ],
          },
        });

        // Ensure capability SourceDocument if specific URL
        let capSourceDocId = sourceDoc.id;
        if (cap.sourceUrl && cap.sourceUrl !== rawLab.sourceUrl) {
          let capDoc = await prisma.sourceDocument.findFirst({
            where: { url: cap.sourceUrl },
          });
          if (!capDoc) {
            capDoc = await prisma.sourceDocument.create({
              data: {
                title: cap.sourceTitle || `${rawLab.name} Capability Schedule`,
                url: cap.sourceUrl,
                sourceType: 'BIS_OFFICIAL',
                authorityLevel: 'AUTHORITATIVE',
                documentType: 'Laboratory Capability Scope',
                status: 'ACTIVE',
              },
            });
          }
          capSourceDocId = capDoc.id;
        }

        // Upsert LaboratoryCapability
        const existingCap = await prisma.laboratoryCapability.findFirst({
          where: {
            laboratoryId: laboratory.id,
            standardId: standard ? standard.id : undefined,
            testName: cap.testName || null,
          },
        });

        if (!existingCap) {
          await prisma.laboratoryCapability.create({
            data: {
              laboratoryId: laboratory.id,
              standardId: standard ? standard.id : null,
              testName: cap.testName,
              testMethod: cap.testMethod,
              scopeDescription: cap.scopeDescription,
              accreditationStatus: cap.accreditationStatus,
              recognitionStatus: cap.recognitionStatus,
              sourceDocumentId: capSourceDocId,
              sourceUrl: cap.sourceUrl || rawLab.sourceUrl,
              authorityLevel: 'AUTHORITATIVE',
              verifiedAt: new Date(),
            },
          });
          capsCount++;
        } else {
          await prisma.laboratoryCapability.update({
            where: { id: existingCap.id },
            data: {
              testMethod: cap.testMethod,
              scopeDescription: cap.scopeDescription,
              accreditationStatus: cap.accreditationStatus,
              recognitionStatus: cap.recognitionStatus,
              sourceDocumentId: capSourceDocId,
              sourceUrl: cap.sourceUrl || rawLab.sourceUrl,
              authorityLevel: 'AUTHORITATIVE',
              verifiedAt: new Date(),
            },
          });
        }
      }
    }

    await prisma.ingestionRun.update({
      where: { id: ingestionRun.id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        recordsProcessed: labs.length,
        recordsCreated: createdCount,
        recordsUpdated: updatedCount,
      },
    });

    return {
      labsProcessed: labs.length,
      labsCreated: createdCount,
      labsUpdated: updatedCount,
      capabilitiesCreated: capsCount,
      ingestionRunId: ingestionRun.id,
    };
  } catch (err: any) {
    await prisma.ingestionRun.update({
      where: { id: ingestionRun.id },
      data: {
        status: 'FAILED',
        completedAt: new Date(),
        errorSummary: err.message || 'Laboratory ingestion failed',
      },
    });
    throw err;
  }
}
