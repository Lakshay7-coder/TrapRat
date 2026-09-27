import crypto from 'crypto';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { sha256 } from '../../utils/crypto';

export class IdentityService {
  /**
   * Calculate Jaro-Winkler distance between two strings
   */
  static jaroWinkler(s1: string, s2: string): number {
    s1 = s1.trim().toLowerCase();
    s2 = s2.trim().toLowerCase();
    if (s1 === s2) return 1.0;
    if (!s1.length || !s2.length) return 0.0;

    const matchDistance = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
    const s1Matches = new Array(s1.length).fill(false);
    const s2Matches = new Array(s2.length).fill(false);

    let matches = 0;
    for (let i = 0; i < s1.length; i++) {
      const start = Math.max(0, i - matchDistance);
      const end = Math.min(i + matchDistance + 1, s2.length);

      for (let j = start; j < end; j++) {
        if (s2Matches[j] || s1[i] !== s2[j]) continue;
        s1Matches[i] = true;
        s2Matches[j] = true;
        matches++;
        break;
      }
    }

    if (matches === 0) return 0.0;

    let transpositions = 0;
    let k = 0;
    for (let i = 0; i < s1.length; i++) {
      if (!s1Matches[i]) continue;
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) transpositions++;
      k++;
    }

    const jaro =
      (matches / s1.length +
        matches / s2.length +
        (matches - transpositions / 2) / matches) /
      3.0;

    // Common prefix bonus up to 4 chars
    let prefix = 0;
    for (let i = 0; i < Math.min(4, s1.length, s2.length); i++) {
      if (s1[i] === s2[i]) prefix++;
      else break;
    }

    return jaro + prefix * 0.1 * (1.0 - jaro);
  }

  /**
   * Computes match key hash for cross-programme duplicate detection
   */
  static computeMatchKeyHash(name: string, dob: string, district: string): string {
    const norm = `${name.trim().toLowerCase()}_${dob}_${district.trim().toLowerCase()}`;
    return crypto.createHmac('sha256', env.IDENTITY_HMAC_SALT).update(norm).digest('hex');
  }

  /**
   * Scans for cross-programme identity duplicate candidates
   */
  static async findLinkCandidates(traineeId: string) {
    const target = await prisma.trainee.findUnique({
      where: { id: traineeId },
      include: { identityLinks: true },
    });
    if (!target) return [];

    const candidates = await prisma.trainee.findMany({
      where: {
        id: { not: target.id },
        district: target.district,
      },
    });

    const linksFound = [];

    for (const other of candidates) {
      const nameSim = this.jaroWinkler(target.name, other.name);
      const dobMatch = target.dob && other.dob ? target.dob.toISOString().slice(0, 10) === other.dob.toISOString().slice(0, 10) : false;
      const districtMatch = target.district.toLowerCase() === other.district.toLowerCase();

      let overallConfidence = nameSim * 0.6;
      if (dobMatch) overallConfidence += 0.3;
      if (districtMatch) overallConfidence += 0.1;

      let status = 'no_match';
      if (overallConfidence >= env.IDENTITY_AUTO_LINK_THRESHOLD) {
        status = 'auto_linked';
      } else if (overallConfidence >= env.IDENTITY_REVIEW_THRESHOLD) {
        status = 'under_review';
      }

      if (status !== 'no_match') {
        const sourceRefHash = sha256(`EXT_${other.id}`);
        const matchKeyHash = this.computeMatchKeyHash(
          target.name,
          target.dob ? target.dob.toISOString() : 'NA',
          target.district
        );

        const existing = await prisma.identityLink.findUnique({
          where: {
            sourceScheme_sourceRefHash: {
              sourceScheme: 'PMKVY_LEGACY_IMPORT',
              sourceRefHash,
            },
          },
        });

        if (!existing) {
          const record = await prisma.identityLink.create({
            data: {
              traineeId: target.id,
              sourceScheme: 'PMKVY_LEGACY_IMPORT',
              sourceRefHash,
              matchKeyHash,
              confidence: parseFloat(overallConfidence.toFixed(2)),
              status,
            },
          });
          linksFound.push(record);
        }
      }
    }

    return linksFound;
  }
}
