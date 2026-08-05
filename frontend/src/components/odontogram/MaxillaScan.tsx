import { Suspense, useEffect, useMemo, useState, type ReactNode, Component } from 'react';
import { Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

const MODEL_URL = '/models/maxilla_web.glb';

type Props = {
  cadToYUp?: boolean;
  scale?: number;
  position?: [number, number, number];
  /** Se true, não mostra aviso quando o arquivo não existe (só some). */
  silent?: boolean;
};

class ScanErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function MissingScanMessage() {
  return (
    <Html center>
      <div
        style={{
          maxWidth: 340,
          padding: '14px 16px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.95)',
          color: '#17394f',
          fontSize: 13,
          lineHeight: 1.45,
          textAlign: 'center',
          border: '1px solid #d7e7f3',
        }}
      >
        <strong style={{ display: 'block', marginBottom: 6 }}>Scan não encontrado</strong>
        Coloque o arquivo em
        <br />
        <code style={{ fontSize: 12 }}>frontend/public/models/maxilla_web.glb</code>
        <br />e atualize a página (F5).
        <br />
        <span style={{ color: '#587084', display: 'block', marginTop: 8 }}>
          As esferas de calibração continuam visíveis para ajuste.
        </span>
      </div>
    </Html>
  );
}

function MaxillaScanMesh({ cadToYUp = true, scale = 1, position = [0, 0, 0] }: Props) {
  const { scene } = useGLTF(MODEL_URL);

  const prepared = useMemo(() => {
    const clone = scene.clone(true);
    const enamel = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#f2ebe0'),
      roughness: 0.35,
      metalness: 0.05,
      clearcoat: 0.25,
      clearcoatRoughness: 0.4,
      sheen: 0.15,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color('#fff8f0'),
    });

    clone.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.material = enamel;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });

    return clone;
  }, [scene]);

  return (
    <group position={position} scale={scale} rotation={cadToYUp ? [-Math.PI / 2, 0, 0] : [0, 0, 0]}>
      <primitive object={prepared} />
    </group>
  );
}

/**
 * Scan 3D da maxila (malha única). Sem interação própria.
 * Se o .glb não existir, mostra aviso (ou nada, se silent).
 */
export default function MaxillaScan({ silent = false, ...props }: Props) {
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(MODEL_URL, { method: 'HEAD' })
      .then((response) => {
        if (!cancelled) setAvailable(response.ok);
      })
      .catch(() => {
        if (!cancelled) setAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (available === null) {
    if (silent) return null;
    return (
      <Html center>
        <div className="odo3d-label">Procurando scan...</div>
      </Html>
    );
  }

  if (!available) return silent ? null : <MissingScanMessage />;

  return (
    <ScanErrorBoundary fallback={silent ? null : <MissingScanMessage />}>
      <Suspense
        fallback={
          silent ? null : (
            <Html center>
              <div className="odo3d-label">Carregando scan...</div>
            </Html>
          )
        }
      >
        <MaxillaScanMesh {...props} />
      </Suspense>
    </ScanErrorBoundary>
  );
}
