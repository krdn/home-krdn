/**
 * Service URL 유틸리티 함수
 * 환경별 URL 접근 및 폴백 로직 제공
 */

import type { Service, ServiceUrls } from "@/types/service";

/**
 * 서비스의 운영(Production) URL을 반환합니다.
 * 우선순위: urls.production > url (기존 필드, 하위 호환성)
 */
export function getServiceProdUrl(service: Service): string | undefined {
  return service.urls?.production ?? service.url;
}

/**
 * 서비스의 개발(Development) URL을 반환합니다.
 * 포트가 있으면 localhost:port 형식으로 생성
 */
export function getServiceDevUrl(service: Service): string | undefined {
  if (service.urls?.development) {
    return service.urls.development;
  }
  // 포트가 있으면 localhost URL 생성
  if (service.port) {
    return `http://localhost:${service.port}`;
  }
  return undefined;
}

/**
 * 서비스에 URL이 있는지 확인합니다.
 */
export function hasServiceUrl(service: Service): boolean {
  return !!(getServiceProdUrl(service) || getServiceDevUrl(service));
}

/**
 * URLs 객체에서 사용 가능한 URL 개수를 반환합니다.
 */
export function getAvailableUrlCount(service: Service): number {
  let count = 0;
  if (getServiceProdUrl(service)) count++;
  if (getServiceDevUrl(service)) count++;
  return count;
}

/**
 * 서비스 URL을 생성합니다 (urls 객체 형식).
 * 기존 url 필드와 port를 사용하여 urls 객체를 생성합니다.
 */
export function buildServiceUrls(
  url?: string,
  port?: number,
  existingUrls?: ServiceUrls
): ServiceUrls | undefined {
  const result: ServiceUrls = { ...existingUrls };

  // 기존 url이 있으면 production으로 설정 (existingUrls.production이 없는 경우)
  if (url && !result.production) {
    result.production = url;
  }

  // port가 있으면 development URL 생성 (existingUrls.development가 없는 경우)
  if (port && !result.development) {
    result.development = `http://localhost:${port}`;
  }

  // 빈 객체면 undefined 반환
  if (!result.production && !result.development) {
    return undefined;
  }

  return result;
}
