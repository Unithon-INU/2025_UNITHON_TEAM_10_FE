# 어따버려 모바일

# 환경세팅
- npm
- eas-cli
- 플랫폼 별 sdk
# 실행방법
1. 의존성 설치
```bash
npm install
```
2. prebuild
```bash
npx expo prebuild
```
3. 플랫폼별 빌드/ 실행
```bash
npm run [android|ios]
```
# 배포용 빌드 방법
> ⚠️ `npx expo prebuild` 명령으로 prebuild 후 진행해주세요.

> ⚠️ eas라는 CI 플랫폼을 이용해 빌드를 진행하는데, 이게 개인 계정이라 우선은 로컬빌드로 진행해야 할 것 같아요.
1. 내부 배포
```bash
eas build [--platform android|ios] --profile preview
```
2. 정식 버전 배포
```bash
eas build [--platform android|ios]
```
