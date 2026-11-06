import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useThree, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, Environment, Html, Lightformer, OrbitControls, useGLTF } from '@react-three/drei';
import { Box3, MathUtils, MeshPhysicalMaterial, PCFShadowMap, PerspectiveCamera, Vector3, WebGLRenderer } from 'three';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { GLB_MODEL_URL, SELECTED_META, STATUS_META } from '../../features/tooth-procedures/constants';
import { displayStatus, isExtracted } from '../../features/tooth-procedures/state';
import type { ToothState } from '../../features/tooth-procedures/types';
import type { ToothPointerHandler } from './FrontalArchSvg';
import { fdiFromMeshName, prepareArchModel } from './archModel';
import { ProjectedToothLabels } from './ProjectedToothLabels';

type Props = {
  states: Map<string, ToothState>;
  selected: string[];
  hovered: string | null;
  autoRotate: boolean;
  resetKey: number;
  focusTooth: string | null;
  onToggle: (tooth: string) => void;
  onHover: ToothPointerHandler;
  onUnavailable: () => void;
};

function ContextGuard({ onUnavailable }: Pick<Props, 'onUnavailable'>) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const canvas = gl.domElement;
    const lost = (event: Event) => { event.preventDefault(); onUnavailable(); };
    canvas.addEventListener('webglcontextlost', lost);
    return () => canvas.removeEventListener('webglcontextlost', lost);
  }, [gl, onUnavailable]);
  return null;
}

