## Context

O `generateWallpaper` estica a arte do template para 1920 × 1080 e cola o QR de 331 px em (837, 285), com o texto de rede e senha logo abaixo. As coordenadas foram medidas na área branca da arte original da OAB, que tem 1672 × 941 (`WHITE` e `PAD` em `image-generator.ts`). Templates com outro layout, como a "JusBrasil OAB", recebem o QR no mesmo lugar, por cima do título, e o texto cinza fica ilegível no fundo escuro.

Outras restrições do sistema atual moldam o desenho:

- A prévia é um PNG completo gerado pelo servidor num `GET` a cada 700 ms de digitação: baixa a arte do MinIO, roda `sharp` e `canvas` e leva a senha do Wi-Fi na query string.
- `PATCH /api/templates/{id}` faz `Boolean(body.isActive)`, então um corpo sem `isActive` desativa o template.
- `updateWallpaperSchema` é o `.partial()` do schema de geração, e o Zod 4 aplica o `.default('WPA')` mesmo dentro do `.partial()`: um `PATCH` sem `wifiSecurity` vira WPA.
- Não há ambiente de desenvolvimento, e a produção (Coolify) aplica as migrations no boot pelo `entrypoint.sh`.
- Não há autenticação em nenhuma rota.

## Goals / Non-Goals

**Goals:**

- Posicionar e dimensionar o cartão do QR com resposta imediata, e gerar exatamente o que a prévia mostra.
- Padrão de posição por template, ajuste por wallpaper e reposicionamento na edição.
- Nenhuma mudança nos wallpapers existentes enquanto não forem editados; a arte da OAB na posição legada continua visualmente igual.
- Migration aditiva, segura com o `migrate deploy` no boot.

**Non-Goals:**

- Autenticação e autorização (dívida conhecida, para change própria).
- Mover QR e texto separadamente, ocultar o texto ou mudar cores e fontes do cartão.
- Rotação, encaixe em grade ou guias de alinhamento.
- Reposicionar em lote os wallpapers existentes quando o padrão do template muda.

## Decisions

### Cartão branco único com QR e texto

O cartão reproduz o bloco atual (QR, "REDE WI-FI", SSID, "SENHA" e senha) sobre um retângulo branco de cantos arredondados, com o mesmo espaçamento interno (21 px), as mesmas cores e as mesmas fontes. Com o QR de 331 px, o cartão mede cerca de 373 × 505 px com senha e 373 × 445 px sem senha; em outros tamanhos, tudo é multiplicado por `qrSize / 331`, inclusive as fontes. Na posição legada (816, 264), o cartão fica dentro da área branca da arte da OAB (816–1189 × 264–841), e o QR continua em (837, 285).

**Alternativas consideradas:** mover só o QR, deixando o texto fixo, rejeitada porque o texto ficaria solto na arte; manter o bloco sem fundo, rejeitada porque continuaria ilegível em artes escuras.

### Coordenadas inteiras no espaço da imagem final

`qrLeft` e `qrTop` são o canto superior esquerdo do cartão, e `qrSize` é o lado do QR, todos em pixels inteiros da imagem final, que tem tamanho fixo de 1920 × 1080. Inteiros tornam exata a comparação que decide a regeração e deixam os limites legíveis. A tela converte os valores em porcentagem do contêiner da prévia.

**Alternativa considerada:** frações de 0 a 1. Rejeitada: carrega a mesma informação, mas a comparação de igualdade fica sujeita a arredondamento.

### Limites e encaixe compartilhados entre navegador e servidor

Um módulo puro, sem dependências de Node, define a posição legada, os limites do QR (240 a 640 px), as dimensões do cartão em cada tamanho e a função que encaixa o cartão inteiro dentro da imagem. A tela usa o módulo durante o arraste, e o servidor reaplica o encaixe antes de gerar. Assim, uma posição que faria o cartão sair da imagem é corrigida em vez de produzir um cartão cortado. Tamanho fora de 240–640, coordenada negativa ou valor não inteiro são rejeitados com `400`.

O mínimo de 240 px fica abaixo do tamanho atual (331 px) com folga para senhas longas, que aumentam a densidade do QR. O máximo de 640 px garante que o cartão com senha, com cerca de 977 px de altura, caiba na imagem.

### Prévia composta no navegador; servidor gera só o cartão

A prévia mostra a arte do template, pela mesma `publicUrl` que as miniaturas já usam, esticada para 16:9 como o `sharp` faz com `fit: 'fill'`, e o cartão por cima, posicionado por CSS. O cartão vem de `POST /api/wallpapers/card` e é desenhado pela mesma função da imagem final, então fontes e espaçamentos são idênticos. O cartão só é pedido de novo quando SSID, senha ou tipo de segurança mudam, com o mesmo debounce de 700 ms de hoje; arrastar e redimensionar só mexem no CSS, sem ida ao servidor.

`GET /api/wallpapers/preview` é removido. Cada digitação deixa de baixar a arte e de compor uma imagem 1920 × 1080, e a senha sai da URL, onde acabava em logs de acesso e no cache do service worker.

**Alternativa considerada:** manter a prévia no servidor e recalcular a cada soltura do arraste. Rejeitada pela espera a cada ajuste e pelo custo de CPU.

### Componente de posicionamento único

