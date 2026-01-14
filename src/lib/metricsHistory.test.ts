import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MetricsHistoryStore, type MetricsSnapshot } from './metricsHistory';

// 테스트용 스냅샷 생성 헬퍼
function createSnapshot(overrides: Partial<MetricsSnapshot> = {}): MetricsSnapshot {
  return {
    timestamp: Date.now(),
    cpu: 50,
    memory: 60,
    disk: 70,
    networkRx: 1000000,
    networkTx: 500000,
    ...overrides,
  };
}

describe('MetricsHistoryStore', () => {
  let store: MetricsHistoryStore;

  beforeEach(() => {
    store = new MetricsHistoryStore();
  });

  describe('constructor', () => {
    it('should create empty store with default maxSize', () => {
      expect(store.getSize()).toBe(0);
    });

    it('should accept custom maxSize option', () => {
      const customStore = new MetricsHistoryStore({ maxSize: 10 });
      // 11개 추가하면 10개만 남아야 함
      for (let i = 0; i < 11; i++) {
        customStore.addSnapshot(createSnapshot({ timestamp: Date.now() + i }));
      }
      expect(customStore.getSize()).toBe(10);
    });
  });

  describe('addSnapshot', () => {
    it('should add a single snapshot', () => {
      const snapshot = createSnapshot();
      store.addSnapshot(snapshot);

      expect(store.getSize()).toBe(1);
      expect(store.getLatest()).toEqual(snapshot);
    });

    it('should add multiple snapshots in order', () => {
      const snapshot1 = createSnapshot({ timestamp: 1000 });
      const snapshot2 = createSnapshot({ timestamp: 2000 });
      const snapshot3 = createSnapshot({ timestamp: 3000 });

      store.addSnapshot(snapshot1);
      store.addSnapshot(snapshot2);
      store.addSnapshot(snapshot3);

      expect(store.getSize()).toBe(3);
      expect(store.getLatest()).toEqual(snapshot3);
    });

    it('should remove oldest snapshot when exceeding maxSize', () => {
      const smallStore = new MetricsHistoryStore({ maxSize: 3 });

      const snapshot1 = createSnapshot({ timestamp: 1000, cpu: 10 });
      const snapshot2 = createSnapshot({ timestamp: 2000, cpu: 20 });
      const snapshot3 = createSnapshot({ timestamp: 3000, cpu: 30 });
      const snapshot4 = createSnapshot({ timestamp: 4000, cpu: 40 });

      smallStore.addSnapshot(snapshot1);
      smallStore.addSnapshot(snapshot2);
      smallStore.addSnapshot(snapshot3);
      smallStore.addSnapshot(snapshot4);

      expect(smallStore.getSize()).toBe(3);

      const history = smallStore.getHistory();
      expect(history[0].cpu).toBe(20); // snapshot1이 제거됨
      expect(history[1].cpu).toBe(30);
      expect(history[2].cpu).toBe(40);
    });

    it('should maintain circular buffer behavior', () => {
      const tinyStore = new MetricsHistoryStore({ maxSize: 2 });

      // 5개 추가하면 마지막 2개만 남아야 함
      for (let i = 1; i <= 5; i++) {
        tinyStore.addSnapshot(createSnapshot({ timestamp: i * 1000, cpu: i * 10 }));
      }

      expect(tinyStore.getSize()).toBe(2);

      const history = tinyStore.getHistory();
      expect(history[0].cpu).toBe(40);
      expect(history[1].cpu).toBe(50);
    });
  });

  describe('getHistory', () => {
    it('should return empty array for empty store', () => {
      expect(store.getHistory()).toEqual([]);
    });

    it('should return all snapshots when no minutes specified', () => {
      const snapshot1 = createSnapshot({ timestamp: 1000 });
      const snapshot2 = createSnapshot({ timestamp: 2000 });

      store.addSnapshot(snapshot1);
      store.addSnapshot(snapshot2);

      const history = store.getHistory();
      expect(history).toHaveLength(2);
      expect(history).toEqual([snapshot1, snapshot2]);
    });

    it('should return copy of snapshots array', () => {
      const snapshot = createSnapshot();
      store.addSnapshot(snapshot);

      const history = store.getHistory();
      history.push(createSnapshot());

      // 원본 스토어는 영향 없어야 함
      expect(store.getSize()).toBe(1);
    });

    it('should filter by minutes parameter', () => {
      const now = Date.now();

      // 10분 전 스냅샷
      const oldSnapshot = createSnapshot({ timestamp: now - 10 * 60 * 1000 });
      // 3분 전 스냅샷
      const recentSnapshot = createSnapshot({ timestamp: now - 3 * 60 * 1000 });
      // 현재 스냅샷
      const currentSnapshot = createSnapshot({ timestamp: now });

      store.addSnapshot(oldSnapshot);
      store.addSnapshot(recentSnapshot);
      store.addSnapshot(currentSnapshot);

      // 5분 내 스냅샷만 조회
      const history = store.getHistory(5);
      expect(history).toHaveLength(2);
      expect(history[0]).toEqual(recentSnapshot);
      expect(history[1]).toEqual(currentSnapshot);
    });

    it('should return all for minutes = 0', () => {
      store.addSnapshot(createSnapshot({ timestamp: 1000 }));
      store.addSnapshot(createSnapshot({ timestamp: 2000 }));

      const history = store.getHistory(0);
      expect(history).toHaveLength(2);
    });

    it('should return all for negative minutes', () => {
      store.addSnapshot(createSnapshot({ timestamp: 1000 }));
      store.addSnapshot(createSnapshot({ timestamp: 2000 }));

      const history = store.getHistory(-5);
      expect(history).toHaveLength(2);
    });

    it('should handle boundary case correctly', () => {
      const now = Date.now();

      // 정확히 5분 전 (경계 케이스)
      const boundarySnapshot = createSnapshot({ timestamp: now - 5 * 60 * 1000 });
      // 4분 59초 전 (포함되어야 함)
      const justInsideSnapshot = createSnapshot({ timestamp: now - 4 * 60 * 1000 - 59 * 1000 });

      store.addSnapshot(boundarySnapshot);
      store.addSnapshot(justInsideSnapshot);

      const history = store.getHistory(5);
      // boundarySnapshot은 정확히 5분이므로 cutoff에 의해 제외될 수 있음
      expect(history.length).toBeGreaterThanOrEqual(1);
      expect(history).toContainEqual(justInsideSnapshot);
    });
  });

  describe('getLatest', () => {
    it('should return null for empty store', () => {
      expect(store.getLatest()).toBeNull();
    });

    it('should return the most recent snapshot', () => {
      const snapshot1 = createSnapshot({ timestamp: 1000, cpu: 10 });
      const snapshot2 = createSnapshot({ timestamp: 2000, cpu: 20 });

      store.addSnapshot(snapshot1);
      store.addSnapshot(snapshot2);

      expect(store.getLatest()).toEqual(snapshot2);
    });

    it('should return the last remaining snapshot after overflow', () => {
      const tinyStore = new MetricsHistoryStore({ maxSize: 1 });

      tinyStore.addSnapshot(createSnapshot({ cpu: 10 }));
      tinyStore.addSnapshot(createSnapshot({ cpu: 20 }));
      tinyStore.addSnapshot(createSnapshot({ cpu: 30 }));

      expect(tinyStore.getLatest()?.cpu).toBe(30);
    });
  });

  describe('getSize', () => {
    it('should return 0 for empty store', () => {
      expect(store.getSize()).toBe(0);
    });

    it('should return correct count', () => {
      store.addSnapshot(createSnapshot());
      store.addSnapshot(createSnapshot());
      store.addSnapshot(createSnapshot());

      expect(store.getSize()).toBe(3);
    });

    it('should not exceed maxSize', () => {
      const smallStore = new MetricsHistoryStore({ maxSize: 5 });

      for (let i = 0; i < 10; i++) {
        smallStore.addSnapshot(createSnapshot());
      }

      expect(smallStore.getSize()).toBe(5);
    });
  });

  describe('clear', () => {
    it('should empty the store', () => {
      store.addSnapshot(createSnapshot());
      store.addSnapshot(createSnapshot());

      store.clear();

      expect(store.getSize()).toBe(0);
      expect(store.getLatest()).toBeNull();
      expect(store.getHistory()).toEqual([]);
    });

    it('should allow adding snapshots after clear', () => {
      store.addSnapshot(createSnapshot({ cpu: 10 }));
      store.clear();
      store.addSnapshot(createSnapshot({ cpu: 20 }));

      expect(store.getSize()).toBe(1);
      expect(store.getLatest()?.cpu).toBe(20);
    });
  });

  describe('default maxSize (60)', () => {
    it('should hold up to 60 snapshots by default', () => {
      const defaultStore = new MetricsHistoryStore();

      // 60개 추가
      for (let i = 0; i < 60; i++) {
        defaultStore.addSnapshot(createSnapshot({ timestamp: i }));
      }

      expect(defaultStore.getSize()).toBe(60);

      // 61번째 추가
      defaultStore.addSnapshot(createSnapshot({ timestamp: 60 }));

      expect(defaultStore.getSize()).toBe(60);
      expect(defaultStore.getHistory()[0].timestamp).toBe(1); // 0번째가 제거됨
    });
  });

  describe('snapshot data integrity', () => {
    it('should preserve all snapshot properties', () => {
      const snapshot: MetricsSnapshot = {
        timestamp: 1234567890,
        cpu: 75.5,
        memory: 80.2,
        disk: 45.8,
        networkRx: 123456789,
        networkTx: 987654321,
      };

      store.addSnapshot(snapshot);

      const retrieved = store.getLatest();
      expect(retrieved).toEqual(snapshot);
      expect(retrieved?.timestamp).toBe(1234567890);
      expect(retrieved?.cpu).toBe(75.5);
      expect(retrieved?.memory).toBe(80.2);
      expect(retrieved?.disk).toBe(45.8);
      expect(retrieved?.networkRx).toBe(123456789);
      expect(retrieved?.networkTx).toBe(987654321);
    });
  });
});
