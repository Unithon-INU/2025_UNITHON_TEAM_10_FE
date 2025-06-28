-----

# 비저닝 모델

이 문서는 프로젝트에서 사용되는 비저닝 모델의 개요와 입출력 구조, 학습 환경 설정 및 모델 내보내기 방법에 대해 설명합니다.

-----

## 모델 개요

현재 [**YOLOv11n 모델**](https://www.google.com/search?q=https://docs.ultralytics.com/models/yolo11/%23supported-tasks-and-modes)을 CoreML/TFLite 환경에 맞게 최적화하여 테스트 중입니다. 이 모델은 객체 탐지를 위해 roboflow에 있는 데이터에 자체적으로 구축한 한국형 배출물 데이터를 추가해 학습시켰습니다.

-----

## 입출력 구조

### 입력

모델의 입력은 **(1, 3, 640, 640) 크기의 RGB 이미지**입니다. 이는 단일 이미지에 대한 추론을 위한 규격이며, 이미지의 채널은 RGB 순서로 구성됩니다.

### 출력

모델의 출력은 **(1, 11, n) 크기의 텐서**입니다. 이 텐서는 n개의 박스를 생성하며, Non-Max Suppression을 거친 소수의 박스들만 출력합니다.

각 후보는 다음과 같이 84개의 요소를 가집니다.

  * **`x, y, w, h`**: 검출된 객체의 중심 좌표 (x, y)와 너비 (w), 높이 (h)를 나타냅니다.
  * **`클래스별 확률 7개`**: 7가지 클래스 각각에 대한 확률 값입니다.

즉, 출력 텐서는 `[[[x, y, w, h, 클래스별확률7개...], [x, y, w, h, 클래스별확률7개...], ...나머지n개후보]]` 와 같은 구조를 가집니다. 이는 **8400개의 검출 후보 각각이 위치 정보와 80가지 클래스에 대한 확률을 모두 포함**하고 있음을 의미합니다.

-----

## 학습 환경 설정

모델 학습 환경은 **Ultralytics 라이브러리**를 통해 빠르고 간편하게 설정할 수 있습니다. 다음 명령어를 사용하여 설치하세요.

```bash
pip install ultralytics
```

-----

## 모델 불러오기 및 내보내기 (Export)

> 테스트는 Apple Silicon 로컬환경에서 Anaconda + [Jupyter Notebook](../waste_detection.ipynb) 을 이용해 진행했습니다.

학습된 YOLO 모델을 특정 플랫폼(CoreML, TFLite 등)에 배포하기 위해 **`export` 메서드**를 사용합니다. 이때 `format`과 `device` 매개변수를 적절히 설정해야 합니다.

  * **`device` 설정**:
      * **Apple Silicon 환경**: `mps`로 설정합니다.
      * **GPU 학습**: `0` (기본 GPU) 또는 특정 GPU ID로 설정합니다.
      * **CPU 학습**: `cpu`로 설정합니다.

`export` 메서드의 모든 매개변수 관련 정보는 [Ultralytics 공식 문서](https://docs.ultralytics.com/modes/export/#arguments)에서 확인할 수 있습니다.

```python
from ultralytics import YOLO

# YOLO11 모델 로드
model = YOLO("yolo11n.pt")

# 모델을 CoreML 형식으로 내보내기 (NMS 포함)
# 이 경우 'yolo11n CoreML Model' 파일이 생성됩니다.
model.export(format="coreml", device='mps', nms=True)

# 모델을 TFLite 형식으로 내보내기 (NMS 미포함)
# 이 경우 'yolo11n_float32.tflite' 파일이 생성됩니다.
model.export(format="tflite", device='mps', nms=False)
```

위 예시에서는 `device='mps'`를 사용하여 Apple Silicon 환경에 최적화된 내보내기를 진행하며, CoreML 형식으로 내보낼 때는 \*\*NMS(Non-Maximum Suppression)\*\*를 포함하여 최종 객체 검출 후처리까지 모델 내에서 처리하도록 설정했습니다. 반면 TFLite 형식에서는 NMS를 제외하여 필요에 따라 별도의 후처리 로직을 구현할 수 있도록 했습니다.

-----