Um componente `QrCardPositioner` atende o Gerar, a edição no Histórico e o Admin. Usa Pointer Events, que cobrem mouse, caneta e toque, com `touch-action: none` no cartão. O cartão é arrastado pelo corpo e redimensionado pela alça do canto inferior direito, com o canto superior esquerdo fixo. Pelo teclado, o cartão recebe foco: as setas movem 10 px, Shift com as setas move 50 px, e `+` e `−` mudam o tamanho em 10 px. A posição e o tamanho atuais aparecem em texto ao lado da prévia, inclusive para leitores de tela.

### Precedência da posição

- **Geração:** o cliente envia a posição escolhida. Sem ela, o servidor usa o padrão do template e, na falta dele, a posição legada. O wallpaper novo sempre grava valores explícitos, então mudar o padrão do template depois não altera wallpapers existentes.
- **Troca de template**, no Gerar ou na edição: a posição volta ao padrão do novo template, porque cada arte tem o próprio layout.
- **Edição:** começa na posição efetiva do wallpaper, que são os valores gravados ou, se vazios, a posição legada, onde o QR foi de fato desenhado. O botão "Usar padrão do template" aplica o padrão do template selecionado.
- **Registros sem posição gravada** são tratados como posição legada em todas as comparações, então abrir e salvar a edição sem mexer na posição não regera a imagem.

### Regeração na edição

Posição e tamanho entram na regra de regeração, junto com SSID, senha, tipo de segurança e template. Mudar só a Localização continua sendo atualização de metadado. Ao regerar um registro sem posição gravada, os valores efetivos passam a ser gravados.

### Schemas de validação

- **Edição de wallpaper:** schema próprio, com todos os campos opcionais e sem defaults, para que campo ausente signifique "não muda". Os três campos de posição só valem juntos.
- **`PATCH /api/templates/{id}`:** schema estrito com `isActive` e os três campos de posição, exigindo ao menos um campo. Substitui o `Boolean(body.isActive)`, que desativaria o template justamente quando o Admin salvasse só a posição.
- **`POST /api/wallpapers/card`:** SSID, senha e tipo de segurança com as mesmas regras da geração.

### Migration aditiva

```sql
ALTER TABLE "Template"  ADD COLUMN "qrLeft" INTEGER, ADD COLUMN "qrTop" INTEGER, ADD COLUMN "qrSize" INTEGER;
ALTER TABLE "Wallpaper" ADD COLUMN "qrLeft" INTEGER, ADD COLUMN "qrTop" INTEGER, ADD COLUMN "qrSize" INTEGER;
```

São colunas opcionais, sem default e sem backfill: vazio significa posição legada. O código antigo ignora as colunas novas, então nenhuma ordem entre migration e código quebra o sistema, ao contrário do rename de agosto. A migration é gerada com `prisma migrate diff` a partir dos dois schemas, sem precisar de banco.

## Risks / Trade-offs

**Diferença entre a prévia e a imagem final** → o cartão da prévia sai da mesma função que desenha a imagem final, e a arte é esticada do mesmo jeito. A verificação confere no navegador que a imagem gerada bate com a prévia.

**QR pequeno demais para ler** → o mínimo de 240 px é aplicado no servidor, e o QR gerado no tamanho mínimo, com SSID de 32 e senha de 63 caracteres, é lido de volta por um decodificador na verificação.

**Arte servida direto do MinIO** → a prévia depende da leitura anônima do bucket, como as miniaturas já dependem. Fechar o bucket, recomendação da análise de segurança, exigirá servir arte e miniaturas por rota própria.

**Rotas abertas** → `POST /api/wallpapers/card` e a gravação do padrão de template nascem sem autenticação, como o resto do sistema. O cartão só devolve o que o próprio chamador enviou, sem ler nada do banco. A entrada é validada por schema no servidor, e os limites de tamanho também contêm o custo de CPU por requisição.

**Abas abertas durante o deploy** → o front-end antigo ainda chamaria `GET /api/wallpapers/preview`, que deixa de existir; a prévia falha até a página ser recarregada.

**Wallpapers antigos em artes que não são a da OAB** → continuam com o QR na posição legada até serem editados. Na edição, o diálogo mostra a posição atual e oferece "Usar padrão do template".

## Migration Plan

1. Um único deploy com migration e código; o `entrypoint.sh` aplica a migration no boot.
2. Depois do deploy, definir no Admin o padrão de cada template que não seja a arte da OAB, como a "JusBrasil OAB".
3. **Rollback:** reverter o código. As colunas podem ficar, porque o código antigo as ignora, ou sair por uma migration inversa.

**Verificação sem ambiente de desenvolvimento:**

- **Renderização:** um script em Node gera o wallpaper com a arte de referência (`src/assets/oabma-template-wallpaper.png`) na posição legada e o compara com a saída do código atual. Também gera nos tamanhos mínimo e máximo e lê o QR de volta. O decodificador é instalado numa pasta temporária, fora do projeto.
- **Fluxo completo:** build de produção com `npx next build` (nunca `pnpm build`, que roda `prisma migrate deploy`), apontado para Postgres e MinIO descartáveis em contêineres temporários, removidos no fim. Nenhum teste usa o banco `qrcode_wifi` antigo deste servidor, o MinIO compartilhado ou a produção.
- **Navegador:** arrastar, redimensionar e mover pelo teclado no Gerar, na edição e no Admin, numa largura de desktop e numa de celular.

## Open Questions

- Os limites do QR (240 a 640 px) estão adequados para o uso nas salas?
- Como é o deploy no Coolify: um push na `main` publica automaticamente? Só importa na hora de publicar.
