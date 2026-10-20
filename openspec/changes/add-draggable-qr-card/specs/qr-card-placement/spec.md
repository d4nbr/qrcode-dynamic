## ADDED Requirements

### Requirement: Cartão do QR Code

O wallpaper SHALL exibir o QR Code, o nome da rede e, quando houver senha, a senha, reunidos num cartão branco único desenhado sobre a arte do template. O cartão SHALL manter o layout interno, as cores e as fontes atuais e SHALL ser redimensionado de forma proporcional ao lado do QR.

#### Scenario: Rede com senha

- **WHEN** o wallpaper é gerado com segurança WPA ou WEP
- **THEN** o cartão exibe o QR, "REDE WI-FI", o SSID, "SENHA" e a senha

#### Scenario: Rede aberta

- **WHEN** o wallpaper é gerado com segurança "nopass"
- **THEN** o cartão exibe o QR, "REDE WI-FI" e o SSID, sem o bloco de senha, e fica mais baixo

#### Scenario: Arte da OAB na posição legada

- **WHEN** um wallpaper é gerado na arte da OAB com o cartão em (816, 264) e QR de 331 px
- **THEN** o resultado é visualmente igual ao gerado antes desta change

### Requirement: Posicionamento e dimensionamento na prévia

A prévia do Gerar SHALL mostrar a arte do template selecionado com o cartão por cima e SHALL permitir arrastar o cartão e redimensioná-lo por uma alça, com mouse, toque ou teclado, sem esperar resposta do servidor a cada movimento. O cartão SHALL permanecer inteiro dentro da imagem.

#### Scenario: Arrastar com o mouse ou o dedo

- **WHEN** o usuário arrasta o cartão na prévia
- **THEN** o cartão acompanha o ponteiro e para na borda da imagem, sem ultrapassá-la

#### Scenario: Redimensionar pela alça

- **WHEN** o usuário arrasta a alça do canto do cartão
- **THEN** o lado do QR muda entre 240 px e 640 px da imagem final, com o cartão mantendo a proporção e o canto superior esquerdo fixo

#### Scenario: Teclado

- **WHEN** o cartão está com foco e o usuário pressiona as setas, Shift com as setas, "+" ou "−"
- **THEN** o cartão se move 10 px, se move 50 px ou muda de tamanho em 10 px, respectivamente, sem sair dos limites

#### Scenario: Prévia antes do SSID

- **WHEN** um template está selecionado e o SSID ainda está vazio
- **THEN** a prévia exibe o cartão com texto de exemplo, que já pode ser posicionado

#### Scenario: Troca de template

- **WHEN** o usuário seleciona outro template
- **THEN** o cartão volta à posição e ao tamanho padrão do novo template

#### Scenario: Prévia fiel ao resultado

- **WHEN** o usuário gera o wallpaper
- **THEN** a imagem gerada tem o cartão na mesma posição e no mesmo tamanho exibidos na prévia

### Requirement: Posição guardada por wallpaper

Cada wallpaper SHALL guardar a posição do canto superior esquerdo do cartão e o lado do QR, em pixels inteiros da imagem 1920 × 1080. Wallpapers sem esses valores SHALL ser tratados como na posição legada: cartão em (816, 264) e QR de 331 px.

#### Scenario: Geração com posição escolhida

- **WHEN** a API recebe `POST /api/wallpapers` com `qrLeft`, `qrTop` e `qrSize`
- **THEN** a imagem usa esses valores, ajustados para que o cartão caiba na imagem, e o registro guarda os valores usados

#### Scenario: Geração sem posição

- **WHEN** a API recebe `POST /api/wallpapers` sem os campos de posição
- **THEN** a imagem usa o padrão do template ou, se o template não tiver padrão, a posição legada, e o registro guarda os valores usados

#### Scenario: Tamanho fora dos limites

- **WHEN** a API recebe `qrSize` menor que 240, maior que 640 ou não inteiro
- **THEN** responde `400` e nada é gerado

#### Scenario: Posição incompleta

- **WHEN** a API recebe só parte dos campos `qrLeft`, `qrTop` e `qrSize`
- **THEN** responde `400` e nada é gerado

#### Scenario: Wallpaper anterior a esta change

- **WHEN** um wallpaper sem posição gravada é listado ou aberto na edição
- **THEN** a posição informada é a legada

### Requirement: Reposicionamento na edição

A edição pelo Histórico SHALL oferecer a mesma prévia posicionável, começando na posição atual do wallpaper, e SHALL oferecer a ação "Usar padrão do template". Alterar a posição ou o tamanho SHALL regerar a imagem pelo fluxo de regeração existente: novo objeto no storage, atualização do registro e remoção do objeto antigo.

#### Scenario: Só a posição muda

- **WHEN** o usuário move ou redimensiona o cartão na edição e salva
- **THEN** a imagem é regerada com a nova posição e o registro guarda os novos valores

#### Scenario: Só a localização muda

- **WHEN** o usuário altera só a Localização e salva
- **THEN** a imagem não é regerada, inclusive em wallpapers sem posição gravada

#### Scenario: Padrão do template na edição

- **WHEN** o usuário aciona "Usar padrão do template"
- **THEN** o cartão vai para a posição e o tamanho padrão do template selecionado

#### Scenario: Troca de template na edição

- **WHEN** o usuário seleciona outro template na edição
- **THEN** o cartão vai para a posição e o tamanho padrão do novo template

#### Scenario: Campo omitido no PATCH

- **WHEN** a API recebe `PATCH /api/wallpapers/{id}` sem `wifiSecurity`
- **THEN** o tipo de segurança do wallpaper permanece o atual

### Requirement: Cartão da prévia sem senha na URL

O servidor SHALL gerar a imagem do cartão para a prévia por `POST /api/wallpapers/card`, recebendo SSID, senha e tipo de segurança no corpo, com as mesmas regras de validação da geração, sem gravar nada e sem permitir cache. O endpoint `GET /api/wallpapers/preview` SHALL ser removido.

#### Scenario: Cartão gerado

- **WHEN** a API recebe `POST /api/wallpapers/card` com dados válidos
- **THEN** responde `200` com o PNG do cartão e `Cache-Control: no-store`

#### Scenario: Dados inválidos

- **WHEN** a API recebe um SSID vazio ou com mais de 32 caracteres
- **THEN** responde `400` com a mensagem de validação

#### Scenario: Prévia antiga

- **WHEN** a API recebe `GET /api/wallpapers/preview`
- **THEN** nenhuma imagem é gerada e a API responde `405`, pois o caminho passa a ser tratado como `/api/wallpapers/{id}`, que não aceita `GET`
