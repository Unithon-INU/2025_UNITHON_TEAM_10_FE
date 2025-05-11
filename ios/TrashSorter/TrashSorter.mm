#import <VisionCamera/FrameProcessorPlugin.h>
#import <VisionCamera/VisionCameraProxyHolder.h>
#import <VisionCamera/Frame.h>
#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import <CoreMedia/CoreMedia.h>

#import <Foundation/Foundation.h>
#import <CoreML/CoreML.h>
#import <CoreVideo/CoreVideo.h>
#import "Yolo11N.h"

@interface TrashSorterPlugin : FrameProcessorPlugin {
    Yolo11N *model;
    NSArray<NSString *> *classNames;
    CIContext *ciContext;

}
@end

@implementation TrashSorterPlugin

#pragma mark - Image Processing
- (CVPixelBufferRef)convertAndResizePixelBuffer:(CVPixelBufferRef)sourceBuffer
                                       outScale:(float *)scale
                                       outPadX:(float *)padX
                                       outPadY:(float *)padY
                                       outWidth:(size_t *)originalWidth
                                       outHeight:(size_t *)originalHeight {
    size_t sourceWidth = CVPixelBufferGetWidth(sourceBuffer);
    size_t sourceHeight = CVPixelBufferGetHeight(sourceBuffer);

    if (originalWidth) *originalWidth = sourceWidth;
    if (originalHeight) *originalHeight = sourceHeight;

    float s = MIN(640.0 / sourceWidth, 640.0 / sourceHeight);
    if (scale) *scale = s;

    float scaledWidth = sourceWidth * s;
    float scaledHeight = sourceHeight * s;

    float pX = (640.0 - scaledWidth) / 2.0;
    float pY = (640.0 - scaledHeight) / 2.0;
    if (padX) *padX = pX;
    if (padY) *padY = pY;


    OSType sourcePixelFormat = CVPixelBufferGetPixelFormatType(sourceBuffer);
    
    CIImage *ciImage = [CIImage imageWithCVPixelBuffer:sourceBuffer];
    // Resize
    ciImage = [ciImage imageByApplyingTransform:CGAffineTransformMakeScale(s,s)];
    ciImage = [ciImage imageByApplyingTransform:CGAffineTransformMakeTranslation(pX, pY)];

    // Destination buffer
    CVPixelBufferRef destPixelBuffer = NULL;
    NSDictionary *attrs = @{
        (id)kCVPixelBufferCGImageCompatibilityKey: @YES,
        (id)kCVPixelBufferCGBitmapContextCompatibilityKey: @YES
    };
    
    CVPixelBufferCreate(kCFAllocatorDefault,
                        640, 640,
                        kCVPixelFormatType_32BGRA,
                        (__bridge CFDictionaryRef)attrs,
                        &destPixelBuffer);
    
    [self->ciContext render:ciImage toCVPixelBuffer:destPixelBuffer];


    return destPixelBuffer;
}

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

        NSLog(@"🔍 Processing frame: %zu x %zu",
              CVPixelBufferGetWidth(pixelBuffer),
              CVPixelBufferGetHeight(pixelBuffer));
      
        float scale, padX, padY;
        size_t originalWidth, originalHeight;


      CVPixelBufferRef processedBuffer = [self convertAndResizePixelBuffer:pixelBuffer
                                                                  outScale:&scale
                                                                   outPadX:&padX
                                                                   outPadY:&padY
                                                                 outWidth:&originalWidth
                                                                outHeight:&originalHeight];
        if (!processedBuffer) {
            NSLog(@"❌ Failed to process image");
            return nil;
        }

        float iouThreshold = 0.5;
        float confidenceThreshold = 0.5;
        if (arguments != nil) {
            if (arguments[@"iouThreshold"] != nil)
                iouThreshold = [arguments[@"iouThreshold"] floatValue];
            if (arguments[@"confidenceThreshold"] != nil)
                confidenceThreshold = [arguments[@"confidenceThreshold"] floatValue];
        }

        NSError *error = nil;
        Yolo11NInput *input = [[Yolo11NInput alloc] initWithImage:processedBuffer
                                                      iouThreshold:iouThreshold
                                              confidenceThreshold:confidenceThreshold];

        Yolo11NOutput *output = [model predictionFromFeatures:input error:&error];

        // ✅ 해제: processedBuffer
        CVPixelBufferRelease(processedBuffer);
        processedBuffer = NULL;

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
                NSArray<NSNumber *> *xIndices = @[@(i), @(0)];
                NSArray<NSNumber *> *yIndices = @[@(i), @(1)];
                NSArray<NSNumber *> *wIndices = @[@(i), @(2)];
                NSArray<NSNumber *> *hIndices = @[@(i), @(3)];

              float xCenter = [coordinates[xIndices] floatValue];
              float yCenter = [coordinates[yIndices] floatValue];
              float width = [coordinates[wIndices] floatValue];
              float height = [coordinates[hIndices] floatValue];

              // 이미 절대값이라면 그대로 사용
              float left = (xCenter) - width / 2.0;
              float top = (yCenter) - height / 2.0; // yCenter만 정규화 상태니까 곱해줌

  

                NSDictionary *detection =
              @{
                    @"classId": @(classIdx),
                    @"confidence": @(maxConfidence),
                    @"box": @{
                        @"x": @(left),
                        @"y": @(top),
                        @"width": @(width),
                        @"height": @(height)
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
        @"frameWidth": @(originalWidth),
        @"frameHeight": @(originalHeight)
      };
    }
}


VISION_EXPORT_FRAME_PROCESSOR(TrashSorterPlugin, runWasteClassifier)

@end
