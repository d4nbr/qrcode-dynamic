## ADDED Requirements

### Requirement: Posição padrão do cartão por template

Cada template SHALL poder ter uma posição e um tamanho padrão do cartão, definidos no Admin arrastando e redimensionando o cartão sobre a própria arte, com dados de exemplo. Templates sem padrão SHALL usar a posição legada: cartão em (816, 264) e QR de 331 px.

#### Scenario: Definir o padrão

- **WHEN** o administrador aciona "Posição do QR" num template, ajusta o cartão e salva
- **THEN** o template guarda a posição e o tamanho, e o Gerar passa a começar neles quando esse template é selecionado

#### Scenario: Restaurar a posição original

- **WHEN** o administrador aciona "Restaurar posição original" e salva
- **THEN** o template volta à posição legada

#### Scenario: Template novo

- **WHEN** um template é enviado
- **THEN** ele começa sem padrão e usa a posição legada até ser posicionado

#### Scenario: Wallpapers existentes

- **WHEN** o padrão de um template muda
- **THEN** os wallpapers já gerados com esse template mantêm a posição e a imagem atuais

### Requirement: Atualização validada do template

`PATCH /api/templates/{id}` SHALL validar o corpo com schema estrito, aceitando `isActive` e os campos de posição `qrLeft`, `qrTop` e `qrSize`, que só valem juntos, e SHALL alterar apenas os campos enviados.

#### Scenario: Só a posição

- **WHEN** a API recebe apenas os campos de posição
- **THEN** a posição padrão é atualizada e `isActive` permanece como estava

#### Scenario: Corpo vazio ou campo desconhecido

- **WHEN** a API recebe `{}` ou um campo não previsto
- **THEN** responde `400` e nada é alterado

#### Scenario: Template inexistente

- **WHEN** a API recebe um identificador que não existe
- **THEN** responde `404` com a mensagem "Template não encontrado."
