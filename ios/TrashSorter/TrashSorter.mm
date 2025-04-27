#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/FrameProcessorPluginRegistry.h>
#import <VisionCamera/VisionCameraProxyHolder.h>
#import <VisionCamera/Frame.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <CoreMedia/CoreMedia.h>
#import <onnxruntime_cxx_api.h>

@interface TrashSorterPlugin : FrameProcessorPlugin {
    Ort::Env *ortEnv;
    Ort::Session *ortSession;
    std::vector<const char*> inputNames;
    std::vector<const char*> outputNames;
}
@end

@implementation TrashSorterPlugin

- (NSString *)debugLogPath {
  NSArray* paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
  NSString* documentsDirectory = [paths objectAtIndex:0];
  return [documentsDirectory stringByAppendingPathComponent:@"onnx_debug.txt"];
}

- (void)appendDebugLog:(NSString *)log {
  NSString *logPath = [self debugLogPath];
  NSFileHandle *fileHandle = [NSFileHandle fileHandleForWritingAtPath:logPath];
  if (!fileHandle) {
    [log writeToFile:logPath atomically:YES encoding:NSUTF8StringEncoding error:nil];
  } else {
    [fileHandle seekToEndOfFile];
    NSString *line = [NSString stringWithFormat:@"%@\n", log];
    [fileHandle writeData:[line dataUsingEncoding:NSUTF8StringEncoding]];
    [fileHandle closeFile];
  }
}

#pragma mark - Public Initializers

/// VisionCamera FrameProcessor용 기본 이니셜라이저
- (instancetype)initWithProxy:(VisionCameraProxyHolder*)proxy
                  withOptions:(NSDictionary*)options {
  self = [super initWithProxy:proxy withOptions:options];
  if (self) {
    [self setupONNXSession];
  }
  return self;
}

/// ✅ 테스트 전용 이니셜라이저 (VisionCamera 필요 없음)
- (instancetype)initForTesting {
  VisionCameraProxyHolder* dummyProxy = [[VisionCameraProxyHolder alloc] init]; // Mock Proxy 생성
  self = [super initWithProxy:dummyProxy withOptions:nil];
  if (self) {
    [self setupONNXSession];
  }
  return self;
}


#pragma mark - Private Setup

/// ONNX 모델 로딩 및 세션 초기화
- (void)setupONNXSession {
  try {
    ortEnv = new Ort::Env(ORT_LOGGING_LEVEL_WARNING, "TrashSorterTest");

    Ort::SessionOptions sessionOptions;
    sessionOptions.SetIntraOpNumThreads(1);

    NSString *modelPath = [[NSBundle mainBundle] pathForResource:@"waste_classifier" ofType:@"ort"];
    if (!modelPath) {
      [self appendDebugLog:@"❌ Model not found!"];
      return;
    }

    ortSession = new Ort::Session(*ortEnv, [modelPath UTF8String], sessionOptions);

    Ort::AllocatorWithDefaultOptions allocator;

    auto inputNamePtr = ortSession->GetInputNameAllocated(0, allocator);
    auto outputNamePtr = ortSession->GetOutputNameAllocated(0, allocator);

    inputNames = {strdup(inputNamePtr.get())};
    outputNames = {strdup(outputNamePtr.get())};

    [self appendDebugLog:@"✅ TrashSorterPlugin ONNX session initialized!"];
  }
  catch (const Ort::Exception& e) {
    NSLog(@"❌ ONNX Error: %s", e.what());
    [self appendDebugLog:[NSString stringWithFormat:@"✅ ONNX Error: %s", e.what()]];

    ortSession = nullptr;
    ortEnv = nullptr;
  }
}
#pragma mark - SampleBuffer -> PixelBuffer 변환

- (CVPixelBufferRef _Nullable)pixelBufferFromSampleBuffer:(CMSampleBufferRef)sampleBuffer {
  if (sampleBuffer == nil) {
    NSLog(@"❌ sampleBuffer is nil.");
    return nil;
  }

  CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(sampleBuffer);
  if (pixelBuffer == nil) {
    NSLog(@"❌ Failed to get pixelBuffer from sampleBuffer.");
    return nil;
  }

  // retain 없이 바로 반환해도 OK (CMSampleBuffer 내부 관리)
  return pixelBuffer;
}
#pragma mark - PixelBuffer -> UIImage 변환

