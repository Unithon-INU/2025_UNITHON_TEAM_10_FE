#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/VisionCameraProxyHolder.h>
#import <VisionCamera/Frame.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h> // UIImageOrientation을 사용하기 위함
#import <CoreMedia/CoreMedia.h>
#import <CoreML/CoreML.h>
#import <CoreVideo/CoreVideo.h>
#import <CoreImage/CoreImage.h> // CIImage 및 CIContext
#import "Yolo11N.h"

@interface TrashSorterPlugin : FrameProcessorPlugin {
    Yolo11N *model;
    CIContext *ciContext;
}
@end

@implementation TrashSorterPlugin

#pragma mark - Debug Helpers

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

#pragma mark - Init

- (instancetype)initWithProxy:(VisionCameraProxyHolder*)proxy withOptions:(NSDictionary*)options {
    self = [super initWithProxy:proxy withOptions:options];
    if (self) {
        [self setupModel];
    }
    return self;
}

- (instancetype)initForTesting {
    VisionCameraProxyHolder* dummyProxy = [[VisionCameraProxyHolder alloc] init];
    self = [super initWithProxy:dummyProxy withOptions:nil];
    if (self) {
        [self setupModel];
    }
    return self;
}

#pragma mark - Model Setup

- (void)setupModel {
    NSError *error = nil;
    model = [[Yolo11N alloc] init];
    
    if (!model) {
        NSLog(@"[TrashSorterPlugin] Failed to initialize Yolo11N model: %@", error);
        return;
    }
    // CIContext는 스레드-세이프하지 않으므로, 각 프레임 처리 호출마다 새 컨텍스트를 생성하거나,
    // 단일 컨텍스트를 사용한다면 동기화 메커니즘을 사용해야 하지만, 여기서는 단순화를 위해 전역으로 유지
    self->ciContext = [CIContext contextWithOptions:nil];
    
    NSLog(@"✅ Yolo11N model initialized successfully");
}

#pragma mark - Frame Processing

