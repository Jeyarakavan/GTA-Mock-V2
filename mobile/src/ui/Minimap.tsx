import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Polygon, Rect } from 'react-native-svg';
import { PALETTE, WORLD } from '../game/config';
import { world } from '../game/store';
import { minimapBridge } from '../game/minimapBridge';
import { roadLineCoord } from '../game/world';

const DISTRICT_COLORS: Record<string, string> = {
  commercial: '#4f5a6d',
  residential: '#6f6053',
  industrial: '#525853',
  park: PALETTE.parkGrass,
  plaza: PALETTE.plaza,
  safehouse: '#6d5a78',
  garage: '#5a6468',
};

interface Props {
  size: number;
  viewRange: number;
}

/**
 * SVG minimap driven by the same WorldData as the 3D city (~20 Hz).
 */
export function Minimap({ size, viewRange }: Props) {
  const [, tick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => tick((n) => n + 1), 50);
    return () => clearInterval(id);
  }, []);

  const half = world.half;
  const px = minimapBridge.playerX;
  const pz = minimapBridge.playerZ;
  const spanMeters = viewRange > 0 ? viewRange : half * 2;
  const scale = size / spanMeters;
  const centerX = viewRange > 0 ? px : 0;
  const centerZ = viewRange > 0 ? pz : 0;

  const toX = (wx: number) => (wx - centerX) * scale + size / 2;
  const toY = (wz: number) => (wz - centerZ) * scale + size / 2;

  const roadW = Math.max(1, WORLD.roadWidth * scale);
  const pulse = 4.5 + Math.sin(Date.now() / 220) * 1.8;
  const yaw = -minimapBridge.playerYaw + Math.PI;

  const playerArrow = (() => {
    const cx = toX(px);
    const cy = toY(pz);
    const pts = [
      { x: 0, y: -7 },
      { x: 5, y: 6 },
      { x: 0, y: 3 },
      { x: -5, y: 6 },
    ].map((p) => {
      const rx = p.x * Math.cos(yaw) - p.y * Math.sin(yaw);
      const ry = p.x * Math.sin(yaw) + p.y * Math.cos(yaw);
      return `${cx + rx},${cy + ry}`;
    });
    return pts.join(' ');
  })();

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Rect x={0} y={0} width={size} height={size} fill="#20242e" />

        {world.blocks.map((b, i) => {
          const s = b.size * scale;
          return (
            <Rect
              key={i}
              x={toX(b.x) - s / 2}
              y={toY(b.z) - s / 2}
              width={s}
              height={s}
              fill={DISTRICT_COLORS[b.district] ?? '#4a5160'}
            />
          );
        })}

        {Array.from({ length: WORLD.gridCols + 1 }, (_, c) => {
          const x = toX(roadLineCoord(c, WORLD.gridCols));
          return (
            <Line
              key={`c${c}`}
              x1={x}
              y1={toY(-half)}
              x2={x}
              y2={toY(half)}
              stroke="#2f3540"
              strokeWidth={roadW}
            />
          );
        })}
        {Array.from({ length: WORLD.gridRows + 1 }, (_, r) => {
          const y = toY(roadLineCoord(r, WORLD.gridRows));
          return (
            <Line
              key={`r${r}`}
              x1={toX(-half)}
              y1={y}
              x2={toX(half)}
              y2={y}
              stroke="#2f3540"
              strokeWidth={roadW}
            />
          );
        })}

        <Rect
          x={toX(-half)}
          y={toY(-half)}
          width={half * 2 * scale}
          height={half * 2 * scale}
          fill="none"
          stroke={PALETTE.neonTeal}
          strokeWidth={2}
        />

        <Polygon
          points={`${toX(world.safehouse.x)},${toY(world.safehouse.z) - 6} ${toX(world.safehouse.x) + 5},${toY(world.safehouse.z) + 4} ${toX(world.safehouse.x) - 5},${toY(world.safehouse.z) + 4}`}
          fill={PALETTE.neonTeal}
        />

        <Rect
          x={toX(world.garage.x) - 4}
          y={toY(world.garage.z) - 4}
          width={8}
          height={8}
          fill={PALETTE.neonOrange}
        />

        {minimapBridge.missionStarts.map((m, i) => (
          <Circle
            key={`ms${i}`}
            cx={toX(m.x)}
            cy={toY(m.z)}
            r={4.5}
            fill="#ffd66b"
            stroke="#1b1e24"
            strokeWidth={1.5}
          />
        ))}

        {minimapBridge.objective && (
          <Circle
            cx={toX(minimapBridge.objective.x)}
            cy={toY(minimapBridge.objective.z)}
            r={pulse}
            fill={PALETTE.neonPink}
            stroke="#ffffff"
            strokeWidth={1.5}
          />
        )}

        {minimapBridge.police.map((p, i) => (
          <Circle
            key={`pol${i}`}
            cx={toX(p.x)}
            cy={toY(p.z)}
            r={3.5}
            fill="#4aa8ff"
          />
        ))}

        <Polygon points={playerArrow} fill="#ffffff" stroke="#12151b" strokeWidth={1.2} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    borderRadius: 8,
  },
});
