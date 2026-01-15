'use client';

import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';

import * as THREE from 'three';

interface RiskNode {
    id: string;
    position: [number, number, number];
    color: string;
    size: number;
    name: string;
    riskScore: number;
}

interface RiskHeatmap3DProps {
    contracts: any[];
    onNodeHover: (node: RiskNode | null) => void;
}

function Cloud({ contracts, onNodeHover }: RiskHeatmap3DProps) {
    const pointsRef = useRef<THREE.Points>(null);

    // Generate positions and colors for each contract
    const nodes = useMemo(() => {
        return contracts.map((contract, i) => {
            // Distribute nodes roughly in a sphere
            const phi = Math.acos(-1 + (2 * i) / contracts.length);
            const theta = Math.sqrt(contracts.length * Math.PI) * phi;

            const radius = 2.5;
            const x = radius * Math.cos(theta) * Math.sin(phi);
            const y = radius * Math.sin(theta) * Math.sin(phi);
            const z = radius * Math.cos(phi);

            // Map risk score (0-10) to color
            // 0-3: Emerald/Low, 4-7: Amber/Medium, 8-10: Red/High
            let color = '#10b981'; // Emerald
            if (contract.overallRiskScore >= 7) color = '#ef4444'; // Red
            else if (contract.overallRiskScore >= 4) color = '#f59e0b'; // Amber

            return {
                id: contract._id,
                position: [x, y, z] as [number, number, number],
                color,
                size: 0.15 + (contract.overallRiskScore / 20),
                name: contract.contractFileName,
                riskScore: contract.overallRiskScore
            };
        });
    }, [contracts]);

    const positions = useMemo(() => {
        const pos = new Float32Array(nodes.length * 3);
        nodes.forEach((node, i) => {
            pos[i * 3] = node.position[0];
            pos[i * 3 + 1] = node.position[1];
            pos[i * 3 + 2] = node.position[2];
        });
        return pos;
    }, [nodes]);

    const colors = useMemo(() => {
        const cols = new Float32Array(nodes.length * 3);
        nodes.forEach((node, i) => {
            const color = new THREE.Color(node.color);
            cols[i * 3] = color.r;
            cols[i * 3 + 1] = color.g;
            cols[i * 3 + 2] = color.b;
        });
        return cols;
    }, [nodes]);

    useFrame((state) => {
        if (pointsRef.current) {
            pointsRef.current.rotation.y += 0.002;
            pointsRef.current.rotation.x += 0.001;
        }
    });

    return (
        <group>
            <Points ref={pointsRef} positions={positions} colors={colors} stride={3}>
                <PointMaterial
                    transparent
                    vertexColors
                    size={0.1}
                    sizeAttenuation={true}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </Points>

            {/* Invisible larger spheres for hover detection */}
            {nodes.map((node) => (
                <mesh
                    key={node.id}
                    position={node.position}
                    onPointerOver={() => onNodeHover(node)}
                    onPointerOut={() => onNodeHover(null)}
                >
                    <sphereGeometry args={[0.2, 16, 16]} />
                    <meshBasicMaterial visible={false} />
                </mesh>
            ))}
        </group>
    );
}

export default function RiskHeatmap3D({ contracts, onNodeHover }: RiskHeatmap3DProps) {
    return (
        <div className="w-full h-[600px] relative">
            <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <Cloud contracts={contracts} onNodeHover={onNodeHover} />
            </Canvas>

            {/* Legend or overlay */}
            <div className="absolute bottom-4 left-4 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 text-[10px] font-bold tracking-widest uppercase space-y-2">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                    <span className="text-slate-400">High Risk (7.0+)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]" />
                    <span className="text-slate-400">Medium Risk (4.0-6.9)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                    <span className="text-slate-400">Low Risk (0.0-3.9)</span>
                </div>
            </div>
        </div>
    );
}