function LoadingModel({ onUnavailable }: Pick<Props, 'onUnavailable'>) {
  useEffect(() => {
    const timeout = window.setTimeout(onUnavailable, 20000);
    return () => window.clearTimeout(timeout);
  }, [onUnavailable]);
  return <Html center><div className="odg-loading" role="status">Carregando a arcada 3D…</div></Html>;
}
function ArchScene({ states, selected, hovered, focusTooth, autoRotate, resetKey, onToggle, onHover }: Props) {
  const { scene } = useGLTF(GLB_MODEL_URL, false, true);
  const model = useMemo(() => prepareArchModel(scene), [scene]);
  const invalidate = useThree((state) => state.invalidate);
  const camera = useThree((state) => state.camera);
  const size = useThree((state) => state.size);
  const controls = useRef<OrbitControlsImpl>(null);
  const focus = model.teeth.find(({ fdi }) => fdi === focusTooth);
  const visibleTeeth = useMemo(() => focus ? [focus] : model.teeth, [focus, model]);
  useEffect(() => () => model.dispose(), [model]);
  useEffect(() => {
    model.teeth.forEach(({ fdi, mesh }) => {
      const state = states.get(fdi);
      const status = displayStatus(state);
      const active = selected.includes(fdi);
      const color = active ? SELECTED_META.fill : status === 'HEALTHY' ? '#fffaf0' : STATUS_META[status].fill;
      const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      materials.forEach((material) => {
        if (!(material instanceof MeshPhysicalMaterial)) return;
        material.color.set(color);
        material.emissive.set(active ? '#254fc6' : '#6c8fc6');
        material.emissiveIntensity = active ? 0.12 : hovered === fdi ? 0.18 : 0;
        const extracted = isExtracted(state);
        if (material.transparent !== extracted) material.needsUpdate = true;
        material.transparent = extracted;
        material.opacity = extracted ? 0.2 : 1;
        material.depthWrite = !extracted;
      });
    });
    invalidate();
  }, [model, states, selected, hovered, invalidate]);
  useEffect(() => {
    model.root.traverse((object) => {
      if ('isMesh' in object) object.visible = !focus || object === focus.mesh;
    });
    if (!(camera instanceof PerspectiveCamera)) return;
    const box = new Box3().setFromObject(focus?.mesh ?? model.root);
    const center = box.getCenter(new Vector3());
    const vertical = MathUtils.degToRad(camera.fov / 2);
    const horizontal = Math.atan(Math.tan(vertical) * size.width / size.height);
    const direction = new Vector3(0, 0.4, 1).normalize();
    const right = new Vector3(1, 0, 0);
    const up = new Vector3().crossVectors(direction, right);
    const verticalSpace = Math.max(0.45, (size.height - 150) / size.height);
    const horizontalSpace = Math.max(0.6, (size.width - 45) / size.width);
    let distance = 0;
    for (const x of [box.min.x, box.max.x]) for (const y of [box.min.y, box.max.y]) for (const z of [box.min.z, box.max.z]) {
      const corner = new Vector3(x, y, z).sub(center);
      distance = Math.max(distance,
        Math.abs(corner.dot(right)) / (Math.tan(horizontal) * horizontalSpace) + corner.dot(direction),
        Math.abs(corner.dot(up)) / (Math.tan(vertical) * verticalSpace) + corner.dot(direction));
    }
    distance *= 1.08;
    camera.position.copy(center).add(direction.multiplyScalar(distance));
    camera.near = 0.01;
    camera.far = 200;
    camera.updateProjectionMatrix();
    camera.lookAt(center);
    if (controls.current) {
      controls.current.target.copy(center);
      controls.current.minDistance = distance * 0.66;
      controls.current.maxDistance = distance * 1.65;
      controls.current.update();
      controls.current.saveState();
    }
    invalidate();
  }, [camera, model, focus, resetKey, size.width, size.height, invalidate]);
  return <>
    <ambientLight intensity={0.65} />
    <directionalLight position={[-3, 7, 7]} intensity={2} castShadow shadow-mapSize={[1024, 1024]} shadow-normalBias={0.025} />
    <directionalLight position={[5, 2, -3]} intensity={0.55} color="#dfeaff" />
    <Environment resolution={128} frames={1}>
      <Lightformer form="rect" intensity={2} position={[-4, 6, 5]} scale={[6, 6, 1]} target={[0, 0, 0]} />
      <Lightformer form="rect" intensity={1.2} position={[5, 2, 3]} scale={[3, 5, 1]} target={[0, 0, 0]} />
    </Environment>
    <primitive object={model.root} dispose={null}
      onPointerMove={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        const fdi = fdiFromMeshName(event.object.name);
        onHover(fdi, fdi ? { x: event.nativeEvent.clientX, y: event.nativeEvent.clientY - 12 } : undefined);
      }} onPointerOut={() => onHover(null)}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        const fdi = fdiFromMeshName(event.object.name);
        if (fdi && event.delta <= 5) onToggle(fdi);
      }} />
    <ProjectedToothLabels teeth={visibleTeeth} states={states} selected={selected} hovered={hovered} onToggle={onToggle} onHover={onHover} />
    {!focus && <ContactShadows position={[0, model.floor, 0]} opacity={0.25} scale={14} blur={2.8} far={8} resolution={256} color="#586477" frames={1} />}
    <OrbitControls ref={controls} makeDefault enablePan={false} enableDamping dampingFactor={0.08}
      autoRotate={autoRotate} autoRotateSpeed={0.7} minPolarAngle={0.65} maxPolarAngle={1.65}
      minAzimuthAngle={-0.65} maxAzimuthAngle={0.65} />
  </>;
}

export default function Glb3DViewer(props: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [foreground, setForeground] = useState(() => !document.hidden);
  useEffect(() => {
    const visibility = () => setForeground(!document.hidden);
    document.addEventListener('visibilitychange', visibility);
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting));
    if (container.current) observer.observe(container.current);
    return () => { document.removeEventListener('visibilitychange', visibility); observer.disconnect(); };
  }, []);
  const active = foreground && inView;
  return <div ref={container} style={{ width: '100%', height: '100%' }}><Canvas className="odg-canvas" frameloop={!active ? 'never' : props.autoRotate ? 'always' : 'demand'} shadows={{ type: PCFShadowMap }} camera={{ position: [0, 4, 12], fov: 35 }} dpr={[1, 1.75]}
    gl={(defaults) => {
      try { return new WebGLRenderer({ ...defaults, antialias: true, alpha: true }); }
      catch (error) { props.onUnavailable(); throw error; }
    }} style={{ cursor: props.hovered ? 'pointer' : 'grab' }}>
    <ContextGuard onUnavailable={props.onUnavailable} />
    <Suspense fallback={<LoadingModel onUnavailable={props.onUnavailable} />}>
      <ArchScene {...props} autoRotate={active && props.autoRotate} />
    </Suspense>
  </Canvas></div>;
}
