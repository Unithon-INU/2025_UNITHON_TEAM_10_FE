-----

# YOLOv11 모델을 이용한 폐기물 객체 검출 및 분류 모델

이 폴더는 프로젝트에서 사용되는 **비저닝(Visioning) 모델**과 관련된 모든 문서를 포함합니다. 모델의 개요부터 입출력 구조, 그리고 실제 애플리케이션에서 추론을 수행하는 방법까지, 모델의 핵심적인 내용을 이해하는 데 필요한 정보들을 제공합니다.

-----

## 🚀 주요 내용

  * **비저닝 모델 개요**: 현재 프로젝트에서 사용 중인 YOLOv11n 모델의 기본 정보와 학습 방식에 대해 알아봅니다.
  * **모델 입출력 구조**: 모델이 기대하는 입력 데이터(이미지 형식)와 출력 데이터(텐서 구조)의 상세 스펙을 설명합니다. 특히 출력 텐서의 각 요소가 어떤 의미를 가지는지 구체적으로 다룹니다.
  * **모델 추론 가이드**: React Native Vision Camera를 활용한 실제 모바일 환경에서의 모델 추론 과정을 안내합니다. YUV 이미지 변환부터 NMS(Non-Maximum Suppression)를 통한 최종 객체 검출 결과 획득까지의 전체 흐름을 이해할 수 있습니다.

-----

## 📂 하위 문서

자세한 내용은 다음 문서를 참고해 주세요.

  * [`model_details.md`](docs/model_details.md): 비저닝 모델의 구체적인 구조 및 학습 데이터에 대한 심층적인 정보.
  * [`inference_guide.md`](docs/inference_guide.md): React Native Vision Camera를 활용한 모바일 추론 설정 및 코드 예제.
  * [`post_processing.md`](docs/post_processing.md): NMS(Non-Maximum Suppression)와 IoU(Intersection over Union)를 포함한 추론 후처리 알고리즘 설명.

-----