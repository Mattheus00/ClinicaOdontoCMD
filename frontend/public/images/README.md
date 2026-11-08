# Fotografias ilustrativas

Selecionadas em 31/10/2026. Uso autorizado pelo responsável para compor a demonstração até a substituição por imagens próprias. Não representam instalações ou equipe da clínica fictícia. Sem fotos de pacientes ou funcionários identificados como reais.

Autor das duas fotografias: **Pavel Danilyuk**, Pexels.

- `clinic-room-*`: https://www.pexels.com/photo/a-dental-equipment-in-the-clinic-6812453/
- `clinic-detail-*`: https://www.pexels.com/photo/dental-chair-and-equipment-in-a-clinic-6812480/
- Licença consultada: https://www.pexels.com/license/

A licença permite uso e adaptação gratuitos, inclusive em sites, e não exige crédito. Crédito foi mantido voluntariamente nas legendas. Não permite sugerir endosso por pessoas/marcas, revender cópias inalteradas nem redistribuir como banco de imagens. Não há integração com a API Pexels, cookies ou carregamento remoto das fotografias.

As fotos foram baixadas de `images.pexels.com/photos/6812453/pexels-photo-6812453.jpeg?auto=compress&cs=tinysrgb&w=1600` e `images.pexels.com/photos/6812480/pexels-photo-6812480.jpeg?auto=compress&cs=tinysrgb&w=1000`. Fontes de trabalho ficam em `frontend/test-results/stock` (ignorado pelo Git).

Processamento local com Pillow: conversão RGB, recorte central via `ImageOps.fit` com Lanczos, WebP qualidade 78, método 6, sem copiar metadados. Proporção 6:5 para `clinic-room` e 4:5 para `clinic-detail`.

| Arquivo | Dimensões | Bytes |
| --- | --- | --- |
| clinic-room-480.webp | 480 × 400 | 16.026 |
| clinic-room-800.webp | 800 × 667 | 32.902 |
| clinic-room-1200.webp | 1200 × 1000 | 58.110 |
| clinic-detail-400.webp | 400 × 500 | 16.826 |
| clinic-detail-800.webp | 800 × 1000 | 44.486 |

Todas as variantes ficam abaixo de 300.000 bytes. A home usa `srcset`/`sizes`, dimensões explícitas e legenda; foto inicial prioritária e foto secundária com carregamento preguiçoso. Para substituir: manter proporções/variantes ou ajustar as dimensões no componente, conferir origem/autorização e medir novamente peso e nitidez. O logo original não foi alterado.
