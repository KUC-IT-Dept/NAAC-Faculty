/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  NodeProps,
  Handle,
  Position,
  Edge,
  Node
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import api from '../../lib/api';
import toast from 'react-hot-toast';

// Custom node styling and rendering logic
const OrgNode = ({ data }: any) => {
  const isPlaceholder = data.isPlaceholder;
  const isFaculty = data.role === 'FACULTY';
  const role = data.role || 'FACULTY';

  const roleColors: Record<string, { border: string; text: string; bg: string }> = {
    'SUPER ADMIN': { border: '#10b981', text: '#10b981', bg: 'rgba(16,185,129,0.06)' },
    'VICE CHANCELLOR': { border: '#a855f7', text: '#a855f7', bg: 'rgba(168,85,247,0.06)' },
    'HEAD OF DEPT': { border: '#ef4444', text: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
    'FACULTY': { border: '#2563eb', text: '#2563eb', bg: 'rgba(37,99,235,0.06)' }
  };

  const colors = roleColors[role] || roleColors['FACULTY'];

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid #e2e8f0',
      borderLeft: `5px solid ${colors.border}`,
      borderRadius: '12px',
      padding: '16px',
      width: '240px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
      transition: 'all 0.2s ease',
      cursor: 'default'
    }}>
      {role !== 'SUPER ADMIN' && (
        <Handle
          type="target"
          position={Position.Top}
          style={{ background: '#94a3b8', width: 8, height: 8 }}
        />
      )}

      <div>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '4px', lineHeight: 1.3 }}>
          {data.fullName || data.label}
        </div>
        <div style={{
          fontSize: '9px',
          fontWeight: 800,
          color: colors.text,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: data.department ? '4px' : '0'
        }}>
          {role}
        </div>
        {data.department && (
          <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 500 }}>
            {data.department}
          </div>
        )}
      </div>

      {isFaculty && !isPlaceholder && (
        <div style={{ marginTop: '12px' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              data.onMakeHod?.(data.userId);
            }}
            style={{
              background: '#eff6ff',
              color: '#2563eb',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 600,
              width: '100%',
              cursor: 'pointer',
              transition: 'all 150ms ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#2563eb';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#eff6ff';
              e.currentTarget.style.color = '#2563eb';
            }}
          >
            Make HOD
          </button>
        </div>
      )}

      {role !== 'FACULTY' && (
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ background: '#94a3b8', width: 8, height: 8 }}
        />
      )}
    </div>
  );
};

const nodeTypes = {
  orgNode: OrgNode
};

interface FacultyUser {
  _id: string;
  username: string;
  email: string;
  isActive: boolean;
  profile?: {
    personalInfo?: { fullName?: string; photoUrl?: string };
    employmentDetails?: { designation?: string; department?: string };
  };
}

