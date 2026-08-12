## ADDED Requirements

### Requirement: Localização obrigatória na geração

O formulário de geração SHALL exigir o campo Localização, que registra onde o wallpaper será implantado. O valor SHALL ter entre 1 e 80 caracteres e SHALL ser persistido no campo `location` do wallpaper.

#### Scenario: Geração com localização preenchida

- **WHEN** o usuário preenche Localização, template, SSID e senha e submete o formulário
- **THEN** o wallpaper é criado com `location` igual ao valor informado

#### Scenario: Geração sem localização

- **WHEN** o usuário deixa a Localização em branco
- **THEN** o botão de gerar permanece desabilitado e a mensagem "Informe a localização." é exibida abaixo do campo

#### Scenario: Localização acima do limite

- **WHEN** a API recebe um `location` com mais de 80 caracteres
- **THEN** responde `400` com a mensagem "Localização muito longa (máx. 80 caracteres)." e nenhum wallpaper é criado

### Requirement: Renomeação do campo comarcaName

O campo `comarcaName` SHALL ser renomeado para `location` no banco de dados, no DTO da API e em toda a interface. O campo `comarcaName` SHALL deixar de existir.

#### Scenario: Resposta da API após a renomeação

- **WHEN** um cliente consulta `GET /api/wallpapers`
- **THEN** cada item traz a propriedade `location` e não traz `comarcaName`

#### Scenario: Dado preservado na migração

- **WHEN** a migration de renomeação é aplicada
- **THEN** os valores da coluna anterior são preservados na coluna `location`, sem perda de registros

### Requirement: Backfill do acervo existente

Os wallpapers gerados antes desta mudança SHALL receber `location` igual a "São Luís". O backfill SHALL alcançar apenas registros cuja localização esteja vazia, e "São Luís" SHALL NOT ser valor padrão para novos registros.

#### Scenario: Registro anterior à mudança

- **WHEN** a migration é aplicada sobre um wallpaper cuja localização é string vazia
- **THEN** o registro passa a ter `location` igual a "São Luís"

#### Scenario: Novo registro após a mudança

- **WHEN** um wallpaper é criado depois da migration
- **THEN** sua `location` é o valor informado pelo usuário, sem qualquer preenchimento automático

### Requirement: Exibição da localização no histórico

Cada card do histórico SHALL exibir a Localização do wallpaper em destaque, acompanhada de ícone de local.

#### Scenario: Card com localização

- **WHEN** o histórico é carregado
- **THEN** cada card exibe a Localização do wallpaper acima do nome do template

### Requirement: Nome do arquivo de download derivado da localização

O download SHALL nomear o arquivo a partir da Localização, no formato `oabma-<localizacao-normalizada>-wifi.png`. Quando a normalização resultar em string vazia, o nome SHALL ser `oabma-wallpaper-wifi.png`.

#### Scenario: Download com localização preenchida

- **WHEN** o usuário baixa um wallpaper cuja Localização é "São Luís"
- **THEN** o arquivo é entregue como `oabma-sao-luis-wifi.png`

#### Scenario: Download com localização sem caracteres aproveitáveis

- **WHEN** a Localização normalizada resulta em string vazia
- **THEN** o arquivo é entregue como `oabma-wallpaper-wifi.png`, sem hífens duplicados
