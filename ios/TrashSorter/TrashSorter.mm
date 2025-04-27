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
        [self setupONNXSession];
    }
    return self;
}

- (instancetype)initForTesting {
    VisionCameraProxyHolder* dummyProxy = [[VisionCameraProxyHolder alloc] init];
    self = [super initWithProxy:dummyProxy withOptions:nil];
    if (self) {
        [self setupONNXSession];
    }
    return self;
}

#pragma mark - ONNX Setup

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
    } catch (const Ort::Exception& e) {
        [self appendDebugLog:[NSString stringWithFormat:@"❌ ONNX Error: %s", e.what()]];
        ortSession = nullptr;
        ortEnv = nullptr;
    }
}

#pragma mark - Image Handling

- (UIImage* _Nullable)uiImageFromPixelBuffer:(CVPixelBufferRef)pixelBuffer {
    if (!pixelBuffer) {
        [self appendDebugLog:@"❌ pixelBuffer is nil"];
        return nil;
    }

    OSType format = CVPixelBufferGetPixelFormatType(pixelBuffer);
    [self appendDebugLog:[NSString stringWithFormat:@"📸 PixelFormat: %u", format]];

    if (format == kCVPixelFormatType_32BGRA) {
        // ✅ BGRA → 그대로 변환
        CVPixelBufferLockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

        size_t width = CVPixelBufferGetWidth(pixelBuffer);
        size_t height = CVPixelBufferGetHeight(pixelBuffer);
        uint8_t* baseAddress = (uint8_t*)CVPixelBufferGetBaseAddress(pixelBuffer);
        size_t bytesPerRow = CVPixelBufferGetBytesPerRow(pixelBuffer);

        CGColorSpaceRef colorSpace = CGColorSpaceCreateDeviceRGB();
        CGContextRef context = CGBitmapContextCreate(baseAddress, width, height, 8, bytesPerRow, colorSpace, kCGImageAlphaPremultipliedFirst | kCGBitmapByteOrder32Little);

        if (!context) {
            CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);
            CGColorSpaceRelease(colorSpace);
            [self appendDebugLog:@"❌ Failed to create CGContext (BGRA path)"];
            return nil;
        }

        CGImageRef cgImage = CGBitmapContextCreateImage(context);
        UIImage* image = [UIImage imageWithCGImage:cgImage];

        CGImageRelease(cgImage);
        CGContextRelease(context);
        CGColorSpaceRelease(colorSpace);
        CVPixelBufferUnlockBaseAddress(pixelBuffer, kCVPixelBufferLock_ReadOnly);

        return image;
    } else if (format == kCVPixelFormatType_420YpCbCr8BiPlanarFullRange ||
               format == kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange) {
        // ✅ YUV420 → CoreImage 변환
        CIImage *ciImage = [CIImage imageWithCVPixelBuffer:pixelBuffer];
        if (!ciImage) {
            [self appendDebugLog:@"❌ Failed to create CIImage from YUV pixel buffer"];
            return nil;
        }
        CIContext *temporaryContext = [CIContext contextWithOptions:nil];
        CGImageRef cgImage = [temporaryContext createCGImage:ciImage fromRect:CGRectMake(0, 0, CVPixelBufferGetWidth(pixelBuffer), CVPixelBufferGetHeight(pixelBuffer))];
        UIImage *image = [UIImage imageWithCGImage:cgImage];
        CGImageRelease(cgImage);
        return image;
    } else {
        [self appendDebugLog:[NSString stringWithFormat:@"❌ Unsupported pixel format: %u", format]];
        return nil;
    }
}


