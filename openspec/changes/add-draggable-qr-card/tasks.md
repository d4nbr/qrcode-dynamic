## 1. Banco de dados

- [x] 1.1 Adicionar `qrLeft`, `qrTop` e `qrSize` (inteiros opcionais) a `Template` e a `Wallpaper` em `prisma/schema.prisma`
- [x] 1.2 Gerar a migration aditiva com `prisma migrate diff` entre o schema antigo e o novo, sem banco, e revisar o SQL
- [x] 1.3 Regerar o Prisma Client e confirmar que os tipos expõem os campos novos

## 2. Posicionamento compartilhado

- [x] 2.1 Criar o módulo puro de posicionamento: posição legada, limites do QR (240 a 640 px), dimensões do cartão por tamanho, com e sem senha, e função de encaixe na imagem
- [x] 2.2 Testar o encaixe nas quatro bordas, nos tamanhos mínimo e máximo e com e sem senha

## 3. Renderização

- [x] 3.1 Extrair de `image-generator.ts` a função que desenha o cartão (fundo branco arredondado, QR e texto) em qualquer tamanho
- [x] 3.2 Compor o wallpaper colando o cartão na posição encaixada
- [x] 3.3 Comparar, com a arte de referência, a saída na posição legada com a saída do código anterior a esta change
- [x] 3.4 Ler de volta o QR gerado no tamanho mínimo com SSID de 32 e senha de 63 caracteres

## 4. Validação e domínio

- [x] 4.1 Acrescentar ao schema de geração os três campos de posição, opcionais e só aceitos juntos; criar o schema de edição próprio, sem defaults
- [x] 4.2 Criar o schema estrito do `PATCH /api/templates/{id}` e o do `POST /api/wallpapers/card`
- [x] 4.3 Incluir a posição nos tipos e DTOs: `TemplateDto` com os valores gravados e `WallpaperDto` com os valores efetivos

## 5. Serviços, repositórios e API

- [x] 5.1 Geração: resolver a posição (enviada, depois padrão do template, depois legada), gerar e gravar valores explícitos
- [x] 5.2 Edição: incluir posição e tamanho na regra de regeração, comparando valores efetivos
- [x] 5.3 Template: atualizar só os campos enviados e responder `404` para template inexistente
- [x] 5.4 Criar `POST /api/wallpapers/card` e remover `GET /api/wallpapers/preview`
- [x] 5.5 Atualizar `docs/openapi.yaml`

## 6. Interface

- [x] 6.1 Criar o `QrCardPositioner`: arraste, alça de tamanho, teclado, limites e texto com posição e tamanho
- [x] 6.2 Gerar: prévia com arte e cartão, texto de exemplo antes do SSID, volta ao padrão ao trocar de template e envio da posição
- [x] 6.3 Edição no Histórico: prévia posicionável, "Usar padrão do template" e volta ao padrão ao trocar de template
- [x] 6.4 Admin: diálogo "Posição do QR" com dados de exemplo, salvar e "Restaurar posição original"

## 7. Verificação

- [x] 7.1 Rodar `biome check` e `npx next build` sem erros (nunca `pnpm build`)
- [x] 7.2 Fluxo completo contra Postgres e MinIO descartáveis: gerar com e sem posição, editar só a localização (sem regerar), editar só a posição (regerando) e definir o padrão de um template no Admin
- [x] 7.3 No navegador, arrastar, redimensionar e usar o teclado no Gerar, na edição e no Admin, em largura de desktop (a de celular ficou fora, para encurtar os testes), conferindo que a posição enviada e a gerada são as da prévia
- [ ] 7.4 Ler com um celular o QR de um wallpaper gerado (manual)
- [x] 7.5 Rodar `openspec validate add-draggable-qr-card --strict`
