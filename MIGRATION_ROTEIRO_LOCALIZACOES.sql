-- Migration para rastreamento de localizacao em tempo real dos roteiros
-- Execute no DBeaver conectado ao banco Postgres.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS roteiros_localizacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  roteiro_id UUID NOT NULL REFERENCES roteiros(id) ON DELETE CASCADE,
  usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  accuracy DOUBLE PRECISION NULL,
  altitude DOUBLE PRECISION NULL,
  heading DOUBLE PRECISION NULL,
  speed DOUBLE PRECISION NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  ativa BOOLEAN NOT NULL DEFAULT TRUE,
  encerrada_em TIMESTAMPTZ NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT roteiros_localizacoes_roteiro_usuario_unique UNIQUE (roteiro_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS roteiros_localizacoes_ativa_updated_at_idx
  ON roteiros_localizacoes (ativa, updated_at);

CREATE INDEX IF NOT EXISTS roteiros_localizacoes_recencia_idx
  ON roteiros_localizacoes (ativa, updated_at, captured_at);

CREATE OR REPLACE FUNCTION set_roteiros_localizacoes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_roteiros_localizacoes_updated_at ON roteiros_localizacoes;

CREATE TRIGGER trg_roteiros_localizacoes_updated_at
BEFORE UPDATE ON roteiros_localizacoes
FOR EACH ROW
EXECUTE FUNCTION set_roteiros_localizacoes_updated_at();

-- Observacao:
-- Nao marque automaticamente localizacoes antigas como inativas aqui.
-- "ativa" significa que o funcionario deixou o compartilhamento ligado.
-- A recencia deve ser calculada na consulta com updated_at/captured_at.

-- Conferencia rapida.
SELECT
  rl.roteiro_id,
  rl.usuario_id,
  u.nome AS usuario_nome,
  rl.latitude,
  rl.longitude,
  rl.accuracy,
  rl.captured_at,
  rl.updated_at,
  rl.ativa,
  (GREATEST(rl.updated_at, rl.captured_at) >= NOW() - INTERVAL '10 minutes') AS recente
FROM roteiros_localizacoes rl
JOIN usuarios u ON u.id = rl.usuario_id
ORDER BY rl.ativa DESC, GREATEST(rl.updated_at, rl.captured_at) DESC;
