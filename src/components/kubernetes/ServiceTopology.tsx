'use client';

/**
 * ServiceTopology 컴포넌트
 *
 * React Flow를 사용한 Kubernetes 서비스 토폴로지 시각화
 * Service → Deployment → Pod 연결 관계를 그래프로 표시
 *
 * Phase 41: Service Mesh Overview
 */

import { useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  Position,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Globe, Layers, Box, Loader2, AlertCircle, Network } from 'lucide-react';
import { useK8sTopology } from '@/hooks/useKubernetes';
import type { ServiceTopology as ServiceTopologyType, TopologyNode } from '@/types/kubernetes';

interface ServiceTopologyProps {
  clusterId: string;
  namespace?: string;
  refreshInterval?: number;
}

// 노드 타입별 색상 및 아이콘
const nodeConfig = {
  service: {
    icon: Globe,
    bgColor: 'bg-blue-500',
    borderColor: 'border-blue-600',
    textColor: 'text-blue-600',
  },
  deployment: {
    icon: Layers,
    bgColor: 'bg-purple-500',
    borderColor: 'border-purple-600',
    textColor: 'text-purple-600',
  },
  pod: {
    icon: Box,
    bgColor: 'bg-green-500',
    borderColor: 'border-green-600',
    textColor: 'text-green-600',
  },
  ingress: {
    icon: Network,
    bgColor: 'bg-orange-500',
    borderColor: 'border-orange-600',
    textColor: 'text-orange-600',
  },
};

// 상태별 색상
const statusColors = {
  healthy: 'bg-green-500',
  warning: 'bg-yellow-500',
  error: 'bg-red-500',
  unknown: 'bg-gray-400',
};

/**
 * 커스텀 노드 컴포넌트
 */
function CustomNode({ data }: { data: TopologyNode }) {
  const config = nodeConfig[data.type] || nodeConfig.pod;
  const Icon = config.icon;
  const statusColor = statusColors[data.status as keyof typeof statusColors] || statusColors.unknown;

  return (
    <div
      className={`relative rounded-lg border-2 ${config.borderColor} bg-card p-3 shadow-md min-w-[140px]`}
    >
      {/* 상태 인디케이터 */}
      <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full ${statusColor} border-2 border-background`} />

      {/* 아이콘 + 이름 */}
      <div className="flex items-center gap-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded ${config.bgColor}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-medium uppercase text-muted-foreground">
            {data.type}
          </div>
          <div className="font-medium truncate text-sm" title={data.name}>
            {data.name}
          </div>
        </div>
      </div>

      {/* 메타데이터 */}
      {data.metadata && (
        <div className="mt-2 text-xs text-muted-foreground">
          {data.type === 'deployment' && data.metadata.replicas !== undefined ? (
            <span>
              Replicas: {data.metadata.readyReplicas as number}/{data.metadata.replicas as number}
            </span>
          ) : null}
          {data.type === 'pod' && data.metadata.podIP ? (
            <span>IP: {data.metadata.podIP as string}</span>
          ) : null}
          {data.type === 'service' && data.metadata.type ? (
            <span>{data.metadata.type as string}</span>
          ) : null}
        </div>
      )}
    </div>
  );
}

// 노드 타입 등록
const nodeTypes = {
  custom: CustomNode,
};

/**
 * 토폴로지 데이터를 React Flow 노드/엣지로 변환
 */
function convertTopologyToFlow(topology: ServiceTopologyType): { nodes: Node[]; edges: Edge[] } {
  // 계층적 레이아웃: Service → Deployment → Pod
  const serviceNodes = topology.nodes.filter((n) => n.type === 'service');
  const deploymentNodes = topology.nodes.filter((n) => n.type === 'deployment');
  const podNodes = topology.nodes.filter((n) => n.type === 'pod');

  const xGap = 200;
  const yGap = 120;

  // 노드 변환
  const nodes: Node[] = [];

  // Service 노드 (왼쪽)
  serviceNodes.forEach((node, index) => {
    nodes.push({
      id: node.id,
      type: 'custom',
      position: { x: 0, y: index * yGap },
      data: node,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
  });

  // Deployment 노드 (중간)
  deploymentNodes.forEach((node, index) => {
    nodes.push({
      id: node.id,
      type: 'custom',
      position: { x: xGap, y: index * yGap },
      data: node,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
  });

  // Pod 노드 (오른쪽)
  podNodes.forEach((node, index) => {
    nodes.push({
      id: node.id,
      type: 'custom',
      position: { x: xGap * 2, y: index * yGap },
      data: node,
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
    });
  });

  // 엣지 변환
  const edges: Edge[] = topology.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    animated: edge.type === 'selector',
    label: edge.label,
    style: { stroke: edge.type === 'selector' ? '#3b82f6' : '#a855f7' },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: edge.type === 'selector' ? '#3b82f6' : '#a855f7',
    },
  }));

  return { nodes, edges };
}

/**
 * ServiceTopology 컴포넌트
 */
export function ServiceTopology({
  clusterId,
  namespace,
  refreshInterval = 30000,
}: ServiceTopologyProps) {
  const { topology, isLoading, errorMessage, refetch } = useK8sTopology(
    clusterId,
    namespace,
    { refreshInterval }
  );

  // 토폴로지 데이터를 React Flow 형식으로 변환
  const { initialNodes, initialEdges } = useMemo(() => {
    if (!topology) return { initialNodes: [], initialEdges: [] };
    const { nodes, edges } = convertTopologyToFlow(topology);
    return { initialNodes: nodes, initialEdges: edges };
  }, [topology]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 토폴로지 데이터가 변경되면 노드/엣지 업데이트
  const onRefresh = useCallback(() => {
    if (!topology) return;
    const { nodes: newNodes, edges: newEdges } = convertTopologyToFlow(topology);
    setNodes(newNodes);
    setEdges(newEdges);
  }, [topology, setNodes, setEdges]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-lg border bg-card p-8 h-[500px]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">토폴로지 로딩 중...</span>
      </div>
    );
  }

  // 에러 상태
  if (errorMessage) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive">
        <AlertCircle className="h-5 w-5 shrink-0" />
        <span>{errorMessage}</span>
      </div>
    );
  }

  // 빈 토폴로지
  if (!topology || (topology.nodes.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border bg-card p-8 text-center h-[500px]">
        <Network className="h-12 w-12 text-muted-foreground/50" />
        <p className="mt-4 text-muted-foreground">
          {namespace
            ? `${namespace} 네임스페이스에 리소스가 없습니다.`
            : '리소스가 없습니다.'}
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card h-[500px]">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b p-3">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Globe className="h-4 w-4 text-blue-500" />
            Services: {topology.nodes.filter((n) => n.type === 'service').length}
          </span>
          <span className="flex items-center gap-1">
            <Layers className="h-4 w-4 text-purple-500" />
            Deployments: {topology.nodes.filter((n) => n.type === 'deployment').length}
          </span>
          <span className="flex items-center gap-1">
            <Box className="h-4 w-4 text-green-500" />
            Pods: {topology.nodes.filter((n) => n.type === 'pod').length}
          </span>
        </div>
        <button
          onClick={() => {
            refetch();
            onRefresh();
          }}
          className="text-sm text-primary hover:underline"
        >
          새로고침
        </button>
      </div>

      {/* React Flow */}
      <div className="h-[calc(100%-52px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#888" gap={16} size={1} />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as TopologyNode;
              if (data.type === 'service') return '#3b82f6';
              if (data.type === 'deployment') return '#a855f7';
              return '#22c55e';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}
