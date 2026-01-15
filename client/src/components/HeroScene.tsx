'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere, MeshTransmissionMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';

function MorphingBlob() {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.rotation.x += 0.002;
            meshRef.current.rotation.y += 0.003;
            const time = state.clock.getElapsedTime();
            meshRef.current.position.y = Math.sin(time * 0.5) * 0.2;
        }
    });

    return (
        <Float speed={2} rotationIntensity={1} floatIntensity={2}>
            <Sphere ref={meshRef} args={[1, 64, 64]} scale={1.5}>
                <MeshTransmissionMaterial
                    backside
                    samples={16}
                    thickness={0.5}
                    roughness={0.1}
                    transmission={1}
                    ior={1.2}
                    chromaticAberration={0.05}
                    anisotropy={0.1}
                    distortion={0.5}
                    distortionScale={0.5}
                    temporalDistortion={0.1}
                    color="#a855f7"
                />
            </Sphere>
        </Float>
    );
}

function Particles({ count = 100 }) {
    const mesh = useRef<THREE.InstancedMesh>(null);

    const particles = useMemo(() => {
        const temp = [];
        for (let i = 0; i < count; i++) {
            const t = Math.random() * 100;
            const factor = 20 + Math.random() * 100;
            const speed = 0.01 + Math.random() / 200;
            const xFactor = -50 + Math.random() * 100;
            const yFactor = -50 + Math.random() * 100;
            const zFactor = -50 + Math.random() * 100;
            temp.push({ t, factor, speed, xFactor, yFactor, zFactor, mx: 0, my: 0 });
        }
        return temp;
    }, [count]);

    useFrame((state) => {
        particles.forEach((particle, i) => {
            let { t, factor, speed, xFactor, yFactor, zFactor } = particle;
            t = particle.t += speed / 2;
            const a = Math.cos(t) + Math.sin(t * 1) / 10;
            const b = Math.sin(t) + Math.cos(t * 2) / 10;
            const s = Math.cos(t);
            particle.mx += (state.mouse.x * 1000 - particle.mx) * 0.01;
            particle.my += (state.mouse.y * 1000 - particle.my) * 0.01;
            const dummy = new THREE.Object3D();
            dummy.position.set(
                (particle.mx / 10) * a + xFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 1) * factor) / 10,
                (particle.my / 10) * b + yFactor + Math.sin((t / 10) * factor) + (Math.cos(t * 2) * factor) / 10,
                (particle.my / 10) * b + zFactor + Math.cos((t / 10) * factor) + (Math.sin(t * 3) * factor) / 10
            );
            dummy.scale.set(s, s, s);
            dummy.rotation.set(s * 5, s * 5, s * 5);
            dummy.updateMatrix();
            if (mesh.current) mesh.current.setMatrixAt(i, dummy.matrix);
        });
        if (mesh.current) mesh.current.instanceMatrix.needsUpdate = true;
    });

    return (
        <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshStandardMaterial color="#ffffff" emissive="#a855f7" emissiveIntensity={2} />
        </instancedMesh>
    );
}

export default function HeroScene() {
    return (
        <div className="absolute inset-0 z-0">
            <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
                <ambientLight intensity={0.5} />
                <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
                <pointLight position={[-10, -10, -10]} intensity={1} color="#a855f7" />

                <MorphingBlob />
                <Particles count={50} />

                <Environment preset="city" />
            </Canvas>
        </div>
    );
}
