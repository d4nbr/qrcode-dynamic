## Context

O `Wallpaper` guarda hoje `comarcaName`, um campo que nunca teve entrada no formulário. Todos os registros de produção têm string vazia nele, o que se observa nos cards do histórico — a linha de destaque aparece em branco — e nos downloads, que saem como `oabma--wifi.png`.

A imagem gerada é imutável por construção: SSID, senha e tipo de segurança são desenhados no PNG pelo `image-generator` e codificados no QR Code. O template define a arte de fundo. Consequentemente, permitir edição desses campos sem regerar o arquivo faria banco e imagem divergirem — o wallpaper impresso mostraria uma senha e o registro guardaria outra.

Três restrições do sistema atual moldam o desenho:

- O caminho de storage é `wallpapers/${Date.now()}.png`, que colide entre requisições concorrentes no mesmo milissegundo.
- O `/api/image-proxy` serve com `Cache-Control: public, max-age=31536000, immutable`, então reescrever o mesmo caminho deixaria a miniatura antiga presa no navegador.
- Não há autenticação em nenhuma rota, e o sistema está público na internet.

## Goals / Non-Goals

**Goals:**

- Registrar o local de implantação de cada wallpaper, aproveitando a coluna existente em vez de criar outra.
- Permitir corrigir um wallpaper já gerado sem perder o registro nem acumular duplicatas.
- Garantir que a imagem publicada e o registro no banco nunca divirjam.
- Preservar os dados de produção na migração.

**Non-Goals:**

- Autenticação e autorização nas rotas de escrita. `PATCH` nasce tão aberto quanto `DELETE` e `POST` já são. Isso é dívida conhecida e merece change própria.
- Versionamento ou trilha de auditoria das edições. A edição sobrescreve o registro.
- Impressão da Localização no wallpaper. O campo é metadado de gestão.
- Rate limit na regeração, apesar de ela ser tão custosa quanto a geração.

## Decisions

### Renomear a coluna em vez de criar uma nova

`comarcaName` está vazio em todo o acervo e "comarca" é justamente uma divisão territorial — o campo já era, em intenção, o que se pede agora. Criar `location` ao lado deixaria uma coluna permanentemente morta e dois lugares para representar a mesma ideia. O custo é quebrar o contrato da API, aceitável num sistema interno cujo único consumidor é o próprio front-end.

**Alternativa considerada:** manter `comarcaName` e adicionar `location`. Rejeitada por deixar a coluna morta e duplicar semântica.

### Migration com `ALTER TABLE ... RENAME COLUMN`, escrita à mão

O Prisma não distingue renomeação de remoção mais criação: a migration autogerada faria `DROP COLUMN` seguido de `ADD COLUMN`, o que descartaria os dados. Como o acervo está vazio nesse campo o prejuízo seria nulo hoje, mas a migration ficaria errada no repositório e serviria de exemplo ruim. O SQL é escrito manualmente:

```sql
ALTER TABLE "Wallpaper" RENAME COLUMN "comarcaName" TO "location";
UPDATE "Wallpaper" SET "location" = 'São Luís' WHERE "location" = '';
```

O `UPDATE` é idempotente e alcança só o que está vazio, atendendo ao requisito de não transformar "São Luís" em padrão.

### Caminho de storage único por geração

`wallpapers/${Date.now()}.png` passa a `wallpapers/${cuid}.png`, com identificador novo a cada publicação — inclusive nas regerações. Isso resolve três coisas de uma vez: elimina a colisão entre requisições simultâneas, garante que a URL nova invalide o cache imutável do proxy de imagem, e mantém o objeto antigo íntegro até que o registro já aponte para o novo.

**Alternativa considerada:** sobrescrever o mesmo caminho na regeração. Rejeitada porque o cache de um ano do proxy continuaria servindo a imagem velha, e uma falha no meio do upload deixaria o registro apontando para um objeto corrompido.

### Ordem das operações na regeração

Publicar o novo objeto, atualizar o registro, e só então remover o antigo. Se o processo falhar antes do update, o storage ganha um objeto órfão — desperdício de espaço, sem impacto funcional. A ordem inversa deixaria, em caso de falha, um registro apontando para objeto inexistente, o que quebra o histórico. Órfão é preferível a link quebrado.

A remoção do objeto antigo é best-effort: o `deleteFile` já engole erros silenciosamente, e a edição é considerada bem-sucedida assim que o registro aponta para a imagem nova.

### Detecção de regeração por comparação de campos

O serviço compara os valores recebidos com os persistidos e regera apenas se `wifiSsid`, `wifiPassword`, `wifiSecurity` ou `templateId` mudarem. Editar só a Localização vira um `UPDATE` de uma coluna — operação instantânea, sem download do template, sem composição de imagem e sem tráfego para o storage.

**Alternativa considerada:** regerar sempre, por simplicidade. Rejeitada porque cada regeração baixa o template do MinIO e roda `sharp` mais `canvas`, e a correção de localização é justamente o caso de uso mais frequente esperado.

### `PATCH` parcial com validação reaproveitada

O endpoint aceita subconjunto dos campos, validado por um schema derivado do de geração para manter as regras em um lugar só. O `qrContent` é recalculado no servidor a partir dos valores finais, nunca recebido do cliente.

## Risks / Trade-offs

**Rename quebra qualquer consumidor externo da API** → O único consumidor conhecido é o front-end deste repositório, atualizado na mesma change. O `docs/openapi.yaml` é atualizado junto para não deixar contrato defasado.

**Migration de rename é destrutiva se aplicada fora de ordem** → O SQL é escrito à mão e revisado; o `entrypoint.sh` já roda `prisma migrate deploy` no boot, então a aplicação em produção é automática e ordenada.

**`PATCH` aberto amplia a superfície de ataque** → Hoje qualquer visitante já pode gerar e excluir wallpapers; a edição não introduz uma classe nova de risco, mas soma-se a ela. Registrado como não-objetivo e endereçado em change separada.

**Regeração é CPU-intensiva e não tem limite** → Mesmo perfil de custo do `POST` existente, que também não tem limite. Mitigado parcialmente por só regerar quando os dados embutidos mudam.

**Objetos órfãos no storage** → Consequência aceita da ordem de operações escolhida. Uma rotina de limpeza pode comparar `storedPath` do banco com o bucket, se o desperdício se tornar relevante.

## Migration Plan

1. Migration aplicada automaticamente no deploy pelo `entrypoint.sh`, que executa `prisma migrate deploy` antes de subir o Next.js.
2. Front-end e API vão juntos no mesmo build — não há janela em que um lado conheça `location` e o outro `comarcaName`.
3. **Rollback:** reverter exige migration inversa (`RENAME COLUMN "location" TO "comarcaName"`). Os valores de backfill permanecem, o que é inofensivo, já que o campo não era exibido antes.

## Open Questions

Nenhuma. As quatro decisões de produto — reaproveitar a coluna, regerar condicionalmente, não imprimir a Localização na imagem e liberar os quatro campos para edição — foram confirmadas antes da redação deste documento.
