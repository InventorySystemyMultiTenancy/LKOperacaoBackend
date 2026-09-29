-- Correção: devoluções antigas registradas pelo admin (antes do fix do endpoint)
-- gravaram usuario_id do ADMIN em vez do funcionário dono do carrinho.
--
-- A correção é segura porque carrinho_usuarios.usuario_id é sempre o dono
-- real do carrinho (nunca é alterado pelo fluxo de devolução), então
-- comparamos com ele para achar e corrigir só os registros errados.
-- Devoluções feitas pelo próprio funcionário já estão corretas e não são tocadas
-- (nelas usuario_id já é igual ao dono do carrinho).

-- 1) PREVIEW: veja o que vai mudar antes de rodar o UPDATE
SELECT
  d.id AS devolucao_id,
  d.data_devolucao,
  ua.nome  AS nome_gravado_hoje,
  ua.email AS email_gravado_hoje,
  uc.nome  AS nome_correto_dono_carrinho,
  uc.email AS email_correto_dono_carrinho,
  d.observacao
FROM devolucoes_carrinho d
JOIN carrinho_usuarios c ON c.id = d.carrinho_id
JOIN usuarios ua ON ua.id = d.usuario_id
JOIN usuarios uc ON uc.id = c.usuario_id
WHERE d.usuario_id <> c.usuario_id
ORDER BY d.data_devolucao DESC;

-- 2) CORREÇÃO: só execute depois de conferir o preview acima
UPDATE devolucoes_carrinho d
SET usuario_id = c.usuario_id
FROM carrinho_usuarios c
WHERE c.id = d.carrinho_id
  AND d.usuario_id <> c.usuario_id;

-- 3) Confira que não sobrou nenhuma divergência
SELECT COUNT(*) AS restantes_divergentes
FROM devolucoes_carrinho d
JOIN carrinho_usuarios c ON c.id = d.carrinho_id
WHERE d.usuario_id <> c.usuario_id;