- (std::vector<float>)floatBufferFromUIImage:(UIImage *)image {
    CGSize size = CGSizeMake(224, 224);
    UIGraphicsBeginImageContextWithOptions(size, YES, 1.0);
    [image drawInRect:CGRectMake(0, 0, size.width, size.height)];
    UIImage *resizedImage = UIGraphicsGetImageFromCurrentImageContext();
    UIGraphicsEndImageContext();

    CGImageRef cgImage = resizedImage.CGImage;
    size_t width = CGImageGetWidth(cgImage);
    size_t height = CGImageGetHeight(cgImage);

    uint8_t* rawData = (uint8_t*)calloc(height * width * 4, sizeof(uint8_t));
    CGContextRef context = CGBitmapContextCreate(rawData, width, height, 8, width * 4, CGColorSpaceCreateDeviceRGB(), kCGImageAlphaPremultipliedLast | kCGBitmapByteOrder32Big);
    CGContextDrawImage(context, CGRectMake(0, 0, width, height), cgImage);

    std::vector<float> floatArray(3 * width * height);
    for (size_t y = 0; y < height; y++) {
        for (size_t x = 0; x < width; x++) {
            size_t pixelIndex = (y * width + x) * 4;
            float r = rawData[pixelIndex] / 255.0f;
            float g = rawData[pixelIndex + 1] / 255.0f;
            float b = rawData[pixelIndex + 2] / 255.0f;
            size_t idx = y * width + x;
            floatArray[idx] = r;
            floatArray[width * height + idx] = g;
            floatArray[2 * width * height + idx] = b;
        }
    }

    free(rawData);
    CGContextRelease(context);

    NSMutableString* debugString = [NSMutableString stringWithString:@"🔍 Input floatBuffer sample: "];
    for (int i = 0; i < 10 && i < floatArray.size(); i++) {
        [debugString appendFormat:@"%.3f ", floatArray[i]];
    }
    [self appendDebugLog:debugString];

    return floatArray;
}

#pragma mark - Inference

- (NSNumber* _Nullable)runInferenceWithUIImage:(UIImage*)image {
    try {
        if (!ortSession) return nil;

        std::vector<float> inputTensorValues = [self floatBufferFromUIImage:image];
        std::vector<int64_t> inputDims = {1, 3, 224, 224};

        Ort::MemoryInfo memoryInfo = Ort::MemoryInfo::CreateCpu(OrtArenaAllocator, OrtMemTypeDefault);
        Ort::Value inputTensor = Ort::Value::CreateTensor<float>(memoryInfo, inputTensorValues.data(), inputTensorValues.size(), inputDims.data(), inputDims.size());

        auto outputTensors = ortSession->Run(Ort::RunOptions{nullptr}, inputNames.data(), &inputTensor, 1, outputNames.data(), 1);
        float* outputData = outputTensors[0].GetTensorMutableData<float>();

        NSMutableString* outputString = [NSMutableString stringWithString:@"🔍 Output raw values: "];
        size_t outputSize = outputTensors[0].GetTensorTypeAndShapeInfo().GetElementCount();
        int maxIndex = -1;
        float maxVal = -std::numeric_limits<float>::max();

        for (size_t i = 0; i < outputSize; i++) {
            if (i < 10) {
                [outputString appendFormat:@"%.3f ", outputData[i]];
            }
            if (outputData[i] > maxVal) {
                maxVal = outputData[i];
                maxIndex = (int)i;
            }
        }

        [self appendDebugLog:outputString];
        [self appendDebugLog:[NSString stringWithFormat:@"🧠 Prediction: %d (%.3f)", maxIndex, maxVal]];

        return @(maxIndex);
    } catch (...) {
        [self appendDebugLog:@"❌ Inference failed!"];
        return nil;
    }
}

#pragma mark - Frame Callback

- (NSNumber* _Nullable)callback:(Frame* _Nonnull)frame withArguments:(NSDictionary* _Nullable)arguments {
    CVPixelBufferRef pixelBuffer = CMSampleBufferGetImageBuffer(frame.buffer);
    [self appendDebugLog:[NSString stringWithFormat:@"🔍 Frame received: %zu x %zu", CVPixelBufferGetWidth(pixelBuffer), CVPixelBufferGetHeight(pixelBuffer)]];

    UIImage* image = [self uiImageFromPixelBuffer:pixelBuffer];
    if (!image) {
        [self appendDebugLog:@"❌ UIImage conversion failed."];
        return nil;
    }

    return [self runInferenceWithUIImage:image];
}

#pragma mark - Dealloc

- (void)dealloc {
    for (auto ptr : inputNames) if (ptr) free((void*)ptr);
    for (auto ptr : outputNames) if (ptr) free((void*)ptr);
    if (ortSession) delete ortSession;
    if (ortEnv) delete ortEnv;
}

VISION_EXPORT_FRAME_PROCESSOR(TrashSorterPlugin, runWasteClassifier)

@end
