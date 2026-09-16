import { Suspense, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { Physics } from '@react-three/rapier';
import { PALETTE, PHYSICS, RENDER, CAMERA } from './config';
import { City } from './City';
import { Simulation } from './Simulation';
import { useGame } from './store';
import { minimapBridge } from './minimapBridge';
import type { Quality } from './types';

function SkyDome() {
  const meshRef = useRef<THREE.Mesh>(null);
  const uniforms = useRef({
    topColor: {
      value: new THREE.Color().setStyle(PALETTE.skyTop, THREE.SRGBColorSpace),
    },
    bottomColor: {
      value: new THREE.Color().setStyle(PALETTE.skyBottom, THREE.SRGBColorSpace),
    },
    exponent: { value: 0.85 },
  });

  useFrame(({ camera }) => {
    meshRef.current?.position.copy(camera.position);
  });

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]} renderOrder={-1} frustumCulled={false}>
      <sphereGeometry args={[600, 24, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        toneMapped={false}
        fog={false}
        uniforms={uniforms.current}
        vertexShader={`
          varying vec3 vDir;
          void main() {
            vDir = normalize(position);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 topColor;
          uniform vec3 bottomColor;
          uniform float exponent;
          varying vec3 vDir;
          void main() {
            float h = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
            vec3 col = mix(
              bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)
            );
            gl_FragColor = vec4(col, 1.0);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `}
      />
    </mesh>
  );
}

function Lighting({ quality }: { quality: Quality }) {
  const settings = RENDER[quality];
  const ref = useRef<THREE.DirectionalLight>(null);

  useFrame(() => {
    const light = ref.current;
    if (!light || !settings.shadows) return;
    const px = minimapBridge.playerX;
    const pz = minimapBridge.playerZ;
    light.position.set(px - 120, 190, pz + 70);
    light.target.position.set(px, 0, pz);
    light.target.updateMatrixWorld();
  });

  return (
    <>
      <directionalLight
        ref={ref}
        position={[-120, 190, 70]}
        intensity={2.9}
        color={PALETTE.sun}
        castShadow={settings.shadows}
        shadow-mapSize-width={settings.shadowMapSize}
        shadow-mapSize-height={settings.shadowMapSize}
      />
      <hemisphereLight args={[PALETTE.ambient, '#4d5468', 1.9]} />
      <ambientLight intensity={1.0} color="#a8bcd8" />
    </>
  );
}

export function GameCanvas() {
  const quality = useGame((s) => s.quality);
  const control = useGame((s) => s.control);
  const resetToken = useGame((s) => s.resetToken);
  const started = useGame((s) => s.started);

  const settings = RENDER[quality];
  const paused = control === 'paused' || control === 'menu';

  return (
    <View style={styles.fill}>
      <Canvas
        shadows={settings.shadows}
        camera={{ fov: CAMERA.fov, near: 0.35, far: 900 }}
        gl={{
          antialias: quality === 'high',
          powerPreference: 'high-performance',
          alpha: false,
        }}
        onCreated={({ gl, scene }) => {
          gl.setClearColor(PALETTE.fog);
          scene.fog = new THREE.Fog(
            PALETTE.fog,
            settings.fogNear,
            settings.fogFar,
          );
        }}
        style={styles.fill}
      >
        <Suspense fallback={null}>
          <SkyDome />
          <Lighting quality={quality} />
          <Physics
            gravity={PHYSICS.gravity}
            timeStep={PHYSICS.timeStep}
            paused={paused}
            updateLoop="follow"
          >
            <City quality={quality} />
            {started && <Simulation key={resetToken} quality={quality} />}
          </Physics>
        </Suspense>
      </Canvas>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
