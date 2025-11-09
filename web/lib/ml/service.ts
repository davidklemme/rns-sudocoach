/**
 * ML Service - Main thread interface for ML model
 * Manages Web Worker communication for async inference
 */

import type { MoveFeatures } from './features'
import type { InferenceRequest, InferenceResponse, WorkerResponse } from './ml.worker'

export interface MLPrediction {
  strategy: string
  confidence: number
  probabilities: Record<string, number>
}

class MLService {
  private worker: Worker | null = null
  private isModelLoaded = false
  private pendingRequests = new Map<string, {
    resolve: (result: MLPrediction) => void
    reject: (error: Error) => void
  }>()

  /**
   * Initialize the ML service and load model
   */
  async initialize(modelUrl?: string): Promise<void> {
    if (this.worker) {
      return // Already initialized
    }

    try {
      // Create Web Worker
      this.worker = new Worker(new URL('./ml.worker.ts', import.meta.url), {
        type: 'module',
      })

      // Set up message handler
      this.worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
        this.handleWorkerMessage(event.data)
      }

      this.worker.onerror = (error) => {
        console.error('ML Worker error:', error)
      }

      // Load model if URL provided
      if (modelUrl) {
        await this.loadModel(modelUrl)
      }
    } catch (error) {
      console.error('Failed to initialize ML service:', error)
      throw error
    }
  }

  /**
   * Load ML model
   */
  async loadModel(modelUrl: string): Promise<void> {
    if (!this.worker) {
      throw new Error('ML service not initialized')
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Model loading timeout'))
      }, 30000) // 30 second timeout

      const messageHandler = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === 'model_loaded') {
          clearTimeout(timeout)
          this.worker?.removeEventListener('message', messageHandler)

          if (event.data.success) {
            this.isModelLoaded = true
            resolve()
          } else {
            reject(new Error(event.data.error || 'Failed to load model'))
          }
        }
      }

      this.worker?.addEventListener('message', messageHandler)
      this.worker?.postMessage({ type: 'load_model', modelUrl })
    })
  }

  /**
   * Run inference on move features
   */
  async predict(features: MoveFeatures): Promise<MLPrediction> {
    if (!this.worker) {
      throw new Error('ML service not initialized')
    }

    if (!this.isModelLoaded) {
      throw new Error('Model not loaded')
    }

    return new Promise((resolve, reject) => {
      const requestId = generateRequestId()

      this.pendingRequests.set(requestId, { resolve, reject })

      const request: InferenceRequest = {
        type: 'inference',
        features,
        requestId,
      }

      this.worker?.postMessage(request)

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId)
          reject(new Error('Inference timeout'))
        }
      }, 5000)
    })
  }

  /**
   * Handle worker messages
   */
  private handleWorkerMessage(message: WorkerResponse): void {
    if (message.type === 'inference_result') {
      const pending = this.pendingRequests.get(message.requestId)

      if (pending) {
        pending.resolve(message.result)
        this.pendingRequests.delete(message.requestId)
      }
    }
  }

  /**
   * Check if model is loaded
   */
  isLoaded(): boolean {
    return this.isModelLoaded
  }

  /**
   * Terminate the worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this.isModelLoaded = false
      this.pendingRequests.clear()
    }
  }
}

// Generate unique request ID
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// Singleton instance
let mlServiceInstance: MLService | null = null

/**
 * Get ML service instance
 */
export function getMLService(): MLService {
  if (!mlServiceInstance) {
    mlServiceInstance = new MLService()
  }
  return mlServiceInstance
}

/**
 * Initialize ML service (call once on app startup)
 */
export async function initializeML(modelUrl?: string): Promise<void> {
  const service = getMLService()
  await service.initialize(modelUrl)
}

/**
 * Predict strategy for a move
 */
export async function predictStrategy(features: MoveFeatures): Promise<MLPrediction> {
  const service = getMLService()
  return service.predict(features)
}
