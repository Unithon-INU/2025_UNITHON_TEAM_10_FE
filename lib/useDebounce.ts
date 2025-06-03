import { DebounceSettingsLeading, debounce } from "lodash";
import { useRef, useEffect } from "react";

/**
 * 주어진 함수를 디바운스 처리하여 반환하는 React 훅입니다.
 * 디바운스된 함수는 마지막 호출 이후 wait 밀리초가 지나야 실행됩니다.
 *
 * @param func 디바운스할 함수
 * @param wait 지연시킬 밀리초(ms)
 * @param options leading/trailing 등 디바운스 동작 옵션 (선택)
 * @returns 디바운스된 함수
 */
export default function useDebounce<T extends (...args: any) => any>(
  func: T,
  wait: number | undefined,
  options?: DebounceSettingsLeading
) {
  // useRef를 사용하여 debounce 함수 인스턴스를 저장
  // 이렇게 하면 컴포넌트 리렌더링과 상관없이 동일한 debounce 인스턴스가 유지됩니다.
  const debounceRef = useRef(debounce(func, wait, options));

  // 컴포넌트 언마운트 시 debounce 타이머 정리 (선택 사항이지만 권장)
  useEffect(() => {
    return () => {
      debounceRef.current.cancel(); // lodash debounce는 .cancel() 메서드를 제공합니다.
    };
  }, []);

  return debounceRef.current;
}