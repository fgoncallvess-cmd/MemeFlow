# 📦 Instruções de Deploy - Schema Supabase

## ⚠️ IMPORTANTE: Executar antes de usar as correções

Devido às mudanças no schema do banco de dados, você precisa executar as migrações no Supabase.

---

## Opção 1: Via Supabase Dashboard (Recomendado para desenvolvimento)

### Passo 1: Adicionar coluna `humor_style`

1. Acesse [Supabase Console](https://app.supabase.com)
2. Selecione seu projeto MemeFlow
3. Vá para **SQL Editor**
4. Execute o seguinte SQL:

```sql
-- Adicionar coluna humor_style à tabela profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS humor_style TEXT;
```

### Passo 2: Adicionar coluna na tabela (se ainda não existe)

Ou se preferir, use o Table Editor:

1. Vá para **Table Editor**
2. Selecione a tabela `profiles`
3. Clique em **+ Add column**
4. Configure:
   - **Name:** `humor_style`
   - **Type:** `text`
   - **Required:** Deixe desachecado (é nullable)
5. Clique em **Save**

---

## Opção 2: Via SQL Direto (Rápido)

1. Abra SQL Editor no Supabase
2. Cole o SQL abaixo:

```sql
-- 1. Adicionar coluna humor_style
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS humor_style TEXT;

-- 2. Adicionar DELETE policy (se não existir)
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

CREATE POLICY "Users can delete their own profile"
    ON public.profiles
    FOR DELETE
    USING (auth.uid() = id);
```

3. Clique em **Run**

---

## Opção 3: Via Arquivo de Migração Local

Se você estiver usando Supabase CLI:

```bash
# Terminal
supabase migration new add_humor_style_and_delete_policy
```

Edite o arquivo criado em `supabase/migrations/` com:

```sql
-- Add humor_style column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS humor_style TEXT;

-- Add DELETE policy
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;

CREATE POLICY "Users can delete their own profile"
    ON public.profiles
    FOR DELETE
    USING (auth.uid() = id);
```

Depois execute:

```bash
supabase db push
```

---

## ✅ Validação

Após aplicar as mudanças, valide:

1. **Schema correto:**
   - Acesse Table Editor > profiles
   - Confirme que existe coluna `humor_style` do tipo `text`

2. **Policies corretas:**
   - Vá para Authentication > Policies
   - Confirme 4 políticas em `profiles`:
     - ✓ "Profiles are viewable by everyone" (SELECT)
     - ✓ "Users can insert their own profile" (INSERT)
     - ✓ "Users can update their own profile" (UPDATE)
     - ✓ "Users can delete their own profile" (DELETE)

3. **Teste funcional:**
   - Crie novo usuário
   - Verifique que username e full_name são salvos
   - Edite perfil e confirme que altera

---

## 🔄 Reversão (Se necessário)

Para reverter as mudanças:

```sql
-- Remover coluna humor_style
ALTER TABLE public.profiles
DROP COLUMN IF EXISTS humor_style;

-- Remover DELETE policy
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.profiles;
```

---

## 🆘 Problemas Comuns

### Erro: "column already exists"
Isso significa que a coluna já existe. Ignore e continue.

### Erro: "permission denied"
Verifique se você está logado com conta que tem permissão de admin no Supabase.

### Erro: "policy already exists"
Ignore - o código usa `DROP POLICY IF EXISTS` que remove primeiro.

---

## 📋 Checklist de Deploy

- [ ] Conectado no Supabase Console
- [ ] Executou SQL ou adicionou coluna via UI
- [ ] Coluna `humor_style` visível na tabela `profiles`
- [ ] DELETE policy adicionada
- [ ] Testou criação de novo usuário
- [ ] Testou edição de perfil
- [ ] Dados persistem após F5

---

**Deploy concluído com sucesso! ✅**

Agora o app está 100% pronto para usar o novo sistema de perfil.

