## Why

Hoje não há como saber onde cada wallpaper foi implantado. O schema tem um campo `comarcaName` que nunca recebeu entrada no formulário — está vazio em 100% dos registros, aparece em branco nos cards do histórico e produz nomes de download quebrados (`oabma--wifi.png`). Ao mesmo tempo, um wallpaper gerado com o SSID ou a senha errados é hoje irrecuperável: a única saída é excluir e gerar outro, perdendo o registro.

## What Changes

- **BREAKING** — `Wallpaper.comarcaName` é renomeado para `Wallpaper.location`. O campo muda de nome no banco, no DTO da API e na resposta de todos os endpoints de wallpaper.
- Formulário de geração ganha o campo **Localização**, obrigatório, com limite de 80 caracteres.
- Registros existentes recebem `location = "São Luís"` por backfill na migration. O valor não vira padrão para novos registros.
- Histórico ganha edição por wallpaper: Localização, SSID, senha, tipo de segurança e template.
- Alterar qualquer campo que componha a imagem (SSID, senha, segurança, template) regera o PNG e o QR Code, publica em um novo caminho no storage e remove o arquivo antigo. Alterar apenas a Localização faz atualização direta no banco, sem regeração.
- Novo endpoint `PATCH /api/wallpapers/{id}`.
- Nome do arquivo de download passa a usar a Localização, corrigindo o hífen duplo atual.
- A imagem gerada não muda: Localização é metadado de gestão e não é impressa no wallpaper.

## Capabilities

### New Capabilities
- `wallpaper-location`: registro e exibição do local de implantação de cada wallpaper, incluindo obrigatoriedade na geração e backfill do acervo existente.
- `wallpaper-editing`: alteração de um wallpaper já gerado a partir do histórico, com regeração condicional da imagem e do QR Code quando os dados embutidos mudam.

### Modified Capabilities

Nenhuma. `openspec/specs/` ainda não tem baseline — esta é a primeira change do projeto.

## Impact

**Banco de dados** — migration de rename em `Wallpaper.comarcaName` → `location` mais `UPDATE` de backfill. Aplicada em produção pelo `entrypoint.sh`, que já roda `prisma migrate deploy` no boot.

**API** — `WallpaperDto.comarcaName` → `location` (quebra qualquer consumidor externo do endpoint); novo `PATCH /api/wallpapers/{id}`; `docs/openapi.yaml` atualizado.

**Código** — `prisma/schema.prisma`, `src/lib/types.ts`, `src/lib/validations.ts`, `src/lib/repositories/wallpaper.repository.ts`, `src/lib/services/wallpaper.service.ts`, `src/app/api/wallpapers/route.ts`, `src/app/api/wallpapers/[id]/route.ts`, `src/app/api/wallpapers/[id]/download/route.ts`, `src/components/WallpaperGenerator.tsx`, `src/components/WallpaperHistory.tsx`.

**Storage** — a regeração passa a criar e apagar objetos no MinIO dentro do fluxo de edição. Caminhos de wallpaper passam a ser únicos por identificador em vez de timestamp, eliminando a colisão entre requisições concorrentes e garantindo invalidação de cache do proxy de imagem, que serve com `max-age` de um ano.

**Fora de escopo** — autenticação nas rotas de escrita. `PATCH` e `DELETE` continuam abertos como o resto da aplicação. O sistema está público na internet, e isso deve ser tratado em uma change própria.
