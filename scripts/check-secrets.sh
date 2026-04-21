#!/usr/bin/env bash
# Grep staged files for likely secrets before commit.
# Exit 1 if any high-confidence secret pattern is found.
#
# Uso local:
#   bash scripts/check-secrets.sh                    # varre staged files
#   bash scripts/check-secrets.sh --all              # varre repo inteiro (sem node_modules, .next, .git)
#   bash scripts/check-secrets.sh path/to/file       # varre arquivo específico
#
# Para instalar como pre-commit:
#   cp scripts/check-secrets.sh .git/hooks/pre-commit && chmod +x .git/hooks/pre-commit

set -euo pipefail

modo="${1:-staged}"

if [[ "$modo" == "--all" ]]; then
  arquivos=$(git ls-files | grep -vE '^(node_modules|\.next|\.git|audit/scratch|package-lock\.json)/' || true)
elif [[ -f "$modo" ]]; then
  arquivos="$modo"
else
  arquivos=$(git diff --cached --name-only --diff-filter=ACMR 2>/dev/null || true)
fi

if [[ -z "$arquivos" ]]; then
  echo "[check-secrets] Nada a varrer."
  exit 0
fi

# Padrões de alta confiança. Evita falsos positivos em .env.example (marcados com placeholder).
padroes=(
  'sk-ant-[A-Za-z0-9_-]{32,}'                      # Anthropic API key live
  'ANTHROPIC_API_KEY=sk-ant-'                      # dotenv com real key
  'SUPABASE_SERVICE_ROLE_KEY=eyJ[A-Za-z0-9._-]{100,}' # Supabase service role JWT
  'SERVICE_ROLE.*=eyJ[A-Za-z0-9._-]{100,}'
  're_[A-Za-z0-9]{32,}'                            # Resend API key
  'RESEND_API_KEY=re_'
  'PAGARME_API_KEY=ak_live_'
  'CAKTO_WEBHOOK_SECRET=(?!<|your-|placeholder|example|\$\{|change-me|preencher)[A-Za-z0-9]{16,}'
  'postgres://[^:]+:[^@]+@'                        # connection string com senha embutida
  '-----BEGIN (RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----'
  'AKIA[0-9A-Z]{16}'                               # AWS access key
)

encontrou=0
for arquivo in $arquivos; do
  [[ -f "$arquivo" ]] || continue
  # Ignora binários
  if file "$arquivo" 2>/dev/null | grep -qiE 'binary|executable'; then
    continue
  fi
  for padrao in "${padroes[@]}"; do
    if grep -HEn "$padrao" "$arquivo" 2>/dev/null; then
      encontrou=1
    fi
  done
done

if [[ "$encontrou" -eq 1 ]]; then
  echo ""
  echo "❌ [check-secrets] Padrão de secret detectado nos arquivos acima."
  echo "   Remova o secret antes de commitar. Use env vars (.env.local) ou Vercel Environment Variables."
  exit 1
fi

echo "✅ [check-secrets] Nenhum padrão de secret detectado."
exit 0
