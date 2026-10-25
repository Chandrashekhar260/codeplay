import React, { useState, useEffect, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network, Table as TableIcon, Plus, X } from 'lucide-react';
import type { ProcessingActivity, RopaGraphData } from '../types';
import { Badge } from '../components/ui/Badge';
import { api } from '../api/client';

interface RopaPageProps {
  activities: ProcessingActivity[];
  onActivityCreated: () => void;
}

// Custom React Flow Node Component with Left/Right Connection Handles
const CustomNode = ({ data }: { data: any }) => {
  const isActivity = data.type === 'activityNode' || data.level === 'ACTIVITY';
  const isSource = data.type === 'dataSourceNode';
  const isElement = data.type === 'dataElementNode';
  const isSystem = data.type === 'systemNode';
  const isRecipient = data.type === 'recipientNode';

  let borderClass = 'border-slate-300 bg-white text-slate-800';
  let badgeClass = 'bg-slate-100 text-slate-700';

  if (isActivity) {
    borderClass = 'border-blue-500 bg-blue-50/40 text-blue-950 font-semibold shadow-sm';
    badgeClass = 'bg-blue-600 text-white';
  } else if (isElement) {
    borderClass = 'border-amber-400 bg-amber-50/50 text-amber-950';
    badgeClass = 'bg-amber-600 text-white';
  } else if (isSystem) {
    borderClass = 'border-purple-400 bg-purple-50/50 text-purple-950';
    badgeClass = 'bg-purple-600 text-white';
  } else if (isRecipient) {
    borderClass = 'border-rose-400 bg-rose-50/50 text-rose-950';
    badgeClass = 'bg-rose-600 text-white';
  }

  return (
    <div className={`px-3.5 py-2 rounded border ${borderClass} min-w-[170px] shadow-xs text-xs relative`}>
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white"
      />
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${badgeClass}`}>
          {data.badge || data.category || data.sourceType || data.stage || 'NODE'}
        </span>
      </div>
      <p className="font-semibold text-xs truncate max-w-[200px]">{data.label}</p>
      {data.sublabel && <p className="text-[10px] text-slate-500 truncate mt-0.5">{data.sublabel}</p>}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-slate-400 !border-2 !border-white"
      />
    </div>
  );
};

const nodeTypes = {
  dataSourceNode: CustomNode,
  activityNode: CustomNode,
  dataElementNode: CustomNode,
  systemNode: CustomNode,
  recipientNode: CustomNode,
  default: CustomNode,
};

export const RopaPage: React.FC<RopaPageProps> = ({ activities, onActivityCreated }) => {
  const [activeView, setActiveView] = useState<'graph' | 'table'>('graph');
  const [graphData, setGraphData] = useState<RopaGraphData | null>(null);
  const [loadingGraph, setLoadingGraph] = useState<boolean>(true);

  // Modal State for Registering Activity
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actName, setActName] = useState('');
  const [bizFunc, setBizFunc] = useState('Diagnostic Lab Testing');
  const [legalBasis, setLegalBasis] = useState<'CONSENT' | 'STATUTORY_OBLIGATION' | 'LEGITIMATE_USE' | 'CONTRACTUAL'>('CONSENT');
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Load Graph Data from GET /api/v1/mapping/graph
  const fetchGraph = async () => {
    setLoadingGraph(true);
    try {
      const data = await api.mapping.getGraph();
      setGraphData(data);
    } catch (err) {
      console.error('Failed to load RoPA graph:', err);
    } finally {
      setLoadingGraph(false);
    }
  };

  useEffect(() => {
    fetchGraph();
  }, [activities.length]);

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actName.trim()) return;
    setSubmitting(true);
    setModalError(null);
    try {
      await api.mapping.createActivity({
        name: actName.trim(),
        businessFunction: bizFunc,
        legalBasis,
      });
      setActName('');
      setIsModalOpen(false);
      onActivityCreated();
      fetchGraph();
    } catch (err: any) {
      setModalError(err.response?.data?.error?.message || 'Failed to register activity');
    } finally {
      setSubmitting(false);
    }
  };

  // Transform graph data for React Flow
  const flowNodes: Node[] = useMemo(() => {
    if (!graphData) return [];
    return graphData.nodes.map((n) => ({
      id: n.id,
      type: n.type || 'default',
      position: n.position || { x: 100, y: 100 },
      data: {
        ...n.data,
        type: n.type,
      },
    }));
  }, [graphData]);

  const flowEdges: Edge[] = useMemo(() => {
    if (!graphData) return [];
    return graphData.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: e.label,
      animated: e.animated ?? true,
      style: { stroke: '#64748b', strokeWidth: 1.5 },
    }));
  }, [graphData]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  useEffect(() => {
    setNodes(flowNodes);
    setEdges(flowEdges);
  }, [flowNodes, flowEdges]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* View Switcher Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded p-4">
        <div>
          <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Record of Processing Activities (RoPA) & Data Lineage
          </h2>
          <p className="text-xs text-slate-500">
            Mandatory inventory of processing activities under DPDP Act Section 8 and international standards.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Register Button */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 rounded shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Activity</span>
          </button>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded border border-slate-200">
            <button
              onClick={() => setActiveView('graph')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeView === 'graph' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Network className="w-3.5 h-3.5 text-blue-600" />
              <span>Relationship Graph</span>
            </button>
            <button
              onClick={() => setActiveView('table')}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors ${
                activeView === 'table' ? 'bg-white text-slate-900 shadow-xs font-semibold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5 text-slate-600" />
              <span>RoPA Table ({activities.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Register RoPA Activity</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-xs text-rose-700">
                {modalError}
              </div>
            )}

            <form onSubmit={handleCreateActivity} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Activity Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Diagnostic Patient Report Dispatch"
                  value={actName}
                  onChange={(e) => setActName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Business Function</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Clinical Operations, Billing, Logistics"
                  value={bizFunc}
                  onChange={(e) => setBizFunc(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Statutory Legal Basis</label>
                <select
                  value={legalBasis}
                  onChange={(e) => setLegalBasis(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none bg-white font-medium"
                >
                  <option value="CONSENT">DPDP Act Section 6 (Affirmative Consent)</option>
                  <option value="STATUTORY_OBLIGATION">Statutory Obligation (Tax / CGST Section 36)</option>
                  <option value="LEGITIMATE_USE">Section 7 Legitimate Uses (Medical Emergency / Employment)</option>
                  <option value="CONTRACTUAL">Contractual Obligation</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Save to RoPA Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeView === 'graph' ? (
        /* React Flow Graph View */
        <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-xs">
          <div className="p-3 border-b border-slate-200 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-slate-700">Interactive Lineage Diagram</span>
            <div className="flex items-center gap-3 text-[11px] text-slate-600">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-blue-600" /> Processing Activity
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-amber-500" /> Discovered PII Element
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-purple-500" /> Storage System
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Third-Party Recipient
              </span>
            </div>
          </div>

          <div className="h-[580px] w-full bg-slate-50/40 relative">
            {loadingGraph ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500 bg-white/60">
                Generating RoPA relationship graph from live database...
              </div>
            ) : nodes.length === 0 ? (
              <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">
                No processing activities created yet. Create a RoPA activity or scan a file to populate the graph.
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.2 }}
                minZoom={0.2}
                maxZoom={1.5}
              >
                <Background color="#cbd5e1" gap={16} size={1} />
                <Controls className="bg-white border border-slate-200 rounded shadow-xs" />
                <MiniMap
                  nodeColor={(node) => {
                    if (node.type === 'activityNode') return '#3b82f6';
                    if (node.type === 'dataElementNode') return '#f59e0b';
                    if (node.type === 'recipientNode') return '#f43f5e';
                    return '#94a3b8';
                  }}
                  className="bg-white border border-slate-200 rounded"
                />
              </ReactFlow>
            )}
          </div>
        </div>
      ) : (
        /* RoPA Table View */
        <div className="bg-white border border-slate-200 rounded overflow-hidden">
          <div className="p-3.5 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Registered Processing Activities
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase font-semibold text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Activity Name</th>
                  <th className="py-2.5 px-4">Business Function</th>
                  <th className="py-2.5 px-4">Legal Basis</th>
                  <th className="py-2.5 px-4">Discovered Data Elements</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {activities.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400">
                      No activities registered yet.
                    </td>
                  </tr>
                ) : (
                  activities.map((act) => (
                    <tr key={act.activityId} className="hover:bg-slate-50/80">
                      <td className="py-3 px-4 font-semibold text-slate-900 max-w-xs">{act.name}</td>
                      <td className="py-3 px-4 text-slate-600">{act.businessFunction}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 font-mono text-[11px] bg-slate-100 text-slate-800 rounded">
                          {act.legalBasis}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-sm">
                          {act.dataElements && act.dataElements.length > 0 ? (
                            act.dataElements.map((elem) => (
                              <span
                                key={elem.elementId}
                                className="px-1.5 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 rounded text-[10px] font-medium"
                              >
                                {elem.piiCategory}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">No elements mapped</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge status={act.status} size="sm" />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
