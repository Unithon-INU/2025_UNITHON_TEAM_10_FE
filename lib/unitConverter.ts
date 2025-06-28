/**
 * km/kg 단위를 m/g 단위로 변환하고, 값에 따라 형식을 조정하는 함수.
 * 1 이하의 값은 'k'를 떼고 1000을 곱하여 m/g으로 표시합니다.
 *
 * @param valueKmKg 변환할 km/kg 값.
 * @returns 변환된 값과 단위를 포함하는 문자열.
 */
export default function convertKmKgToMg(valueByKilo: number, unit: string): string {
    const valueMg: number = valueByKilo;

    if (valueByKilo <= 1) {
        const scaledValue = Math.round(valueMg * 1000);
        return `${scaledValue} ${unit}`;
    } else {
        return `${valueByKilo} k${unit}`;
    }
}