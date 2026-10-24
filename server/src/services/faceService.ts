import db, { FaceTemplate, Student } from '../db';

export interface FaceMatchResult {
  status: 'MATCH' | 'UNCERTAIN' | 'NO_MATCH';
  student?: Student;
  template?: FaceTemplate;
  distance: number;
  similarity: number;
  candidates?: Array<{
    student: Student;
    template: FaceTemplate;
    distance: number;
    similarity: number;
  }>;
}

/**
 * Calculates Euclidean distance between two 128-dimensional facial embedding vectors.
 * Lower distance means higher similarity.
 * Typically:
 *  - Distance < 0.42: High confidence exact match (> 85% match)
 *  - Distance 0.42 - 0.58: Uncertain / Ambiguous match (requires manual review)
 *  - Distance > 0.58: No match / Unknown face
 */
export function calculateEuclideanDistance(desc1: number[], desc2: number[]): number {
  if (!Array.isArray(desc1) || !Array.isArray(desc2) || desc1.length !== desc2.length) {
    return 1.0;
  }
  let sum = 0;
  for (let i = 0; i < desc1.length; i++) {
    const diff = desc1[i] - desc2[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Calculates Cosine similarity between two vectors (-1 to 1, mapped to 0% - 100%)
 */
export function calculateCosineSimilarity(desc1: number[], desc2: number[]): number {
  if (!Array.isArray(desc1) || !Array.isArray(desc2) || desc1.length !== desc2.length) {
    return 0;
  }
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < desc1.length; i++) {
    dotProduct += desc1[i] * desc2[i];
    normA += desc1[i] * desc1[i];
    normB += desc2[i] * desc2[i];
  }
  if (normA === 0 || normB === 0) return 0;
  const cosine = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  // Convert cosine similarity to 0..1 range
  return Math.max(0, Math.min(1, (cosine + 1) / 2));
}

/**
 * Compare candidate descriptor against enrolled templates
 */
export function matchFaceDescriptor(
  candidateDescriptor: number[],
  templates: FaceTemplate[],
  matchThreshold: number = 0.45,
  reviewThreshold: number = 0.58
): FaceMatchResult {
  if (!candidateDescriptor || candidateDescriptor.length !== 128 || !templates || templates.length === 0) {
    return {
      status: 'NO_MATCH',
      distance: 1.0,
      similarity: 0
    };
  }

  const scoredMatches: Array<{
    student: Student;
    template: FaceTemplate;
    distance: number;
    similarity: number;
  }> = [];

  for (const template of templates) {
    const student = db.data.students.find(s => s.id === template.studentId);
    if (!student || student.status !== 'ACTIVE') continue;

    // Check primary descriptor
    let minDistance = calculateEuclideanDistance(candidateDescriptor, template.descriptor);

    // If template has alternate pose descriptors, test against them too
    if (Array.isArray(template.descriptors) && template.descriptors.length > 0) {
      for (const altDesc of template.descriptors) {
        const d = calculateEuclideanDistance(candidateDescriptor, altDesc);
        if (d < minDistance) {
          minDistance = d;
        }
      }
    }

    // Convert distance to normalized similarity percentage (0 - 100%)
    // Distance 0.0 -> 100% similarity, Distance 1.0 -> 0%
    const similarity = Math.max(0, Math.min(1, 1 - (minDistance / 1.0)));

    scoredMatches.push({
      student,
      template,
      distance: minDistance,
      similarity
    });
  }

  // Sort by smallest distance (highest similarity) first
  scoredMatches.sort((a, b) => a.distance - b.distance);

  if (scoredMatches.length === 0) {
    return {
      status: 'NO_MATCH',
      distance: 1.0,
      similarity: 0
    };
  }

  const best = scoredMatches[0];

  // High confidence automatic match
  if (best.distance <= matchThreshold) {
    return {
      status: 'MATCH',
      student: best.student,
      template: best.template,
      distance: best.distance,
      similarity: best.similarity,
      candidates: scoredMatches.slice(0, 3)
    };
  }

  // Uncertain / borderline match (manual review candidate)
  if (best.distance <= reviewThreshold) {
    return {
      status: 'UNCERTAIN',
      student: best.student,
      template: best.template,
      distance: best.distance,
      similarity: best.similarity,
      candidates: scoredMatches.slice(0, 3)
    };
  }

  // Unknown face
  return {
    status: 'NO_MATCH',
    distance: best.distance,
    similarity: best.similarity,
    candidates: scoredMatches.slice(0, 2)
  };
}
