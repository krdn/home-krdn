# Summary 05-01: 메트릭 수집 강화 (네트워크, 프로세스)

## Status: COMPLETE

## Date: 2026-01-14

## Tasks Completed

### Task 1: 네트워크 메트릭 수집 함수 추가
- `NetworkInterface` 타입 정의 (name, rxBytes, txBytes, rxPackets, txPackets)
- `parseNetDev()` 순수 함수 구현 (/proc/net/dev 파싱)
- `getNetworkInfo()` 함수 추가
- **Commit:** `7e4e4ba`

### Task 2: 프로세스 메트릭 수집 함수 추가
- `ProcessInfo` 타입 정의 (pid, name, cpu, memory)
- `parseProcessList()` 순수 함수 구현 (ps aux 출력 파싱)
- `getTopProcesses()` 함수 추가 (CPU 기준 상위 5개)
- **Commit:** `6cb2844`

### Task 3: SystemMetrics 타입 확장 및 API 업데이트
- `SystemMetrics` 타입에 `network`, `processes` 필드 추가
- `getSystemMetrics()`에 네트워크/프로세스 메트릭 통합
- API 응답에 네트워크 인터페이스 및 프로세스 정보 포함
- `useSystemMetrics` 훅 타입 업데이트 (NetworkInterfaceData, ProcessData)
- **Commit:** `4d3bf31`

### Task 4: 확장 메트릭 테스트 작성
- `parseNetDev()` 단위 테스트 7개 케이스
- `parseProcessList()` 단위 테스트 8개 케이스
- 엣지 케이스 테스트 포함 (빈 입력, 잘못된 형식, 실제 데이터)
- **Commit:** `b573e59`

## Files Modified
- `src/lib/system.ts` - 네트워크/프로세스 메트릭 수집 함수 및 타입 추가
- `src/app/api/system/route.ts` - API 응답에 새 메트릭 포함
- `src/hooks/useSystemMetrics.ts` - 훅 타입 업데이트
- `src/lib/system.test.ts` - 파싱 함수 테스트 추가

## Verification Results
- **Build:** PASS
- **Tests:** 38 tests passed (기존 23 + 신규 15)
- **Type Check:** PASS

## API Response Example
```json
{
  "success": true,
  "data": {
    "cpu": { ... },
    "memory": { ... },
    "disk": { ... },
    "network": [
      {
        "name": "eth0",
        "rxBytes": 987654321,
        "txBytes": 123456789,
        "rxPackets": 123456,
        "txPackets": 654321,
        "rxFormatted": "941.90 MB",
        "txFormatted": "117.74 MB"
      }
    ],
    "processes": [
      {
        "pid": 1234,
        "name": "/usr/bin/node server.js",
        "cpu": 25.5,
        "memory": 12.3
      }
    ],
    "uptime": "...",
    "hostname": "...",
    "platform": "..."
  }
}
```

## Notes
- 네트워크 메트릭은 /proc/net/dev에서 실시간으로 읽어옴
- 프로세스 정보는 ps aux --sort=-%cpu 명령으로 CPU 사용률 기준 정렬
- 순수 함수 패턴 유지로 테스트 가능성 확보

---
*Phase 05-01 완료*
