import type { Action, Position } from '../../shared/lib/constants';

// 차트 엔트리 타입
export type ChartEntry = {
  action: Action;
  reason: string;
  detailedReason: string;
  examples: string[];
};

// 차트 데이터 타입
export type ChartData = Record<Position, Record<string, ChartEntry>>;

// 매트릭스 셀 타입
export type MatrixCell = {
  key: string;
  label: string;
  action: Action;
  reason: string;
  detailedReason: string;
  examples: string[];
};
