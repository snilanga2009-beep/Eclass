import * as faceapi from '@vladmandic/face-api';

export interface EnrolledFace {
  id: string;
  studentId: string;
  studentIdNumber: string;
  studentName: string;
  studentPhoto?: string;
  grade?: string;
  label?: string;
  descriptor: Float32Array | number[];
  descriptors?: Array<Float32Array | number[]>;
  qualityScore?: number;
  consentGiven: boolean;
  consentDate: string;
  consentBy: string;
}

export interface MatchEvaluation {
  status: 'MATCH' | 'UNCERTAIN' | 'NO_MATCH';
  student?: {
    id: string;
    studentIdNumber: string;
    studentName: string;
    studentPhoto?: string;
    grade?: string;
  };
  distance: number;
  similarity: number;
  candidates?: Array<{
    id: string;
    studentIdNumber: string;
    studentName: string;
    studentPhoto?: string;
    grade?: string;
    distance: number;
    similarity: number;
  }>;
}

let modelsLoaded = false;
let modelLoadingPromise: Promise<boolean> | null = null;

/**
 * Loads face-api models from /models/ directory in public assets
 */
export async function loadFaceRecognitionModels(modelPath: string = '/models'): Promise<boolean> {
  if (modelsLoaded) return true;
  if (modelLoadingPromise) return modelLoadingPromise;

  modelLoadingPromise = (async () => {
    try {
      console.log('[FaceRecognition] Loading face detection & recognition models from:', modelPath);
      
      // Load Tiny Face Detector, 68 Landmark model, and 128-d Face Recognition Net
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(modelPath),
        faceapi.nets.faceLandmark68Net.loadFromUri(modelPath),
        faceapi.nets.faceRecognitionNet.loadFromUri(modelPath)
      ]);

      modelsLoaded = true;
      console.log('[FaceRecognition] All models loaded successfully.');
      return true;
    } catch (err: any) {
      console.error('[FaceRecognition] Model loading failed:', err);
      // Fallback: try relative path 'models'
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('models')
        ]);
        modelsLoaded = true;
        console.log('[FaceRecognition] Models loaded via relative path fallback.');
        return true;
      } catch (fallbackErr) {
        console.error('[FaceRecognition] Fallback model loading failed:', fallbackErr);
        modelsLoaded = false;
        return false;
      }
    } finally {
      modelLoadingPromise = null;
    }
  })();

  return modelLoadingPromise;
}

/**
 * Detect single face with landmarks & 128-d descriptor from a Video or Image element
 */
export async function extractFaceDescriptorFromMedia(
  input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement
): Promise<{
  descriptor: Float32Array;
  detection: faceapi.FaceDetection;
  box: { x: number; y: number; width: number; height: number };
  score: number;
} | null> {
  if (!modelsLoaded) {
    const ok = await loadFaceRecognitionModels();
    if (!ok) return null;
  }

  // Use TinyFaceDetectorOptions for real-time video performance
  const options = new faceapi.TinyFaceDetectorOptions({
    inputSize: 416,
    scoreThreshold: 0.5
  });

  const result = await faceapi
    .detectSingleFace(input, options)
    .withFaceLandmarks()
    .withFaceDescriptor();

  if (!result || !result.descriptor) {
    return null;
  }

  return {
    descriptor: result.descriptor,
    detection: result.detection,
    box: {
      x: result.detection.box.x,
      y: result.detection.box.y,
      width: result.detection.box.width,
      height: result.detection.box.height
    },
    score: result.detection.score
  };
}

/**
 * Calculates Euclidean distance between two 128-dimensional descriptors
 */
export function euclideanDistance(
  descA: Float32Array | number[],
  descB: Float32Array | number[]
): number {
  let sum = 0;
  for (let i = 0; i < 128; i++) {
    const diff = (descA[i] || 0) - (descB[i] || 0);
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Matches a detected descriptor against cached enrolled student templates
 */
export function matchCandidateAgainstEnrolled(
  candidateDescriptor: Float32Array | number[],
  enrolledStudents: EnrolledFace[],
  matchThreshold: number = 0.45,
  reviewThreshold: number = 0.58
): MatchEvaluation {
  if (!candidateDescriptor || enrolledStudents.length === 0) {
    return {
      status: 'NO_MATCH',
      distance: 1.0,
      similarity: 0
    };
  }

  const scored: Array<{
    student: {
      id: string;
      studentIdNumber: string;
      studentName: string;
      studentPhoto?: string;
      grade?: string;
    };
    distance: number;
    similarity: number;
  }> = [];

  for (const item of enrolledStudents) {
    // Check primary descriptor
    let minD = euclideanDistance(candidateDescriptor, item.descriptor);

    // If alternate pose descriptors exist, check them
    if (Array.isArray(item.descriptors)) {
      for (const alt of item.descriptors) {
        const d = euclideanDistance(candidateDescriptor, alt);
        if (d < minD) minD = d;
      }
    }

    const similarity = Math.max(0, Math.min(100, Math.round((1 - minD) * 100)));

    scored.push({
      student: {
        id: item.studentId,
        studentIdNumber: item.studentIdNumber,
        studentName: item.studentName,
        studentPhoto: item.studentPhoto,
        grade: item.grade
      },
      distance: minD,
      similarity
    });
  }

  scored.sort((a, b) => a.distance - b.distance);

  if (scored.length === 0) {
    return {
      status: 'NO_MATCH',
      distance: 1.0,
      similarity: 0
    };
  }

  const best = scored[0];

  if (best.distance <= matchThreshold) {
    return {
      status: 'MATCH',
      student: best.student,
      distance: best.distance,
      similarity: best.similarity,
      candidates: scored.slice(0, 3)
    };
  }

  if (best.distance <= reviewThreshold) {
    return {
      status: 'UNCERTAIN',
      student: best.student,
      distance: best.distance,
      similarity: best.similarity,
      candidates: scored.slice(0, 3)
    };
  }

  return {
    status: 'NO_MATCH',
    distance: best.distance,
    similarity: best.similarity,
    candidates: scored.slice(0, 2)
  };
}
