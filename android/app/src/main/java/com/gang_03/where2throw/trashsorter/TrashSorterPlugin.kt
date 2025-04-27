package com.gang_03.where2throw.trashsorter

import android.graphics.ImageFormat
import android.graphics.YuvImage
import android.graphics.Rect
import android.util.Log
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import ai.onnxruntime.*
import java.io.ByteArrayOutputStream
import java.nio.ByteBuffer
import java.util.Collections
import java.nio.FloatBuffer
// Android 이미지 관련
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.Image



class TrashSorterPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?) : FrameProcessorPlugin() {

  private var ortEnv: OrtEnvironment = OrtEnvironment.getEnvironment()
  private var ortSession: OrtSession

  init {
    val modelStream = this::class.java.classLoader!!
      .getResourceAsStream("assets/waste_classifier.ort")
    val modelBytes = modelStream!!.readBytes()
    ortSession = ortEnv.createSession(modelBytes)
  }

  private fun imageToBitmap(image: Image): Bitmap {
    val yBuffer = image.planes[0].buffer
    val uBuffer = image.planes[1].buffer
    val vBuffer = image.planes[2].buffer

    val ySize = yBuffer.remaining()
    val uSize = uBuffer.remaining()
    val vSize = vBuffer.remaining()

    val nv21 = ByteArray(ySize + uSize + vSize)
    yBuffer.get(nv21, 0, ySize)
    vBuffer.get(nv21, ySize, vSize)
    uBuffer.get(nv21, ySize + vSize, uSize)

    val yuvImage = YuvImage(nv21, ImageFormat.NV21, image.width, image.height, null)
    val out = ByteArrayOutputStream()
    yuvImage.compressToJpeg(Rect(0, 0, image.width, image.height), 100, out)
    val jpegBytes = out.toByteArray()

    return BitmapFactory.decodeByteArray(jpegBytes, 0, jpegBytes.size)
  }

  private fun bitmapToFloatBuffer(bitmap: Bitmap): FloatBuffer {
    val resized = Bitmap.createScaledBitmap(bitmap, 224, 224, true)
    val floatValues = FloatArray(3 * 224 * 224)
    val pixels = IntArray(224 * 224)
    resized.getPixels(pixels, 0, 224, 0, 0, 224, 224)

    for (i in pixels.indices) {
        val pixel = pixels[i]
        floatValues[i] = ((pixel shr 16) and 0xFF) / 255.0f // R
        floatValues[224 * 224 + i] = ((pixel shr 8) and 0xFF) / 255.0f // G
        floatValues[2 * 224 * 224 + i] = (pixel and 0xFF) / 255.0f // B
    }

    return FloatBuffer.wrap(floatValues)
  }

    private var frameCount = 0
    private var lastPrediction:Int? = null

    override fun callback(frame: Frame, arguments: Map<String, Any>?): Any? {
        frameCount++
        Log.d("TrashSorterPlugin", "$frameCount th frame")
        if (frameCount % 10 != 0) {
            return lastPrediction
        }
     return try {
        val image = frame.getImage()
        val bitmap = imageToBitmap(image)
         try {
             image.close()
         } catch (closeEx: Exception) {
             Log.e("TrashSorterPlugin", "Failed to close image", closeEx)
         }
        val buffer = bitmapToFloatBuffer(bitmap)

        val inputName = ortSession.inputNames.first()
        val outputName = ortSession.outputNames.first()

        val inputTensor = OnnxTensor.createTensor(ortEnv, buffer, longArrayOf(1, 3, 224, 224))
        val result = ortSession.run(mapOf(inputName to inputTensor))
        
val output2D = result.get(outputName).get().value as? Array<FloatArray> ?: return null

// 1. 첫 번째 배열이 실제 결과인 경우 (보통 [1, N] 구조)
val output = output2D[0]

// 2. 가장 큰 값의 인덱스 가져오기
var maxIdx = -1
var maxVal = -Float.MAX_VALUE
for (i in output.indices) {
    if (output[i] > maxVal) {
        maxVal = output[i]
        maxIdx = i
    }
}
         lastPrediction = maxIdx
        maxIdx
    } catch (e: Exception) {
        Log.e("TrashSorterPlugin", "Inference error", e)
        null
    } finally {
        // ⬇️ 무조건 Image 리소스 해제


    }
}


}
