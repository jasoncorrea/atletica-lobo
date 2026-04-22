# Instruções da Gestão Lobo

Sempre que a inteligência artificial (AI) for criar ou modificar qualquer tela, componente ou funcionalidade neste projeto, ela deve RIGOROSAMENTE seguir este padrão de design e comportamento:

## 1. Cores e Tema (Tailwind)
- **Cores Principais:** Utilizar os tokens do tema: `lobo-primary` (Bordô), `lobo-secondary` (Amarelo), `lobo-dark` (Bordô muito escuro, quase preto), `lobo-light` (Tom suave de destaque).
- **Contraste:** Fundos escuros (`bg-lobo-dark` ou `bg-zinc-900`) geralmente devem ter textos brancos ou `text-lobo-secondary`. Fundos Bordo (`bg-lobo-primary`) devem ter ícones/textos em `text-lobo-secondary` ou branco.
- **Background Root:** Telas e modais geralmente repousam sobre um fundo `bg-zinc-50`.

## 2. Tipografia
- Usar a família tipográfica definida (`font-sans: Inter`).
- **Títulos Maiores / Valores Numéricos (KPIs):** Usar `font-black` (peso 900), `tracking-tighter` ou normal e `leading-none`.
- **Labels, Subtítulos e Tags:** Usar minúsculas forçadas para maiúsculas com `uppercase`, tamanhos bem reduzidos como `text-[10px]` ou `text-xs`, peso alto `font-black` ou `font-bold`, e espaçamento largo `tracking-widest` ou `tracking-[0.2em]`.

## 3. Formas, Bordas e Sombras
- **Raio de Borda (Border Radius):** O design prioriza bordas extremamente arredondadas em cards e modais. Utilizar `rounded-2xl`, `rounded-3xl`, `rounded-[2rem]` ou `rounded-[2.5rem]` em containers principais. Botões podem ser `rounded-2xl` ou `rounded-xl`.
- **Sombras (Shadows):** Dar profundidade aos elementos primários com `shadow-xl` ou `shadow-2xl`. Para componentes com a cor da marca, usar "colored shadows" como `shadow-lobo-primary/20` ou `shadow-lobo-dark/30`.

## 4. Ícones
- Sempre usar `lucide-react`.
- Ícones em cards raramente flutuam sozinhos; geralmente ficam contidos em "caixas" arredondadas (`w-12 h-12 rounded-2xl bg-lobo-primary flex items-center justify-center ...`).

## 5. Interações (UI/UX)
- Botões clicáveis ou cards interativos DEVEM ter escala de clique (e.g., `active:scale-95`).
- Aplicar `transition-all duration-300` (ou `500`) em mudanças de hover (ex: mudança de cores, `hover:-translate-y-1` ou scale).
- Exibição de modais/menus com AnimatePresence e Framer Motion para entradas suaves (como `animate-fade-in` no CSS global).

## 6. Integridade Regras do App
- O AdminDashboard possui um esqueleto (Layout) com Sidebar, onde novas abas devem sempre ser registradas dentro da seção principal de navegação.
- Todo acesso externo ao Firebase deve acontecer pelo `storageService` atualizado via cache/listener, ou direto no Cloud Firestore, sempre incluindo logs de carregamento (Skeleton loaders em vez de tela branca).
