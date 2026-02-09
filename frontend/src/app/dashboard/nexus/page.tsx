'use client';

/**
 * Causal Nexus - Team-Scoped Graph Visualization
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import ReactFlow, {
    Node,
    Edge,
    Background,
    Controls,
    MiniMap,
    useNodesState,
    useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Card } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';
import { useTeam } from '@/contexts/TeamContext';
import { decisionsApi } from '@/lib/team-api';

export default function CausalNexus() {
    const { user, session } = useAuth();
    const { selectedTeam } = useTeam();
    const router = useRouter();

    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNode, setSelectedNode] = useState<any>(null);

    if (!user) {
        router.push('/login');
        return null;
    }

    if (!selectedTeam) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-center">
                    <p className="text-text-secondary mb-4">No team selected</p>
                    <p className="text-text-tertiary text-sm">Please contact an admin to be added to a team</p>
                </div>
            </div>
        );
    }

    useEffect(() => {
        if (selectedTeam && session?.access_token) {
            fetchGraph();
        }
    }, [selectedTeam, session]);

    async function fetchGraph() {
        if (!selectedTeam || !session?.access_token) return;

        try {
            setLoading(true);
            const graph = await decisionsApi.getGraph(session.access_token, selectedTeam.team.id);

            // Convert to React Flow format
            const reactFlowNodes: Node[] = graph.nodes.map((node: any, index: number) => ({
                id: node.id,
                data: {
                    label: node.label,
                    sentiment: node.sentiment,
                    actor: node.actor,
                    timestamp: node.timestamp
                },
                position: {
                    x: (index % 5) * 250,
                    y: Math.floor(index / 5) * 150
                },
                style: {
                    background: '#FFFFFF',
                    color: '#0F172A',
                    border: `2px solid ${getSentimentBorderColor(node.sentiment)}`,
                    borderRadius: '8px',
                    padding: '12px',
                    width: 200,
                    fontSize: '14px'
                }
            }));

            const reactFlowEdges: Edge[] = graph.edges.map((edge: any, index: number) => ({
                id: `edge-${index}`,
                source: edge.source,
                target: edge.target,
                label: edge.type,
                type: 'smoothstep',
                style: { stroke: '#E5E7EB', strokeWidth: 2 },
                labelStyle: { fontSize: 10, fill: '#64748B' },
                labelBgStyle: { fill: '#FFFFFF' }
            }));

            setNodes(reactFlowNodes);
            setEdges(reactFlowEdges);
        } catch (error) {
            console.error('Failed to fetch graph:', error);
        } finally {
            setLoading(false);
        }
    }

    const onNodeClick = useCallback((_: any, node: Node) => {
        setSelectedNode(node.data);
    }, []);

    if (loading) {
        return <div className="text-center text-text-tertiary py-20">Loading graph...</div>;
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-h1 text-text-primary mb-2">Causal Nexus</h1>
                <p className="text-body text-text-secondary">
                    {selectedTeam.team.name}'s decision graph visualization
                </p>
            </div>

            <div className="grid grid-cols-3 gap-6">
                {/* Graph Canvas */}
                <div className="col-span-2">
                    <Card className="h-[700px] p-0 overflow-hidden">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onNodeClick={onNodeClick}
                            fitView
                            attributionPosition="bottom-left"
                        >
                            <Background color="#E5E7EB" gap={16} />
                            <Controls />
                            <MiniMap
                                nodeColor={(node) => {
                                    const sentiment = (node.data as any)?.sentiment;
                                    return getSentimentColor(sentiment);
                                }}
                                style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}
                            />
                        </ReactFlow>
                    </Card>
                </div>

                {/* Details Panel */}
                <div>
                    <Card className="sticky top-8 p-6">
                        {selectedNode ? (
                            <div className="space-y-4">
                                <div>
                                    <div className={`inline-block px-3 py-1 rounded-full text-meta font-semibold mb-3 ${getSentimentBadgeClass(selectedNode.sentiment)}`}>
                                        {selectedNode.sentiment}
                                    </div>
                                    <h3 className="text-h3 text-text-primary mb-2">Decision Details</h3>
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <p className="text-meta text-text-tertiary mb-1 uppercase tracking-wider">Decision</p>
                                        <p className="text-small text-text-primary">{selectedNode.label}</p>
                                    </div>

                                    <div>
                                        <p className="text-meta text-text-tertiary mb-1 uppercase tracking-wider">Actor</p>
                                        <p className="text-small text-text-primary">{selectedNode.actor}</p>
                                    </div>

                                    {selectedNode.timestamp && (
                                        <div>
                                            <p className="text-meta text-text-tertiary mb-1 uppercase tracking-wider">Timestamp</p>
                                            <p className="text-small text-text-secondary font-mono">
                                                {new Date(selectedNode.timestamp).toLocaleString()}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center text-text-tertiary py-12">
                                <p className="text-small">Click on a node to view details</p>
                            </div>
                        )}
                    </Card>

                    {/* Legend */}
                    <Card className="mt-4 p-4">
                        <h4 className="text-meta font-semibold text-text-primary mb-3 uppercase tracking-wider">Legend</h4>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-conflict" />
                                <span className="text-small text-text-secondary">Conflict</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-aligned" />
                                <span className="text-small text-text-secondary">Alignment</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-neutral" />
                                <span className="text-small text-text-secondary">Independent</span>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

function getSentimentColor(sentiment: string): string {
    switch (sentiment) {
        case 'RED':
            return '#DC2626';
        case 'GREEN':
            return '#16A34A';
        case 'NEUTRAL':
            return '#64748B';
        default:
            return '#4F46E5';
    }
}

function getSentimentBorderColor(sentiment: string): string {
    switch (sentiment) {
        case 'RED':
            return '#DC2626';
        case 'GREEN':
            return '#16A34A';
        default:
            return '#E5E7EB';
    }
}

function getSentimentBadgeClass(sentiment: string): string {
    switch (sentiment) {
        case 'RED':
            return 'bg-conflict-light text-conflict';
        case 'GREEN':
            return 'bg-aligned-light text-aligned';
        case 'NEUTRAL':
            return 'bg-neutral-light text-neutral';
        default:
            return 'bg-primary-light text-primary';
    }
}