- (id _Nullable)callback:(Frame* _Nonnull)frame withArguments:(NSDictionary* _Nullable)arguments {
    @autoreleasepool {
        CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
        if (!pixelBuffer) {
            [self appendDebugLog:@"❌ Null pixel buffer received"];
            return nil;
        }

        // VisionCamera 문서에 따라 Frame.orientation을 사용하여 CIImage를 올바르게 회전시킵니다.
        // Frame.orientation은 UIImageOrientation 열거형 값을 반환합니다.
        CIImage *ciImage = [CIImage imageWithCVPixelBuffer:pixelBuffer];
        
        // MLKit 예시처럼 frame.orientation을 사용하여 CIImage의 방향을 설정합니다.
        // CIImage는 UIImageOrientation 값을 이해하고 자동으로 변환을 적용합니다.
//        if (frame.orientation != UIImageOrientationUp) { // 기본 방향이 아니면 회전 적용
      
//        }

        // [추가] 항상 세로로 가정하고 -90도 회전
        CGAffineTransform rotateToPortrait = CGAffineTransformMakeRotation(-M_PI_2);
        ciImage = [ciImage imageByApplyingTransform:rotateToPortrait];
        
        // 이 시점에서 ciImage.extent.size는 프레임의 '유효한(up-right)' 너비와 높이를 나타냅니다.
        // 예를 들어, 1920x1080 (가로) 센서에서 세로 모드(Portrait)로 찍었다면,
        // ciImage.extent.size.width는 1080이 되고, ciImage.extent.size.height는 1920이 됩니다.
        size_t originalWidth = ciImage.extent.size.width;
        size_t originalHeight = ciImage.extent.size.height;
        
        NSLog(@"🔍 Processing frame - Rotated frame: %zu x %zu (Sensor Raw: %zu x %zu), Orientation: %ld",
              originalWidth, originalHeight,
              CVPixelBufferGetWidth(pixelBuffer), CVPixelBufferGetHeight(pixelBuffer),
              (long)frame.orientation); // 디버깅을 위해 orientation 값 로깅

      
        // 640x640 모델 입력 크기에 맞춰 스케일 및 패딩 계산
        float scale, padX, padY;
        
        // Calculate scale factor (aspect fit to 640x640)
        // 이제 originalWidth와 originalHeight는 회전이 적용된 실제 이미지의 유효한 크기입니다.
        float s = MIN(640.0 / originalWidth, 640.0 / originalHeight);
        scale = s;

        float scaledWidth = originalWidth * s;
        float scaledHeight = originalHeight * s;

        // Calculate padding to center the image
        padX = (640.0 - scaledWidth) / 2.0;
        padY = (640.0 - scaledHeight) / 2.0;
      
      CGAffineTransform translate = CGAffineTransformMakeTranslation(padX, padY);
      CGAffineTransform scaleTransform = CGAffineTransformMakeScale(scale, scale);
      float shiftX = 0;
      float shiftY = 640;  // 음수 y 좌표를 보정하기 위한 이동

      // 기존 transform에 추가 translate 적용
      CGAffineTransform fixTransform = CGAffineTransformMakeTranslation(shiftX, shiftY);
      
      // translate 후 scale 적용
      CGAffineTransform transform = CGAffineTransformConcat(scaleTransform, translate);
      transform = CGAffineTransformConcat(transform, fixTransform);
        // 하나로 적용
        ciImage = [ciImage imageByApplyingTransform:transform];
      
      NSLog(@"Transformed CIImage extent: %@", NSStringFromCGRect(ciImage.extent));

   
      
      
      CIContext *context = [CIContext contextWithOptions:nil];
      CGRect extent = [ciImage extent];
      CGImageRef cgImage = [context createCGImage:ciImage fromRect:extent];
      UIImage *uiImage = [UIImage imageWithCGImage:cgImage];
      NSData *data = UIImagePNGRepresentation(uiImage);
      
      NSArray* paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
      NSString* documentsDirectory = [paths objectAtIndex:0];
      NSString* yourFilePath =  [documentsDirectory stringByAppendingPathComponent:@"output.png"];

      [data writeToFile:yourFilePath atomically:YES];
      CGImageRelease(cgImage);
      
      


        // Destination buffer (640x640 for CoreML model input)
        CVPixelBufferRef destPixelBuffer = NULL;
        NSDictionary *attrs = @{
            (id)kCVPixelBufferCGImageCompatibilityKey: @YES,
            (id)kCVPixelBufferCGBitmapContextCompatibilityKey: @YES
        };
        
        CVReturn status = CVPixelBufferCreate(kCFAllocatorDefault,
                                              640, 640,
                                              kCVPixelFormatType_32BGRA, // 모델이 요구하는 픽셀 포맷
                                              (__bridge CFDictionaryRef)attrs,
                                              &destPixelBuffer);
        if (status != kCVReturnSuccess) {
            NSLog(@"Failed to create CVPixelBuffer: %d", status);
            return NULL;
        }
        
        [self->ciContext render:ciImage toCVPixelBuffer:destPixelBuffer];

        float iouThreshold = 0.5;
        float confidenceThreshold = 0.5;
        if (arguments != nil) {
            if (arguments[@"iouThreshold"] != nil)
                iouThreshold = [arguments[@"iouThreshold"] floatValue];
            if (arguments[@"confidenceThreshold"] != nil)
                confidenceThreshold = [arguments[@"confidenceThreshold"] floatValue];
        }

        NSError *error = nil;
        Yolo11NInput *input = [[Yolo11NInput alloc] initWithImage:destPixelBuffer
                                                     iouThreshold:iouThreshold
                                              confidenceThreshold:confidenceThreshold];

        Yolo11NOutput *output = [model predictionFromFeatures:input error:&error];

        // ✅ 해제: destPixelBuffer (processedBuffer 역할)
        CVPixelBufferRelease(destPixelBuffer);
        destPixelBuffer = NULL;

        if (error || !output) {
            [self appendDebugLog:[NSString stringWithFormat:@"❌ Prediction failed: %@", error]];
            NSLog(@"[TrashSorterPlugin] Prediction failed: %@", error);
            return nil;
        }

        MLMultiArray *coordinates = output.coordinates;
        MLMultiArray *confidence = output.confidence;

        if (!coordinates || !confidence) {
            [self appendDebugLog:@"❌ Invalid prediction output"];
            return nil;
        }

        NSUInteger boxCount = coordinates.shape[0].unsignedIntegerValue;
        NSUInteger classCount = confidence.shape[1].unsignedIntegerValue;
        NSMutableArray *results = [NSMutableArray array];

        for (NSUInteger i = 0; i < boxCount; i++) {
            float maxConfidence = 0;
            NSUInteger classIdx = 0;

            for (NSUInteger c = 0; c < classCount; c++) {
                NSArray<NSNumber *> *confIndices = @[@(i), @(c)];
                float conf = [confidence[confIndices] floatValue];
                if (conf > maxConfidence) {
                    maxConfidence = conf;
                    classIdx = c;
                }
            }

            if (maxConfidence >= confidenceThreshold) {
                // CoreML 모델에서 나온 좌표 (640x640 기준 0.0~1.0 상대좌표로 가정)
                NSArray<NSNumber *> *xIndices = @[@(i), @(0)];
                NSArray<NSNumber *> *yIndices = @[@(i), @(1)];
                NSArray<NSNumber *> *wIndices = @[@(i), @(2)];
                NSArray<NSNumber *> *hIndices = @[@(i), @(3)];

                float xCenterNormalized = [coordinates[xIndices] floatValue]; // 0.0 ~ 1.0
                float yCenterNormalized = [coordinates[yIndices] floatValue]; // 0.0 ~ 1.0
                float widthNormalized = [coordinates[wIndices] floatValue];   // 0.0 ~ 1.0
                float heightNormalized = [coordinates[hIndices] floatValue]; // 0.0 ~ 1.0

                // 1. 모델이 뱉는 0~1 상대좌표를 640x640 픽셀 기준 절대 좌표로 변환
                float xCenter640Pixel = xCenterNormalized * 640.0;
                float yCenter640Pixel = yCenterNormalized * 640.0;
                float width640Pixel = widthNormalized * 640.0;
                float height640Pixel = heightNormalized * 640.0;
                
                // 2. 패딩 제거 (640x640 캔버스 내에서 실제 이미지가 있는 부분으로 좌표 이동)
                float unpaddedXCenter = xCenter640Pixel - padX;
                float unpaddedYCenter = yCenter640Pixel - padY;
                
                // 3. 스케일링 되돌리기 (원본 이미지 픽셀 크기로 변환)
                // 이제 originalWidth와 originalHeight는 이미 회전이 적용된 유효한 너비/높이입니다.
                // 따라서 좌표도 그에 맞춰 변환됩니다.
                float originalPixelXCenter = unpaddedXCenter / scale;
                float originalPixelYCenter = unpaddedYCenter / scale;
                float originalPixelWidth = width640Pixel / scale;
                float originalPixelHeight = height640Pixel / scale;
                
                // 4. 원본 프레임 너비/높이 기준 0.0~1.0 상대 좌표로 변환
                float relativeXCenter = originalPixelXCenter / originalWidth;
                float relativeYCenter = originalPixelYCenter / originalHeight;
                float relativeWidth = originalPixelWidth / originalWidth;
                float relativeHeight = originalPixelHeight / originalHeight;
                
                NSDictionary *detection =
                    @{
                        @"classId": @(classIdx),
                        @"confidence": @(maxConfidence),
                        @"box": @{
                            @"x": @(relativeXCenter),
                            @"y": @(relativeYCenter),
                            @"width": @(relativeWidth),
                            @"height": @(relativeHeight)
                        }
                    };
                [results addObject:detection];
            }
        }

        // ✅ 해제: CoreML 객체 nil 처리
        coordinates = nil;
        confidence = nil;
        output = nil;
        input = nil;

        return  @{
            @"detections": results,
            @"scale": @(scale),
            @"padX": @(padX),
            @"padY": @(padY),
            @"frameWidth": @(originalWidth), // 회전이 적용된 유효 너비
            @"frameHeight": @(originalHeight) // 회전이 적용된 유효 높이
        };
    }
}

VISION_EXPORT_FRAME_PROCESSOR(TrashSorterPlugin, detect)

@end
