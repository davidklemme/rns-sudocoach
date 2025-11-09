/**
 * Web Worker for ML model inference
 * Runs TensorFlow.js model in background thread
 */

import type { MoveFeatures } from './features'

// Worker message types
export interface InferenceRequest {
  type: 'inference'
  features: MoveFeatures
  requestId: string
}

export interface InferenceResponse {
  type: 'inference_result'
  requestId: string
  result: {
    strategy: string
    confidence: number
    probabilities: Record<string, number>
  }
}

export interface LoadModelRequest {
  type: 'load_model'
  modelUrl: string
}

export interface LoadModelResponse {
  type: 'model_loaded'
  success: boolean
  error?: string
}

export type WorkerRequest = InferenceRequest | LoadModelRequest
export type WorkerResponse = InferenceResponse | LoadModelResponse

// This will run in the Web Worker context
let model: any = null
let isModelLoaded = false

// Strategy class names (must match training data)
const STRATEGY_CLASSES = [
  'elimination',
  'single_candidate',
  'hidden_single',
  'naked_pair',
  'naked_triple',
  'hidden_pair',
  'pointing_pair',
  'box_line_reduction',
  'x_wing',
  'guessing',
  'unknown',
  'advanced',
]

/**
 * Load TensorFlow.js model
 */
async function loadModel(modelUrl: string): Promise<void> {
  try {
    // Import TensorFlow.js (will be available in worker context)
    // @ts-ignore - Dynamic import in worker
    const tf = await import('@tensorflow/tfjs')

    // Load the model
    model = await tf.loadLayersModel(modelUrl)
    isModelLoaded = true

    console.log('ML model loaded successfully')
  } catch (error) {
    console.error('Failed to load ML model:', error)
    throw error
  }
}

/**
 * Run inference on features
 */
async function runInference(features: MoveFeatures): Promise<{
  strategy: string
  confidence: number
  probabilities: Record<string, number>
}> {
  if (!isModelLoaded || !model) {
    throw new Error('Model not loaded')
  }

  try {
    // @ts-ignore
    const tf = await import('@tensorflow/tfjs')

    // Convert features to tensor
    const { featuresToArray, normalizeFeatures } = await import('./features')
    const featureArray = featuresToArray(features)
    const normalized = normalizeFeatures(featureArray)

    // Create tensor and run inference
    const inputTensor = tf.tensor2d([normalized], [1, normalized.length])
    const prediction = model.predict(inputTensor) as any

    // Get probabilities
    const probArray = await prediction.data()

    // Find highest probability
    let maxProb = 0
    let maxIndex = 0
    const probabilities: Record<string, number> = {}

    STRATEGY_CLASSES.forEach((strategy, index) => {
      const prob = probArray[index]
      probabilities[strategy] = prob

      if (prob > maxProb) {
        maxProb = prob
        maxIndex = index
      }
    })

    // Clean up tensors
    inputTensor.dispose()
    prediction.dispose()

    return {
      strategy: STRATEGY_CLASSES[maxIndex],
      confidence: maxProb,
      probabilities,
    }
  } catch (error) {
    console.error('Inference failed:', error)
    throw error
  }
}

/**
 * Handle messages from main thread
 */
self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const message = event.data

  try {
    switch (message.type) {
      case 'load_model': {
        await loadModel(message.modelUrl)
        const response: LoadModelResponse = {
          type: 'model_loaded',
          success: true,
        }
        self.postMessage(response)
        break
      }

      case 'inference': {
        const result = await runInference(message.features)
        const response: InferenceResponse = {
          type: 'inference_result',
          requestId: message.requestId,
          result,
        }
        self.postMessage(response)
        break
      }
    }
  } catch (error) {
    if (message.type === 'load_model') {
      const response: LoadModelResponse = {
        type: 'model_loaded',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
      self.postMessage(response)
    } else if (message.type === 'inference') {
      // Send error response
      console.error('Worker error:', error)
    }
  }
}

// Export empty object for TypeScript
export {}
