import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { Box, Crosshair, Focus, Maximize2, Minimize2, RotateCw } from 'lucide-react';
import { PROCEDURE_LABEL, STATUS_META, toothName } from '../../features/tooth-procedures/constants';
import { displayStatus, isExtracted } from '../../features/tooth-procedures/state';
import type { Dentition, ToothFace, ToothState } from '../../features/tooth-procedures/types';
import type { ToothPointerHandler } from './FrontalArchSvg';
import { AnatomicalArchSvg } from './AnatomicalArchSvg';
import { Legend } from './Legend';
import { SchematicChart } from './SchematicChart';
import { ToothFacesView } from './ToothFacesView';
import { ModelErrorBoundary } from './ModelErrorBoundary';

const Glb3DViewer = lazy(() => import('./Glb3DViewer'));

type ViewTab = '3d' | '2d' | 'faces';

const TABS: { id: ViewTab; label: string }[] = [
  { id: '3d', label: 'Anatômico' },
  { id: '2d', label: '2D (Esquema)' },
  { id: 'faces', label: 'Faces do dente' },
];

type Props = {
  states: Map<string, ToothState>;
  selected: string[];
  activeTooth: string | null;
  selectedFaces: ToothFace[];
  dentition: Dentition;
  readOnly: boolean;
  onToggleTooth: (tooth: string) => void;
  onActivateTooth: (tooth: string) => void;
  onToggleFace: (face: ToothFace) => void;
  onDentitionChange: (dentition: Dentition) => void;
};