- (UIImage* _Nullable)uiImageFromPixelBuffer:(CVPixelBufferRef)pixelBuffer {
  if (pixelBuffer == nil) {
    NSLog(@"❌ pixelBuffer is nil.");
    return nil;
  }

  CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

  size_t width = CVPixelBufferGetWidth(pixelBuffer);
  size_t height = CVPixelBufferGetHeight(pixelBuffer);
  uint8_t* baseAddress = (uint8_t*)CVPixelBufferGetBaseAddress(pixelBuffer);
  size_t bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);

  CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
  CGContextRef context = CGBitmapContextCreate(
    baseAddress,
    width,
    height,
    8,
    bytesPerRow,
    colorSpace,
    kCGImageAlphaPremultipliedFirst | kCGBitmapByteOrder32Little
  );

  if (context == nil) {
    NSLog(@"❌ Failed to create CGContext.");
    CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
    CGColorSpaceRelease(colorSpace);
    return nil;
  }

  CGImageRef quartzImage = CGBitmapContextCreateImage(context);
  UIImage* image = [UIImage imageWithCGImage:quartzImage];

  // Clean up
  CGImageRelease(quartzImage);
  CGContextRelease(context);
  CGColorSpaceRelease(colorSpace);
  CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

  return image;
}

- (std::vector<float>)floatBufferFromUIImage:(UIImage *)image {
    // 이미지 리사이징 (224x224)
    CGSize size = CGSizeMake(224, 224);
    UIGraphicsBeginImageContextWithOptions(size, YES, 1.0);
    [image drawInRect:CGRectMake(0, 0, size.width, size.height)];
    UIImage *resizedImage = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();
    
    // CGImage 획득
    CGImageRef cgImage = resizedImage.CGImage;
    
    // RGB 픽셀 데이터 추출
    size_t width = CGImageGetWidth(cgImage);
    size_t height = CGImageGetHeight(cgImage);
    size_t bitsPerComponent = 8;
    size_t bytesPerRow = width * 4;
    
    uint8_t *rawData = (uint8_t *)calloc(height * width * 4, sizeof(uint8_t));
    CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
    CGContextRef context = CGBitmapContextCreate(rawData, width, height, bitsPerComponent, bytesPerRow, colorSpace, kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big);
    CGContextDrawImage(context, CGRectMake(0, 0, width, height), cgImage);
    
    // 픽셀 데이터를 float 배열로 변환 (RGB 채널)
    std::vector<float> floatArray(3 * width * height);
    
    // 픽셀 값 정규화 (0-255 -> 0-1)
    for (int y = 0; y < height; y++) {
        for (int x = 0; x < width; x++) {
            int offset = (y * width + x) * 4;
            // R, G, B 채널 (0-1 범위로 정규화)
            floatArray[y * width + x] = rawData[offset] / 255.0f;                   // R
            floatArray[width * height + y * width + x] = rawData[offset + 1] / 255.0f;  // G
            floatArray[2 * width * height + y * width + x] = rawData[offset + 2] / 255.0f; // B
        }
    }
    
    // 메모리 해제
    free(rawData);
    CGContextRelease(context);
    CGColorSpaceRelease(colorSpace);
    
    return floatArray;
}


#pragma mark - 공통 추론 함수

