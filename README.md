# 어따버려 앱

## 환경세팅
- npm
- eas-cli
- 플랫폼 별 sdk
## 실행방법
1. 의존성 설치
```bash
npm install
```
2. 플랫폼별 빌드/ 실행
```bash
npm run [android|ios]
```
## 배포용 빌드 방법

> ⚠️ eas라는 CI 플랫폼을 이용해 빌드를 진행하는데, 이게 개인 계정이라 우선은 로컬빌드로 진행해야 할 것 같아요.
1. 내부 배포
```bash
eas build [--platform android|ios] --profile preview
```
2. 정식 버전 배포
```bash
eas build [--platform android|ios]
```

# 비저닝 모델
## 모델
YOLOv11n 모델 CoreML/TFLite 용으로 내보내기 한 모델로 테스트중, 지도학습 예정
## 입출력
### 입력
(1, 3, 640, 640) RGB 이미지
### 출력
(1, 84, 8400) 텐서

(x, y, w, h, 클래스별확률...)  로 8400개 후보를 생성합니다. 각 후보는 검출 대상에 대한 후보입니다.

클래스는 80개 이므로 84개 요소를 가진 텐서를 8400개 생성한다고 봐도 무방합니다.
`[[[x,y,w,h,클래스별확률80개...], [x,y,w,h,클래스별확률80개...], ...나머지8398개후보]]`

# 추론
추론은 각 플랫폼별로 따로 진행합니다.
React Native Vision Camera의 