type Tooltip = { tooth: string; x: number; y: number } | null;

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function OdontogramViewer({
  states,
  selected,
  activeTooth,
  selectedFaces,
  dentition,
  readOnly,
  onToggleTooth,
  onActivateTooth,
  onToggleFace,
  onDentitionChange,
}: Props) {
  const cardRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<ViewTab>('3d');
  // Open with the two anatomical SVG arches; the cube button optionally enables 3D.
  const [use3d, setUse3d] = useState(false);
  const [mirrored, setMirrored] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [singleTooth, setSingleTooth] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [tooltip, setTooltip] = useState<Tooltip>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [modelFailed, setModelFailed] = useState(false);
  const glbReady = dentition === 'permanent' && !modelFailed;
  const showGlb = tab === '3d' && use3d && glbReady;
  const focusTooth = singleTooth ? activeTooth : null;
  const onUnavailable = useCallback(() => setModelFailed(true), []);

  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === cardRef.current);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const onHover = useCallback<ToothPointerHandler>((tooth, anchor) => {
    const stage = stageRef.current;
    if (!tooth || !anchor || !stage) {
      setTooltip(null);
      return;
    }
    const rect = stage.getBoundingClientRect();
    const halfWidth = Math.min(140, (rect.width - 24) / 2);
    setTooltip({ tooth,
      x: Math.max(halfWidth + 12, Math.min(rect.width - halfWidth - 12, anchor.x - rect.left)),
      y: Math.max(112, anchor.y - rect.top),
    });
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void cardRef.current?.requestFullscreen?.();
    }
  };

  const frame = () => {
    setSingleTooth(false);
    setMirrored(false);
    setAutoRotate(false);
    setResetKey((value) => value + 1);
  };

  const rotate = () => {
    if (showGlb) setAutoRotate((value) => !value);
    else setMirrored((value) => !value);
  };

  const tooltipState = tooltip ? states.get(tooltip.tooth) : undefined;
  const tooltipStatus = displayStatus(tooltipState);

  return (
    <section ref={cardRef} className={`odg-viewer${fullscreen ? ' is-fullscreen' : ''}`} aria-label="Odontograma">
      <header className="odg-viewer-header">
        <div>
          <h2>Odontograma {showGlb ? '3D' : '2D'}</h2>
          <p>
            {readOnly
              ? 'Visualização histórica — somente leitura.'
              : 'Clique nos dentes ou nos números para selecionar.'}
            {mirrored && !showGlb ? ' Visão do paciente.' : ''}
            {showGlb ? ' Arraste para girar; use a roda para aproximar.' : ''}
          </p>
        </div>
        <div className="odg-segmented" role="group" aria-label="Dentição">
          <button
            type="button"
            aria-pressed={dentition === 'permanent'}
            className={dentition === 'permanent' ? 'is-active' : ''}
            onClick={() => onDentitionChange('permanent')}
          >
            Permanentes
          </button>
          <button
            type="button"
            aria-pressed={dentition === 'deciduous'}
            className={dentition === 'deciduous' ? 'is-active' : ''}
            onClick={() => onDentitionChange('deciduous')}
          >
            Decíduos
          </button>
        </div>
      </header>

      <div ref={stageRef} className={`odg-stage odg-stage-${tab}`}>
        {tab !== 'faces' ? (
          <div className="odg-toolbar" role="toolbar" aria-label="Controles do odontograma" aria-orientation="vertical">
            <button
              type="button"
              className={showGlb ? 'is-active' : ''}
              aria-pressed={showGlb}
              disabled={tab !== '3d' || !glbReady}
              title={glbReady ? 'Alternar modelo 3D' : 'Modelo 3D indisponível — exibindo arcadas anatômicas em 2D'}
              aria-label="Alternar modelo 3D"
              onClick={() => setUse3d((value) => !value)}
            >
              <Box size={18} />
            </button>
            <button
              type="button"
              className={singleTooth ? 'is-active' : ''}
              aria-pressed={singleTooth}
              disabled={!activeTooth || tab === '2d'}
              title={activeTooth ? `Visualizar somente o dente ${activeTooth}` : 'Selecione um dente para visualizá-lo sozinho'}
              aria-label="Visualizar dente único"
              onClick={() => setSingleTooth((value) => !value)}
            >
              <Focus size={18} />
            </button>
            <button type="button" title="Enquadrar / resetar câmera" aria-label="Enquadrar e resetar câmera" onClick={frame}>
              <Crosshair size={18} />
            </button>
            <button
              type="button"
              className={(showGlb ? autoRotate : mirrored) ? 'is-active' : ''}
              aria-pressed={showGlb ? autoRotate : mirrored}
              title={showGlb ? 'Girar automaticamente' : 'Girar para a visão do paciente'}
              aria-label="Girar"
              onClick={rotate}
            >
              <RotateCw size={18} />
            </button>
          </div>
        ) : null}

        <div className="odg-canvas-wrap">
          {tab === '3d' && showGlb ? (
            <ModelErrorBoundary onError={onUnavailable} fallback={null}>
            <Suspense fallback={<div className="odg-loading" role="status">Carregando modelo 3D…</div>}>
              <Glb3DViewer
                states={states}
                selected={selected}
                hovered={tooltip?.tooth ?? null}
                autoRotate={autoRotate}
                resetKey={resetKey}
                focusTooth={focusTooth}
                onToggle={onToggleTooth}
                onHover={onHover}
                onUnavailable={onUnavailable}
              />
            </Suspense>
            </ModelErrorBoundary>
          ) : null}
          {tab === '3d' && !showGlb ? (
            <AnatomicalArchSvg
              key={resetKey}
              dentition={dentition}
              states={states}
              selected={selected}
              mirrored={mirrored}
              focusTooth={focusTooth}
              onToggle={onToggleTooth}
              onHover={onHover}
            />
          ) : null}
          {tab === '2d' ? (
            <SchematicChart
              dentition={dentition}
              states={states}
              selected={selected}
              mirrored={mirrored}
              onToggle={onToggleTooth}
              onHover={onHover}
            />
          ) : null}
          {tab === 'faces' ? (
            <ToothFacesView
              tooth={activeTooth}
              selectedTeeth={selected}
              state={activeTooth ? states.get(activeTooth) : undefined}
              selectedFaces={selectedFaces}
              readOnly={readOnly}
              mirrored={mirrored}
              onToggleFace={onToggleFace}
              onActivateTooth={onActivateTooth}
            />
          ) : null}
        </div>

        {tab === '3d' && !showGlb ? (
          <p className="odg-fallback-notice" role="status">
            {dentition === 'deciduous'
              ? 'Dentição decídua · visualização anatômica 2D'
              : modelFailed
                ? 'Modelo 3D indisponível · visualização anatômica 2D'
                : 'Visualização anatômica 2D'}
          </p>
        ) : null}

        {tooltip ? (
          <div className="odg-tooltip" role="status" style={{ left: tooltip.x, top: tooltip.y }}>
            <strong>Dente {tooltip.tooth}</strong>
            <span>{toothName(tooltip.tooth)}</span>
            {tooltipState ? (
              <span>
                <i style={{ background: STATUS_META[tooltipStatus].fill }} aria-hidden="true" />
                {isExtracted(tooltipState) ? 'Extraído' : STATUS_META[tooltipStatus].label}
                {' · '}
                {PROCEDURE_LABEL[tooltipState.procedureType]} em {formatDate(tooltipState.recordedAt)}
              </span>
            ) : (
              <span className="odg-tooltip-muted">Sem procedimentos registrados</span>
            )}
          </div>
        ) : null}

        <div className="odg-stage-footer">
          <div className="odg-tabs" role="tablist" aria-label="Modo de visualização">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={tab === item.id}
                className={tab === item.id ? 'is-active' : ''}
                onClick={() => {
                  setTab(item.id);
                  setTooltip(null);
                }}
              >
                {item.id === '3d' && showGlb ? '3D' : item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="odg-fullscreen"
            aria-label={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            title={fullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
            onClick={toggleFullscreen}
          >
            {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        </div>
      </div>

      <Legend />
    </section>
  );
}
