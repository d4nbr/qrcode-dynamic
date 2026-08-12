## 1. Banco de dados

- [x] 1.1 Renomear `comarcaName` para `location` em `prisma/schema.prisma`
- [x] 1.2 Escrever à mão a migration com `ALTER TABLE "Wallpaper" RENAME COLUMN "comarcaName" TO "location"` seguido do backfill `UPDATE ... SET "location" = 'São Luís' WHERE "location" = ''`
- [x] 1.3 Regerar o Prisma Client e confirmar que o tipo `Wallpaper` expõe `location`

## 2. Domínio e validação

- [x] 2.1 Trocar `comarcaName` por `location` em `WallpaperDto` e `GenerateWallpaperInput` (`src/lib/types.ts`)
- [x] 2.2 Tornar `location` obrigatório em `generateWallpaperSchema`, com limite de 80 caracteres e mensagens em português
- [x] 2.3 Criar `updateWallpaperSchema` com todos os campos opcionais, derivado do schema de geração para não duplicar regras
- [x] 2.4 Ajustar `sanitizeFilename` ou seu uso no download para devolver `oabma-wallpaper-wifi.png` quando a normalização resultar em string vazia

## 3. Repositório e serviço

- [x] 3.1 Adicionar `update` ao `wallpaperRepository`, retornando o registro com o template incluído
- [x] 3.2 Trocar `wallpapers/${Date.now()}.png` por caminho único com identificador gerado, na criação e na regeração
- [x] 3.3 Implementar `wallpaperService.update`: carregar o registro, comparar campos, decidir entre atualização simples e regeração
- [x] 3.4 Na regeração, validar o template alvo (existente e ativo), recompor a imagem, recalcular `qrContent`, publicar no caminho novo, atualizar o registro e só então remover o objeto antigo
- [x] 3.5 Propagar `location` no `toDto` e em todos os pontos que hoje leem `comarcaName`

## 4. API

- [x] 4.1 Criar o handler `PATCH` em `src/app/api/wallpapers/[id]/route.ts` com validação, `404` para wallpaper inexistente e `400` para payload inválido
- [x] 4.2 Ajustar `POST /api/wallpapers` para aceitar e exigir `location`
- [x] 4.3 Atualizar `src/app/api/wallpapers/[id]/download/route.ts` para derivar o nome do arquivo de `location`
- [x] 4.4 Atualizar `docs/openapi.yaml`: renomear a propriedade no schema de wallpaper e documentar o `PATCH`

## 5. Interface

- [x] 5.1 Adicionar o campo Localização ao `WallpaperGenerator`, como primeiro campo do formulário, com validação e mensagem de erro
- [x] 5.2 Exibir a Localização em destaque no card do histórico, com ícone de local, e o nome do template abaixo
- [x] 5.3 Construir o formulário de edição no histórico, pré-preenchido, com os cinco campos editáveis e carregamento da lista de templates ativos
- [x] 5.4 Ligar a edição a uma mutation `PATCH`, com estado de carregamento, exibição de erro e invalidação da query `wallpapers` no sucesso
- [x] 5.5 Garantir que a miniatura reflita a imagem regerada após o salvamento

## 6. Verificação

- [x] 6.1 Rodar `pnpm biome check` e o build do Next.js sem erros de tipo
- [ ] 6.2 Verificar o fluxo completo: gerar com localização, editar só a localização (sem troca de imagem), editar o SSID (com troca de imagem) e baixar conferindo o nome do arquivo
- [ ] 6.3 Ler o QR Code do wallpaper regerado com um celular e confirmar a conexão na rede correta
- [x] 6.4 Rodar `openspec validate add-wallpaper-location-and-edit --strict`
