# LEMOS Car Showcase

Uma galeria de carros interativa e responsiva construída com HTML5, CSS3 e JavaScript vanilla. Um showcase elegante que apresenta veículos com detalhes, imagens e navegação suave.

## ✨ Características

- **Slider Interativo**: Navegação entre carros com transições fluidas
- **Autoplay Automático**: Apresentação contínua das imagens
- **Controles de Navegação**: Botões prev/next e indicadores de pontos
- **Touch & Swipe**: Suporte completo para dispositivos móveis
- **Acessibilidade**: Atributos ARIA e navegação por teclado
- **Dados Dinâmicos**: Sistema de source única (cars.js) para manutenção simplificada
- **Design Responsivo**: Funciona perfeitamente em qualquer tamanho de tela
- **Tipografia Premium**: Fontes Google integradas (Oswald, Outfit, JetBrains Mono)

## 📁 Estrutura do Projeto

```
abc/
├── index.html      # Estrutura HTML principal
├── style.css       # Estilos e layout responsivo
├── cars.js         # Dados dos veículos (fonte única de verdade)
├── slider.js       # Lógica do slider e geração dinâmica
├── img/            # Imagens dos carros
└── README.md       # Este arquivo
```

## 🚀 Como Usar

1. **Clonar ou baixar o projeto**
   ```bash
   git clone <repositório>
   cd abc
   ```

2. **Abrir no navegador**
   - Abra `index.html` diretamente no navegador, ou
   - Use um servidor local (recomendado para ES6 modules):
   ```bash
   python -m http.server 8000
   # ou com Node.js
   npx http-server
   ```
   - Acesse `http://localhost:8000`

## 🎨 Customização

### Adicionar Novos Carros

Edite apenas `cars.js`:

```javascript
export const cars = [
  {
    brand:  'Marca',
    model:  'Modelo',
    accent: '#cores em hex',
    image:  'img/carro.png',
    desc:   'Descrição do veículo...',
    specs: {
      price:  'Preço',
      power:  'Potência',
      sprint: '0-100km/h',
      top:    'Velocidade máxima',
    },
  },
  // ... mais carros
];
```

### Modificar Estilos

- **Cores e temas**: Edite `style.css`
- **Duração do autoplay**: Ajuste a variável CSS `--autoplay-duration`
- **Sensibilidade do swipe**: Modifique `SWIPE_THRESHOLD` em `slider.js`

## ⌨️ Controles

| Ação | Funcionalidade |
|------|---|
| **Clique (◀ ▶)** | Navegar entre carros |
| **Toque/Swipe** | Deslizar nos dispositivos móveis |
| **Setas Teclado** | Navegar com ← → |
| **Dots** | Ir direto para um slide específico |
| **Hover** | Pausa o autoplay |

## 🔧 Dependências

- Nenhuma dependência externa! Apenas JavaScript vanilla
- Fontes externas: Google Fonts (carregadas via CDN)

## 📱 Compatibilidade

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Dispositivos móveis (iOS/Android)

## ♿ Acessibilidade

O projeto segue boas práticas WCAG 2.1:
- Atributos `aria-label` e `aria-roledescription`
- Navegação por teclado completa
- Conteúdo semanticamente estruturado
- Suporte a leitores de tela

## 📝 Licença

Projeto livre para uso e modificação.

## 👤 Autor

Desenvolvido como parte do DevQuest 2.0

---

**Dica**: Abra o DevTools (F12) para inspecionar o markup gerado dinamicamente pelo slider.