- (NSNumber* _Nullable)runInferenceWithUIImage:(UIImage*)image {
  try {
    if (!ortSession) {
      NSLog(@"Session is not initilized!");
      [self appendDebugLog:@"❌ ONNX Session isn't initialized!"];
      return nil;
    }

      // UIImage에서 float 벡터 생성
      std::vector<float> inputTensorValues = [self floatBufferFromUIImage:image];
    [self appendDebugLog:[NSString stringWithFormat:@"✅ inputTesorValues size: %zu", inputTensorValues.size()]];

      
      // 입력 텐서 크기 및 정보 설정
      std::vector<int64_t> inputDims = {1, 3, 224, 224};  // 배치, 채널, 높이, 너비
      
      // 메모리 정보
      Ort::MemoryInfo memoryInfo = Ort::MemoryInfo::CreateCpu(OrtArenaAllocator, OrtMemTypeDefault);
    [self appendDebugLog:[NSString stringWithFormat:@"✅ memory created: %s", memoryInfo.GetConst().GetAllocatorName().c_str()]];
      // 입력 텐서 생성
      Ort::Value inputTensor = Ort::Value::CreateTensor<float>(
          memoryInfo,
          inputTensorValues.data(),
          inputTensorValues.size(),
          inputDims.data(),
          inputDims.size()
      );
    [self appendDebugLog:[NSString stringWithFormat:@"✅ inputTensor created. isTensor: %b", inputTensor.GetConst().IsTensor()]];
    [self appendDebugLog:@"🚀 Running Inference... "];

      
      // 모델 실행
      std::vector<Ort::Value> outputTensors = ortSession->Run(
          Ort::RunOptions{nullptr},
          inputNames.data(),
          &inputTensor,
          1,
          outputNames.data(),
          1
      );
    [self appendDebugLog:@"✅ Inference done!"];

      
      // 결과 처리
      float* outputData = outputTensors[0].GetTensorMutableData<float>();
    [self appendDebugLog:[NSString stringWithFormat:@"✅ outputData size: %lu", sizeof outputData]];

      
      // 텐서 정보 가져오기
      Ort::TypeInfo typeInfo = outputTensors[0].GetTypeInfo();
    [self appendDebugLog:@"✅ typeInfo done!"];


      const Ort::ConstTensorTypeAndShapeInfo tensorInfo = typeInfo.GetTensorTypeAndShapeInfo();
    [self appendDebugLog:@"✅ tensorInfo done!"];

      std::vector<int64_t> outputDims = tensorInfo.GetShape();
    [self appendDebugLog:[NSString stringWithFormat:@"✅ GetShape done! size: %lu", outputDims.size()]];

      size_t outputSize = 1;
      for (size_t i = 0; i < outputDims.size(); i++) {
          if (outputDims[i] > 0) {
              outputSize *= outputDims[i];
          }
      }
    
    [self appendDebugLog:[NSString stringWithFormat:@"✅ outputSize: %lu", outputSize]];

      
      // 최대값과 해당 인덱스 찾기
      int maxIndex = -1;
      float maxValue = -std::numeric_limits<float>::max();
      
      for (size_t i = 0; i < outputSize; i++) {
          if (outputData[i] > maxValue) {
              maxValue = outputData[i];
              maxIndex = static_cast<int>(i);
          }
      }
      
      // 인덱스 반환
    [self appendDebugLog:[NSString stringWithFormat:@"✅ Prediction: %d", maxIndex]];

      return @(maxIndex);
  }
  catch (const Ort::Exception& e) {
      NSLog(@"ONNX Runtime Error during inference: %s", e.what());
      return nil;
  }
  catch (const std::exception& e) {
      NSLog(@"Standard exception during inference: %s", e.what());
      return nil;
  }
  catch (...) {
      NSLog(@"Unknown error during inference");
      return nil;
  }
  
}

#pragma mark - VisionCamera Frame에서 호출

- (NSNumber* _Nullable)callback:(Frame* _Nonnull)frame withArguments:(NSDictionary* _Nullable)arguments {
  CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
  [self appendDebugLog:@"✅ PixelBuffer taken from SampleBuffer OK"];
  UIImage* image = [self uiImageFromPixelBuffer:pixelBuffer];
  [self appendDebugLog:@"✅ UIImage from PixelBuffer OK"];
  if (!pixelBuffer) {
    [self appendDebugLog:@"❌ pixelBuffer is nil."];
    return nil;
  }
  [self appendDebugLog:@"🚀 Running inference with UIImage! "];
  return [self runInferenceWithUIImage:image];
}





- (void)dealloc {
  // 리소스 정리
    for (auto ptr : inputNames) if (ptr) free((void*)ptr);
    for (auto ptr : outputNames) if (ptr) free((void*)ptr);

    
    if (ortSession) {
        delete ortSession;
        ortSession = nullptr;
    }
    if (ortEnv) {
        delete ortEnv;
        ortEnv = nullptr;
    }
    
}

VISION_EXPORT_FRAME_PROCESSOR(TrashSorterPlugin, runWasteClassifier)

@end
