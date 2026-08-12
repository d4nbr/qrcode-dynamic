## ADDED Requirements

### Requirement: Edição de wallpaper a partir do histórico

O histórico SHALL permitir editar um wallpaper já gerado. Os campos editáveis SHALL ser Localização, SSID, senha do Wi-Fi, tipo de segurança e template. Os campos SHALL ser pré-preenchidos com os valores atuais do registro e validados com as mesmas regras da geração.

#### Scenario: Abertura do editor

- **WHEN** o usuário aciona "Editar" no card de um wallpaper
- **THEN** um formulário é exibido com Localização, SSID, senha, tipo de segurança e template preenchidos com os valores atuais

#### Scenario: Edição salva com sucesso

- **WHEN** o usuário altera um ou mais campos e confirma
- **THEN** o wallpaper é atualizado, o editor é fechado e o card exibe os novos dados

#### Scenario: Edição cancelada

- **WHEN** o usuário fecha o editor sem confirmar
- **THEN** nenhuma alteração é persistida e a imagem existente permanece intacta

#### Scenario: Campo inválido

- **WHEN** o usuário informa um SSID vazio ou uma Localização acima de 80 caracteres
- **THEN** a confirmação é bloqueada e a mensagem de validação correspondente é exibida

#### Scenario: Wallpaper inexistente

- **WHEN** a API recebe `PATCH /api/wallpapers/{id}` para um identificador que não existe
- **THEN** responde `404` com a mensagem "Wallpaper não encontrado."

### Requirement: Regeração condicional da imagem

A edição SHALL regerar a imagem e o QR Code quando SSID, senha, tipo de segurança ou template forem alterados, pois esses dados estão embutidos no PNG. Quando apenas a Localização for alterada, o sistema SHALL atualizar somente o banco, sem regerar a imagem nem tocar no storage.

#### Scenario: Apenas a localização muda

- **WHEN** o usuário altera somente a Localização e confirma
- **THEN** o registro é atualizado, e `storedPath`, `publicUrl` e o objeto no storage permanecem inalterados

#### Scenario: Dado embutido na imagem muda

- **WHEN** o usuário altera SSID, senha, tipo de segurança ou template e confirma
- **THEN** a imagem é regerada com os novos dados, o `qrContent` é recalculado e o registro passa a apontar para o novo objeto

#### Scenario: Template inativo selecionado na edição

- **WHEN** o usuário tenta salvar apontando para um template inativo ou inexistente
- **THEN** a API responde com erro e o wallpaper permanece inalterado

#### Scenario: Segurança alterada para rede aberta

- **WHEN** o tipo de segurança é alterado para "nopass"
- **THEN** a imagem regerada não exibe o bloco de senha e o QR Code codifica a rede como aberta

### Requirement: Substituição segura do objeto no storage

A imagem regerada SHALL ser publicada em um novo caminho de storage, e o objeto anterior SHALL ser removido apenas após o registro apontar para o novo caminho. Caminhos de wallpaper SHALL ser únicos por wallpaper e por geração, de modo que duas operações simultâneas nunca escrevam no mesmo objeto.

#### Scenario: Publicação antes da remoção

- **WHEN** a imagem é regerada
- **THEN** o novo objeto é enviado e o registro é atualizado antes de o objeto antigo ser removido

#### Scenario: Falha ao remover o objeto antigo

- **WHEN** a remoção do objeto anterior falha
- **THEN** a edição é considerada bem-sucedida, pois o registro já aponta para o objeto novo e válido

#### Scenario: Miniatura atualizada no histórico

- **WHEN** o histórico é recarregado após uma regeração
- **THEN** a miniatura exibida é a nova imagem, sem reaproveitar a versão em cache do caminho anterior
