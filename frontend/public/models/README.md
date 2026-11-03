# Arcada 3D do odontograma

O arquivo utilizado pela aplicação é **`frontend/public/models/arcada.glb`**, servido na URL **`/models/arcada.glb`**. `public` não faz parte da URL. Não é necessário alterar o backend.

A tela abre por padrão na visualização **anatômica 2D**, com as arcadas superior e inferior lado a lado. O modelo 3D é opcional e só é carregado quando o usuário ativa o botão de cubo na barra lateral.

O GLB incluído é uma ilustração tridimensional original, gerada por `frontend/scripts/generate-arcada.mjs`: 32 coroas com geometrias próprias por grupo anatômico, duas gengivas curvas e colos gengivais individuais. Não é um escaneamento de paciente nem uma reprodução exata da imagem de referência. Para reproduzir uma escultura/scan específico, substitua esse arquivo pelo GLB correspondente, mantendo o contrato abaixo.

## Contrato de exportação

- glTF 2.0 binário, malhas estáticas, sem Draco/Meshopt e sem recursos externos. Texturas, se utilizadas, devem estar embutidas. Isso evita depender de decodificadores em CDN.
- Exatamente um objeto **Mesh** por dente, nomeado `tooth_FDI`. Nomeie o objeto no Blender, não apenas seu material. Não una a arcada inteira em um mesh.
- Os 32 nomes válidos são:

```text
Superior: tooth_18 tooth_17 tooth_16 tooth_15 tooth_14 tooth_13 tooth_12 tooth_11
          tooth_21 tooth_22 tooth_23 tooth_24 tooth_25 tooth_26 tooth_27 tooth_28
Inferior: tooth_48 tooth_47 tooth_46 tooth_45 tooth_44 tooth_43 tooth_42 tooth_41
          tooth_31 tooth_32 tooth_33 tooth_34 tooth_35 tooth_36 tooth_37 tooth_38
```

- FDI considera o lado do **paciente**: 1 = superior direito, 2 = superior esquerdo, 3 = inferior esquerdo, 4 = inferior direito. O segundo dígito vai do incisivo central (1) ao terceiro molar (8). Não existem códigos 19, 20 ou 49.
- Use `gingiva_upper`, `gingiva_lower` e, opcionalmente, `gingiva_11`, etc., para gengivas. Objetos sem nomes FDI recebem acabamento fosco e não são selecionáveis.
- Sistema glTF: **+Y para cima, +Z anterior, lado direito do paciente em −X**. Posicione as duas arcadas com abertura suficiente para enxergar as coroas. Exporte a conversão de eixos pelo Blender. Escala e centro são normalizados pelo visualizador; rotação não é adivinhada.
- Preserve incisivos em lâmina, caninos com cúspide, pré-molares bicuspidados e molares largos com sulcos. A gengiva precisa fazer parte do modelo e envolver os colos; o carregador não reconstrói anatomia de um scan unido.
- Para nomes legados, preencha `TOOTH_MESH_NAMES` em `src/components/dental-chart/archModel.ts`, por exemplo `'Upper_Right_Central': '11'`. Cada alias deve mapear um único mesh. Nomes duplicados ou dentes ausentes ativam o fallback, com o motivo no console.
- A dentição decídua usa o SVG anatômico com códigos 51–85 válidos; o GLB permanente não é renumerado como se fosse infantil.

## Código e comportamento

- `Glb3DViewer.tsx`: React Three Fiber, `useGLTF`, `MeshPhysicalMaterial`, iluminação ambiente/direcional, `Environment` local com `Lightformer`, `ContactShadows` e `OrbitControls` limitado. O chunk 3D é carregado sob demanda.
- `archModel.ts`: validação FDI, normalização, clonagem e materiais independentes, sem modificar o cache compartilhado do loader.
- `ProjectedToothLabels.tsx`: badges em `drei/Html`, botões acessíveis por teclado e guias SVG recalculadas com `Vector3.project(camera)` em cada frame. Em telas pequenas, distribui os números em duas linhas por arcada.
- `OdontogramViewer.tsx`: integração com seleção múltipla e estado clínico existentes. Clique alterna a seleção; arrastar a câmera não seleciona. A seleção aparece em azul e a cor clínica permanece no sublinhado do número e no tooltip.
- `AnatomicalArchSvg.tsx`: fallback com arcadas curvas, formas por tipo, sulcos, gradientes e sombras. Mantém seleção e cores. Usado quando o GLB falha, é inválido, demora mais de 20 segundos, ou o contexto WebGL é perdido/indisponível.

## Executar e validar

Na pasta `frontend`:

```sh
npm install
npm run dev
# Abra a URL local impressa pelo Vite.
# Para dados fictícios, sem login: /odontogram-preview.html

npm run build
npm test

# Regerar apenas a ilustração incluída (sobrescreve arcada.glb):
node scripts/generate-arcada.mjs
```

A prévia isolada não é entrada do build de produção. Para testar fallback manualmente, renomeie temporariamente `arcada.glb`, recarregue a prévia e restaure o nome ao terminar. Após substituir o GLB, recarregue a página para limpar o cache em memória de `useGLTF`.

Referências das APIs: [Canvas e tratamento de erros](https://r3f.docs.pmnd.rs/api/canvas), [Lightformer](https://drei.docs.pmnd.rs/staging/lightformer).
