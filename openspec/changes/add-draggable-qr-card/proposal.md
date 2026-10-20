## Why

O QR Code é colado em coordenadas fixas, medidas na arte original da OAB (`src/lib/services/image-generator.ts`). Em artes com outro layout, como a "JusBrasil OAB" usada em produção, o QR cai em cima do título, e o texto de rede e senha, cinza-escuro, some no fundo verde. Hoje não há como corrigir isso sem mexer no código.

## What Changes

- O QR, o nome da rede e a senha passam a formar um **cartão branco** único, legível sobre qualquer arte. Na arte da OAB, na posição atual, o cartão fica dentro da área branca da arte, e o resultado continua visualmente igual.
- Na tela **Gerar**, a prévia passa a mostrar a arte com o cartão por cima. O usuário **arrasta** o cartão (mouse, toque ou teclado) e **redimensiona** por uma alça no canto. O lado do QR vai de 240 px a 640 px na imagem 1920 × 1080 (hoje é fixo em 331 px).
- Cada **template** ganha uma posição e um tamanho padrão do cartão, definidos no **Admin** arrastando o cartão sobre a própria arte. O Gerar começa nesse padrão.
- Cada **wallpaper** guarda a própria posição e o próprio tamanho. A edição pelo **Histórico** também permite reposicionar, e mudar posição ou tamanho regera a imagem.
- A prévia deixa de ser montada pelo servidor a cada digitação: o servidor gera só o cartão, por `POST`, e o navegador sobrepõe o cartão à arte. A senha do Wi-Fi deixa de trafegar na URL.
- **BREAKING (API)**: `GET /api/wallpapers/preview` é removido e substituído por `POST /api/wallpapers/card`. O único consumidor é o front-end deste repositório.
- `PATCH /api/templates/{id}` passa a validar o corpo com schema e a aceitar a posição padrão. Isso corrige o comportamento atual, em que um corpo sem `isActive` desativa o template.
- O schema de edição de wallpaper deixa de herdar o default `WPA` do schema de geração. Hoje, um `PATCH` sem `wifiSecurity` converte wallpapers WEP ou abertos para WPA.

## Capabilities

### New Capabilities
- `qr-card-placement`: cartão do QR com posição e tamanho escolhidos na geração e na edição, guardados por wallpaper e respeitados na renderização; prévia do cartão por `POST`.
- `template-qr-default`: posição e tamanho padrão do cartão por template, definidos no Admin e usados como ponto de partida na geração.

### Modified Capabilities

Nenhuma. `openspec/specs/` ainda não tem baseline. A change `add-wallpaper-location-and-edit` não foi arquivada; esta change amplia a regra de regeração condicional dela, já que posição e tamanho passam a regerar a imagem.

## Impact

**Banco de dados**: colunas novas e opcionais `qrLeft`, `qrTop` e `qrSize` em `Template` e em `Wallpaper`. A migration só adiciona colunas. Vazio significa a posição atual, então os registros existentes não mudam.

**API**: `POST /api/wallpapers` e `PATCH /api/wallpapers/{id}` aceitam posição e tamanho; os DTOs de template e de wallpaper passam a expô-los; entra `POST /api/wallpapers/card`; sai `GET /api/wallpapers/preview`; `PATCH /api/templates/{id}` ganha schema. `docs/openapi.yaml` é atualizado junto.

**Código**: `prisma/schema.prisma`, nova migration, `src/lib/validations.ts`, `src/lib/types.ts`, um módulo novo de posicionamento compartilhado entre servidor e navegador, `src/lib/services/image-generator.ts`, serviços e repositórios de template e de wallpaper, rotas de `src/app/api/`, um componente novo de posicionamento, `WallpaperGenerator`, `WallpaperPreview`, `WallpaperEditDialog` e `TemplateManager`.

**Fora de escopo**: autenticação nas rotas (dívida já registrada; as rotas novas nascem tão abertas quanto as existentes) e os demais pontos de segurança levantados na análise do projeto, como a rota `/api/debug-minio` e a listagem anônima do bucket, que merecem change própria.
