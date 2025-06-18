package com.where2throw.where2throwapp.yolov11processor

import android.content.res.AssetFileDescriptor
import android.content.res.AssetManager
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Matrix
import android.graphics.RectF
import android.media.Image
import android.util.Log
import androidx.camera.core.ImageProxy
import com.facebook.react.bridge.Arguments // Still useful for creating nested WritableNativeMaps/Arrays if you want
import com.facebook.react.bridge.WritableNativeArray
import com.facebook.react.bridge.WritableNativeMap
import com.mrousavy.camera.frameprocessors.Frame
import com.mrousavy.camera.frameprocessors.FrameProcessorPlugin
import com.mrousavy.camera.frameprocessors.VisionCameraProxy
import org.tensorflow.lite.Interpreter
import java.io.FileInputStream
import java.io.IOException
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.MappedByteBuffer
import java.nio.channels.FileChannel
import kotlin.math.max
import kotlin.math.min

class YoloV11ProcessorPlugin(proxy: VisionCameraProxy, options: Map<String, Any>?) :
    FrameProcessorPlugin() {

    private val tflite: Interpreter by lazy {
        val assetManager = proxy.context.assets
        val modelPath = "yolo11n.tflite"
        Interpreter(loadModelFile(assetManager, modelPath))
    }
    private var classNames: List<String> = emptyList() // 클래스 이름 로드


    companion object {
        private const val TAG = "TrashSorterPlugin"
        private const val MODEL_INPUT_WIDTH = 640
        private const val MODEL_INPUT_HEIGHT = 640
        private const val BBOX_COORDS = 4 // x_center, y_center, width, height

        // 출력 텐서 [1, 84, 8400] 에서 84 = 4 (bbox) + NUM_CLASSES
        private const val NUM_MODEL_CLASSES = 80 // 예: COCO 모델의 경우 (84 - 4)
        private const val NUM_PREDICTIONS = 8400 // 출력 텐서의 마지막 차원
    }

    init {
        Log.d(TAG, "TrashSorterPlugin initialized with options: $options")
        classNames = listOf("paper", "plastic", "can", "glass") // Todo: 실제 클래스 이름으로 대체
        Log.d(TAG, "Class names loaded: $classNames")
    }

    private fun loadModelFile(assetManager: AssetManager, modelPath: String): MappedByteBuffer {
        assetManager.openFd(modelPath).use { fileDescriptor ->
            FileInputStream(fileDescriptor.fileDescriptor).use { inputStream ->
                val fileChannel = inputStream.channel
                val startOffset = fileDescriptor.startOffset
                val declaredLength = fileDescriptor.declaredLength
                return fileChannel.map(FileChannel.MapMode.READ_ONLY, startOffset, declaredLength)
            }
        }
    }
    private data class PreprocessingResult(
        val processedBitmap: Bitmap,
        val scale: Float,
        val padX: Float,
        val padY: Float,
        val originalWidth: Int,
        val originalHeight: Int
    )

    private fun convertAndResizeBitmap(sourceBitmap: Bitmap): PreprocessingResult {
        val sourceWidth = sourceBitmap.width
        val sourceHeight = sourceBitmap.height

        val s = Math.min(
            MODEL_INPUT_WIDTH.toFloat() / sourceWidth,
            MODEL_INPUT_HEIGHT.toFloat() / sourceHeight
        )

        val scaledWidth = (sourceWidth * s).toInt()
        val scaledHeight = (sourceHeight * s).toInt()

        val pX = (MODEL_INPUT_WIDTH - scaledWidth) / 2.0f
        val pY = (MODEL_INPUT_HEIGHT - scaledHeight) / 2.0f

        val scaledBitmap = Bitmap.createScaledBitmap(sourceBitmap, scaledWidth, scaledHeight, true)
        val destBitmap =
            Bitmap.createBitmap(MODEL_INPUT_WIDTH, MODEL_INPUT_HEIGHT, Bitmap.Config.ARGB_8888)

        val canvas = Canvas(destBitmap)
        canvas.drawBitmap(scaledBitmap, pX, pY, null)
        scaledBitmap.recycle() // 더 이상 필요 없는 scaledBitmap은 해제

        return PreprocessingResult(destBitmap, s, pX, pY, sourceWidth, sourceHeight)
    }

    // Bitmap을 TFLite 추론을 위한 ByteBuffer로 변환합니다.
    private fun bitmapToByteBuffer(bitmap: Bitmap): ByteBuffer {
        val byteBuffer =
            ByteBuffer.allocateDirect(1 * MODEL_INPUT_WIDTH * MODEL_INPUT_HEIGHT * 3 * 4) // NCHW, float32
        byteBuffer.order(ByteOrder.nativeOrder())
        val intValues = IntArray(MODEL_INPUT_WIDTH * MODEL_INPUT_HEIGHT)
        bitmap.getPixels(intValues, 0, bitmap.width, 0, 0, bitmap.width, bitmap.height)
        var pixel = 0
        for (i in 0 until MODEL_INPUT_HEIGHT) {
            for (j in 0 until MODEL_INPUT_WIDTH) {
                val value = intValues[pixel++]
                byteBuffer.putFloat(((value shr 16) and 0xFF) / 255.0f) // R
                byteBuffer.putFloat(((value shr 8) and 0xFF) / 255.0f)  // G
                byteBuffer.putFloat((value and 0xFF) / 255.0f)         // B
            }
        }
        byteBuffer.rewind()
        return byteBuffer
    }

    // NMS를 위한 데이터 클래스
    private data class DetectionCandidate(
        val boundingBox: RectF, // (left, top, right, bottom) - 모델 입력(640x640) 기준 좌표
        val score: Float,
        val classIndex: Int
    )

    private fun calculateIoU(box1: RectF, box2: RectF): Float {
        val xA = max(box1.left, box2.left)
        val yA = max(box1.top, box2.top)
        val xB = min(box1.right, box2.right)
        val yB = min(box1.bottom, box2.bottom)

        val intersectionArea = max(0f, xB - xA) * max(0f, yB - yA)
        val box1Area = (box1.right - box1.left) * (box1.bottom - box1.top)
        val box2Area = (box2.right - box2.left) * (box2.bottom - box2.top)
        val unionArea = box1Area + box2Area - intersectionArea

        return if (unionArea == 0f) 0f else intersectionArea / unionArea
    }

    private fun nonMaxSuppression(
        candidates: List<DetectionCandidate>,
        iouThreshold: Float
    ): List<DetectionCandidate> {
        if (candidates.isEmpty()) return emptyList()

        // 점수 기준으로 내림차순 정렬
        val sortedCandidates = candidates.sortedByDescending { it.score }
        val selectedDetections = mutableListOf<DetectionCandidate>()

        val active = BooleanArray(sortedCandidates.size) { true }
        for (i in sortedCandidates.indices) {
            if (active[i]) {
                selectedDetections.add(sortedCandidates[i])
                for (j in i + 1 until sortedCandidates.size) {
                    if (active[j]) {
                        val iou = calculateIoU(
                            sortedCandidates[i].boundingBox,
                            sortedCandidates[j].boundingBox
                        )
                        if (iou >= iouThreshold) {
                            active[j] = false
                        }
                    }
                }
            }
        }
        return selectedDetections
    }

    private fun adjustBoundingBoxToOriginal(
        bbox: RectF,
        scale: Float,
        padX: Float,
        padY: Float,
        originalWidth: Int,
        originalHeight: Int
    ): RectF {
        val left = ((bbox.left - padX) / scale).coerceIn(0f, originalWidth.toFloat())
        val top = ((bbox.top - padY) / scale).coerceIn(0f, originalHeight.toFloat())
        val right = ((bbox.right - padX) / scale).coerceIn(0f, originalWidth.toFloat())
        val bottom = ((bbox.bottom - padY) / scale).coerceIn(0f, originalHeight.toFloat())

        return RectF(left, top, right, bottom)
    }



    override fun callback(frame: Frame, arguments: Map<String, Any>?): Any? {

        val startTime = System.currentTimeMillis()
        val imageProxy = frame.image ?: run { Log.e(TAG, "Image is null"); return null }
        val sourceBitmap = imageToBitmap(imageProxy) ?: run {
            Log.e(
                TAG,
                "Bitmap conversion failed"
            ); return null
        }

        val pr = convertAndResizeBitmap(sourceBitmap)
        val processedBitmap = pr.processedBitmap
        val inputBuffer = bitmapToByteBuffer(processedBitmap)

        // 출력 텐서: float32[1, 84, 8400]
        val outputTensorRaw =
            Array(1) { Array(BBOX_COORDS + NUM_MODEL_CLASSES) { FloatArray(NUM_PREDICTIONS) } }
        val outputs = mutableMapOf<Int, Any>()
        outputs[0] = outputTensorRaw

        try {
            tflite.runForMultipleInputsOutputs(arrayOf(inputBuffer), outputs)
        } catch (e: Exception) {
            Log.e(TAG, "TFLite inference error", e)
            sourceBitmap.recycle()
            processedBitmap.recycle()
            return null
        }

        val confidenceThreshold =
            (arguments?.get("confidenceThreshold") as? Double)?.toFloat() ?: 0.5f
        val iouThreshold =
            (arguments?.get("iouThreshold") as? Double)?.toFloat() ?: 0.45f // 일반적인 IoU 임계값

        val candidates = mutableListOf<DetectionCandidate>()

        // outputTensorRaw[0]는 [84, 8400] 형태의 배열입니다.
        val predictions = outputTensorRaw[0] // [84, 8400]

        for (i in 0 until NUM_PREDICTIONS) { // 8400번 반복
            // 클래스 확률 추출 및 최대값 찾기
            var maxClassScore = 0f
            var detectedClassIndex = -1
            for (cls in 0 until NUM_MODEL_CLASSES) {
                val score = predictions[BBOX_COORDS + cls][i]
                if (score > maxClassScore) {
                    maxClassScore = score
                    detectedClassIndex = cls
                }
            }

            if (maxClassScore >= confidenceThreshold) {
                // 좌표 추출 (정규화된 값)
                val xCenterNorm = predictions[0][i]
                val yCenterNorm = predictions[1][i]
                val widthNorm = predictions[2][i]
                val heightNorm = predictions[3][i]

                // 정규화 해제 (640x640 이미지 기준)
                val xCenter = xCenterNorm * MODEL_INPUT_WIDTH
                val yCenter = yCenterNorm * MODEL_INPUT_HEIGHT
                val width = widthNorm * MODEL_INPUT_WIDTH
                val height = heightNorm * MODEL_INPUT_HEIGHT

                val left = xCenter - width / 2f
                val top = yCenter - height / 2f
                val right = xCenter + width / 2f
                val bottom = yCenter + height / 2f

                val boundingBox = RectF(left, top, right, bottom)
                // 5. 원본 이미지 기준으로 다시 조정 (scale & pad 고려)
                val calibratedBox = adjustBoundingBoxToOriginal(
                    boundingBox,
                    pr.scale,
                    pr.padX,
                    pr.padY,
                    pr.originalWidth,
                    pr.originalHeight
                )
                candidates.add(DetectionCandidate(calibratedBox, maxClassScore, detectedClassIndex))
            }
        }
        Log.d(TAG, "Candidates before NMS: ${candidates.size}")

        // NMS 적용
        val finalDetections = nonMaxSuppression(candidates, iouThreshold)
        Log.d(TAG, "Detections after NMS: ${finalDetections.size}")

        // --- 여기서부터 변경 ---
        val detectionsList = mutableListOf<Map<String, Any>>() // Use Kotlin List and Map
        for (det in finalDetections) {
            val detectionMap = mutableMapOf<String, Any>()
            detectionMap["classId"] = det.classIndex // 0-79 범위의 모델 클래스 ID

            if (det.classIndex >= 0 && det.classIndex < classNames.size) {
                detectionMap["className"] = classNames[det.classIndex]
            } else {
                detectionMap["className"] = "unknown_class_idx_${det.classIndex}"
            }

            detectionMap["confidence"] = det.score.toDouble()

            val boxMap = mutableMapOf<String, Any>()
            boxMap["x"] = det.boundingBox.left.toDouble()
            boxMap["y"] = det.boundingBox.top.toDouble()
            boxMap["width"] = det.boundingBox.width().toDouble()
            boxMap["height"] = det.boundingBox.height().toDouble()
            detectionMap["box"] = boxMap

            detectionsList.add(detectionMap)
        }

        sourceBitmap.recycle()
        processedBitmap.recycle()

        val endTime = System.currentTimeMillis()
        Log.d(
            TAG,
            "Frame processing time: ${endTime - startTime} ms (${finalDetections.size} detections)"
        )

        // Return a standard Kotlin Map
        return mapOf(
            "detections" to detectionsList,
            "scale" to pr.scale.toDouble(),
            "padX" to pr.padX.toDouble(),
            "padY" to pr.padY.toDouble(),
            "frameWidth" to pr.originalWidth,
            "frameHeight" to pr.originalHeight
        )
    }

    // imageProxyToBitmap 함수를 새로운 변환 로직으로 교체/업데이트합니다.
    private fun imageToBitmap(image: Image): Bitmap? {
        val nv21Bytes = imageProxyToNv21Bytes(image)
        if (nv21Bytes == null) {
            Log.e(TAG, "Failed to convert ImageProxy to NV21 bytes.")
            return null
        }

        val width = image.width
        val height = image.height
        val argbIntArray = IntArray(width * height)

        decodeYUV420SP(argbIntArray, nv21Bytes, width, height)

        val bitmap = Bitmap.createBitmap(width, width, Bitmap.Config.ARGB_8888) // Fix: should be width, height
        bitmap.setPixels(argbIntArray, 0, width, 0, 0, width, height)
        return bitmap
    }

    /**
     * ImageProxy (YUV_420_888 format)를 NV21 형식의 ByteArray로 변환합니다.
     * NV21: Y plane followed by interleaved VU plane.
     */
    private fun imageProxyToNv21Bytes(image: Image): ByteArray? {
        if (image.format != android.graphics.ImageFormat.YUV_420_888) {
            Log.e(TAG, "Unsupported image format for NV21 conversion: ${image.format}")
            return null
        }

        val width = image.width
        val height = image.height

        val yPlane = image.planes[0]
        val uPlane = image.planes[1]
        val vPlane = image.planes[2]

        val yBuffer: ByteBuffer = yPlane.buffer
        val uBuffer: ByteBuffer = uPlane.buffer
        val vBuffer: ByteBuffer = vPlane.buffer

        // NV21 byte array: Y plane, followed by VU plane (interleaved)
        val nv21Size = width * height + (width * height / 2) // Total size for YUV420SP
        val nv21 = ByteArray(nv21Size)

        // 1. Y 평면 복사
        val yRowStride = yPlane.rowStride
        val yPixelStride = yPlane.pixelStride // 보통 1
        var yDstOffset = 0
        if (yPixelStride == 1 && yRowStride == width) {
            // Y 평면이 완전히 채워져 있고 패딩이 없는 경우, 직접 복사
            yBuffer.get(nv21, 0, width * height)
            yDstOffset = width*height // 다음 VU 평면 시작 위치
        } else {
            // Y 평면에 패딩이 있거나 pixelStride가 1이 아닌 경우, 행 단위로 복사
            val yRowBuffer = ByteArray(width) // 한 행을 읽기 위한 임시 버퍼
            for (row in 0 until height) {
                yBuffer.position(row * yRowStride)
                yBuffer.get(yRowBuffer, 0, width) // pixelStride가 1이라고 가정
                System.arraycopy(yRowBuffer, 0, nv21, yDstOffset, width)
                yDstOffset += width
            }
        }


        // 2. VU 평면 복사 (V와 U를 인터리빙하여 VUVUVU... 순서로 저장)
        var vuOffset = width * height // Y 평면 데이터 이후 시작점
        val uRowStride = uPlane.rowStride
        val vRowStride = vPlane.rowStride
        val uPixelStride = uPlane.pixelStride // U 평면 내 U 샘플 간 간격
        val vPixelStride = vPlane.pixelStride // V 평면 내 V 샘플 간 간격

        // U와 V 평면은 Y 평면보다 해상도가 절반 (너비/2, 높이/2)
        for (row in 0 until height / 2) {
            for (col in 0 until width / 2) {
                val vBufferIndex = row * vRowStride + col * vPixelStride
                val uBufferIndex = row * uRowStride + col * uPixelStride

                if (vuOffset < nv21Size -1 && vBufferIndex < vBuffer.capacity() && uBufferIndex < uBuffer.capacity() ) {
                    nv21[vuOffset++] = vBuffer.get(vBufferIndex) // V 먼저
                    nv21[vuOffset++] = uBuffer.get(uBufferIndex) // U 다음
                } else {
                    Log.e(TAG, "Buffer overflow during VU plane copy. Skipping remaining. VUOffset: $vuOffset, NV21Size: $nv21Size")
                    return nv21 // 부분적으로 채워진 배열이라도 반환하거나, null 반환 또는 예외 처리
                }
            }
        }
        return nv21
    }

    /**
     * NV21 (YUV420SP) 형식의 byte array를 ARGB int array로 변환합니다.
     * Java 코드의 decodeYUV420SP를 Kotlin으로 번역한 것입니다.
     */
    private fun decodeYUV420SP(rgb: IntArray, yuv420sp: ByteArray, width: Int, height: Int) {
        val frameSize = width * height
        var yp = 0 // Y 평면 및 최종 RGB 배열의 인덱스
        for (j in 0 until height) { // 각 행(세로)
            var uvp = frameSize + (j shr 1) * width // 현재 행에 해당하는 UV 평면의 시작 인덱스
            var u = 0
            var v = 0
            for (i in 0 until width) { // 각 열(가로)
                var y = (0xff and yuv420sp[yp].toInt()) - 16 // Y 값 (0-255 범위로 변환 후 16 빼기)
                if (y < 0) y = 0

                // UV 값은 2x2 픽셀 블록당 하나씩 존재. 짝수번째 열에서 UV 값을 가져옴.
                if (i and 1 == 0) {
                    v = (0xff and yuv420sp[uvp++].toInt()) - 128 // V 값
                    u = (0xff and yuv420sp[uvp++].toInt()) - 128 // U 값
                }

                // YUV to RGB 변환 (정수 연산 최적화)
                val y1192 = 1192 * y
                var r = y1192 + 1634 * v
                var g = y1192 - 833 * v - 400 * u
                var b = y1192 + 2066 * u

                // 값 범위 [0, 262143] 클램핑 (중간 계산 결과)
                if (r < 0) r = 0 else if (r > 262143) r = 262143
                if (g < 0) g = 0 else if (g > 262143) g = 262143
                if (b < 0) b = 0 else if (b > 262143) b = 262143

                // 최종 RGB 값으로 변환하여 저장 (8비트 채널로 스케일링 및 패킹)
                // 0xff000000 (Alpha) | R | G | B
                rgb[yp] = (0xff000000.toInt()) or ((r shl 6) and 0xff0000) or ((g shr 2) and 0xff00) or ((b shr 10) and 0xff)
                yp++
            }
        }
    }
}