export default function OrgHierarchy() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);

  // Department abbreviation helper matching image styling
  const getDeptAbbr = (dept: string) => {
    const map: Record<string, string> = {
      'Computer Science': 'CS',
      'Electronics & Telecommunication': 'E&TC',
      'Commerce & Management': 'Commerce',
      'Physics': 'Physics',
      'Chemistry': 'Chemistry',
      'Mathematics': 'Math'
    };
    return map[dept] || dept;
  };

  const handleMakeHod = useCallback(async (userId: string) => {
    const loadingToast = toast.loading('Promoting to HOD...');
    try {
      await api.patch(`/admin/faculty/${userId}/make-hod`);
      toast.success('Successfully promoted to HOD!', { id: loadingToast });
      fetchHierarchyData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to promote HOD', { id: loadingToast });
    }
  }, []);

  const fetchHierarchyData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/faculty');
      buildTree(data);
    } catch {
      toast.error('Failed to load org hierarchy');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHierarchyData();
  }, []);

  const buildTree = (faculties: FacultyUser[]) => {
    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // 1. Root Node (Super Administrator)
    const rootId = 'root-admin';
    newNodes.push({
      id: rootId,
      type: 'orgNode',
      position: { x: 400, y: 50 },
      data: {
        label: 'Super Administrator',
        fullName: 'Super Administrator',
        role: 'SUPER ADMIN'
      }
    });

    // 2. Extract departments and group faculty
    const deptGroups: Record<string, FacultyUser[]> = {};
    const unassigned: FacultyUser[] = [];

    faculties.forEach(f => {
      const dept = f.profile?.employmentDetails?.department;
      if (dept) {
        if (!deptGroups[dept]) deptGroups[dept] = [];
        deptGroups[dept].push(f);
      } else {
        unassigned.push(f);
      }
    });

    // If there are unassigned faculty, group them under a general "Other" department
    if (unassigned.length > 0) {
      deptGroups['Other / Unassigned'] = unassigned;
    }

    const depts = Object.keys(deptGroups);
    const numDepts = depts.length;
    const spacingX = 380;
    const startX = 400 - ((numDepts - 1) * spacingX) / 2;

    depts.forEach((deptName, deptIdx) => {
      const members = deptGroups[deptName];
      const HOD_x = startX + deptIdx * spacingX;
      const HOD_y = 220;

      // Find if there is an HOD in this department
      const hodUser = members.find(
        m => m.profile?.employmentDetails?.designation === 'HOD'
      );

      let hodNodeId = '';

      if (hodUser) {
        // Real HOD Node
        hodNodeId = `hod-${hodUser._id}`;
        newNodes.push({
          id: hodNodeId,
          type: 'orgNode',
          position: { x: HOD_x, y: HOD_y },
          data: {
            fullName: hodUser.profile?.personalInfo?.fullName || hodUser.username,
            role: 'HEAD OF DEPT',
            department: deptName
          }
        });
      } else {
        // Placeholder HOD Node
        hodNodeId = `placeholder-hod-${deptName.replace(/\s+/g, '-')}`;
        newNodes.push({
          id: hodNodeId,
          type: 'orgNode',
          position: { x: HOD_x, y: HOD_y },
          data: {
            fullName: `Head of Department — ${getDeptAbbr(deptName)}`,
            role: 'HEAD OF DEPT',
            department: deptName,
            isPlaceholder: true
          }
        });
      }

      // Connect Root -> HOD
      newEdges.push({
        id: `edge-${rootId}-to-${hodNodeId}`,
        source: rootId,
        target: hodNodeId,
        type: 'default',
        style: { stroke: '#cbd5e1', strokeWidth: 2 }
      });

      // 3. Faculty nodes under this HOD
      const facultyMembers = members.filter(m => m._id !== hodUser?._id);
      const numFaculty = facultyMembers.length;
      const facSpacingX = 260;
      const facStartX = HOD_x - ((numFaculty - 1) * facSpacingX) / 2;
      const facY = 390;

      facultyMembers.forEach((fac, facIdx) => {
        const facNodeId = `fac-${fac._id}`;
        newNodes.push({
          id: facNodeId,
          type: 'orgNode',
          position: { x: facStartX + facIdx * facSpacingX, y: facY },
          data: {
            fullName: fac.profile?.personalInfo?.fullName || fac.username,
            role: 'FACULTY',
            department: deptName,
            userId: fac._id,
            onMakeHod: handleMakeHod
          }
        });

        // Connect HOD -> Faculty
        newEdges.push({
          id: `edge-${hodNodeId}-to-${facNodeId}`,
          source: hodNodeId,
          target: facNodeId,
          type: 'default',
          style: { stroke: '#cbd5e1', strokeWidth: 2 }
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  if (loading && nodes.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '450px', gap: '12px' }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}>Generating Tree Hierarchy...</span>
      </div>
    );
  }

  const legendItems = [
    { label: 'Super Admin', color: '#10b981' },
    { label: 'Vice Chancellor', color: '#a855f7' },
    { label: 'Head of Dept', color: '#ef4444' },
    { label: 'Faculty', color: '#2563eb' }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 170px)', background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', position: 'relative' }}>
      
      {/* Legend Top Overlay */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(4px)',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '10px 14px',
        zIndex: 10,
        display: 'flex',
        gap: '16px',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
      }}>
        {legendItems.map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: item.color, display: 'inline-block' }} />
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#475569' }}>{item.label}</span>
          </div>
        ))}
      </div>

      {/* React Flow Workspace */}
      <div style={{ flex: 1, width: '100%', height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.5}
          maxZoom={1.5}
        >
          <Background color="#cbd5e1" gap={16} size={1} />
          <Controls position="bottom-left" style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }} />
          <MiniMap 
            position="bottom-right" 
            nodeColor={(node) => {
              const role = node.data?.role;
              if (role === 'SUPER ADMIN') return '#10b981';
              if (role === 'VICE CHANCELLOR') return '#a855f7';
              if (role === 'HEAD OF DEPT') return '#ef4444';
              return '#2563eb';
            }}
            style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}
