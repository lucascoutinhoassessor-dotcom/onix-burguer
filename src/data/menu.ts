export type MenuCategory = "hamburgueres" | "acompanhamentos" | "bebidas" | "sobremesas";

export type MenuOption = {
  id: string;
  name: string;
  price?: number;
};

export type MenuOptionGroup = {
  id: string;
  name: string;
  type: "single" | "multiple";
  required?: boolean;
  maxSelections?: number;
  options: MenuOption[];
};

export type MenuItem = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: MenuCategory;
  image: string;
  active?: boolean;
  optionGroups?: MenuOptionGroup[];
};

export const menuItems: MenuItem[] = [
  {
    id: "onix-prime",
    name: "Ônix Prime",
    description: "Pão brioche, blend artesanal 180g, queijo cheddar inglês, bacon caramelizado e maionese defumada.",
    price: 38,
    category: "hamburgueres",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
    optionGroups: [
      {
        id: "ponto-carne",
        name: "Ponto da carne",
        type: "single",
        required: true,
        options: [
          { id: "ao-ponto", name: "Ao ponto" },
          { id: "bem-passado", name: "Bem passado" },
          { id: "mal-passado", name: "Mal passado" }
        ]
      },
      {
        id: "extras",
        name: "Adicionais",
        type: "multiple",
        maxSelections: 3,
        options: [
          { id: "bacon-extra", name: "Bacon extra", price: 6 },
          { id: "queijo-extra", name: "Queijo extra", price: 5 },
          { id: "cebola-crocante", name: "Cebola crocante", price: 4 }
        ]
      }
    ]
  },
  {
    id: "black-truffle-burger",
    name: "Black Truffle Burger",
    description: "Blend 180g, queijo prato, cebola roxa tostada, rúcula selvagem e maionese trufada.",
    price: 42,
    category: "hamburgueres",
    image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&q=80",
    optionGroups: [
      {
        id: "ponto-carne",
        name: "Ponto da carne",
        type: "single",
        required: true,
        options: [
          { id: "ao-ponto", name: "Ao ponto" },
          { id: "bem-passado", name: "Bem passado" },
          { id: "mal-passado", name: "Mal passado" }
        ]
      },
      {
        id: "extras",
        name: "Adicionais",
        type: "multiple",
        maxSelections: 2,
        options: [
          { id: "queijo-brie", name: "Queijo brie", price: 8 },
          { id: "bacon-extra", name: "Bacon extra", price: 6 },
          { id: "aioli-trufado", name: "Aioli trufado", price: 5 }
        ]
      }
    ]
  },
  {
    id: "smash-colubande",
    name: "Smash Colubandê",
    description: "Dois smash burgers de 90g, queijo americano, picles artesanal e molho especial da casa.",
    price: 34,
    category: "hamburgueres",
    image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=500&q=80",
    optionGroups: [
      {
        id: "ponto-carne",
        name: "Ponto da carne",
        type: "single",
        required: true,
        options: [
          { id: "ao-ponto", name: "Ao ponto" },
          { id: "bem-passado", name: "Bem passado" }
        ]
      },
      {
        id: "extras",
        name: "Adicionais",
        type: "multiple",
        maxSelections: 3,
        options: [
          { id: "smash-extra", name: "Smash extra", price: 9 },
          { id: "bacon-extra", name: "Bacon extra", price: 6 },
          { id: "queijo-extra", name: "Queijo extra", price: 5 }
        ]
      }
    ]
  },
  {
    id: "gold-bbq",
    name: "Gold BBQ",
    description: "Blend 180g, queijo gouda, onion strings crocantes e barbecue de rapadura.",
    price: 39,
    category: "hamburgueres",
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=500&q=80",
    optionGroups: [
      {
        id: "ponto-carne",
        name: "Ponto da carne",
        type: "single",
        required: true,
        options: [
          { id: "ao-ponto", name: "Ao ponto" },
          { id: "bem-passado", name: "Bem passado" },
          { id: "mal-passado", name: "Mal passado" }
        ]
      },
      {
        id: "extras",
        name: "Adicionais",
        type: "multiple",
        maxSelections: 2,
        options: [
          { id: "bacon-extra", name: "Bacon extra", price: 6 },
          { id: "bbq-extra", name: "BBQ extra", price: 4 },
          { id: "onion-strings", name: "Onion strings extra", price: 4 }
        ]
      }
    ]
  },
  {
    id: "bourbon-bacon-jam",
    name: "Bourbon Bacon Jam",
    description: "Hambúrguer 180g, queijo monterey jack, bacon jam no bourbon e aioli tostado.",
    price: 43,
    category: "hamburgueres",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
    optionGroups: [
      {
        id: "ponto-carne",
        name: "Ponto da carne",
        type: "single",
        required: true,
        options: [
          { id: "ao-ponto", name: "Ao ponto" },
          { id: "bem-passado", name: "Bem passado" },
          { id: "mal-passado", name: "Mal passado" }
        ]
      },
      {
        id: "extras",
        name: "Adicionais",
        type: "multiple",
        maxSelections: 3,
        options: [
          { id: "bacon-extra", name: "Bacon extra", price: 6 },
          { id: "queijo-extra", name: "Queijo extra", price: 5 },
          { id: "aioli-extra", name: "Aioli tostado extra", price: 4 }
        ]
      }
    ]
  },
  {
    id: "chicken-crispy-amber",
    name: "Chicken Crispy Amber",
    description: "Frango empanado crocante, queijo prato, alface baby e molho honey mustard picante.",
    price: 33,
    category: "hamburgueres",
    image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&q=80",
    optionGroups: [
      {
        id: "molho",
        name: "Molho",
        type: "single",
        required: true,
        options: [
          { id: "honey-mustard", name: "Honey mustard" },
          { id: "barbecue", name: "Barbecue" },
          { id: "maionese-defumada", name: "Maionese defumada" }
        ]
      },
      {
        id: "extras",
        name: "Adicionais",
        type: "multiple",
        maxSelections: 2,
        options: [
          { id: "queijo-extra", name: "Queijo extra", price: 5 },
          { id: "bacon-extra", name: "Bacon extra", price: 6 }
        ]
      }
    ]
  },
  {
    id: "onion-melt-burger",
    name: "Onion Melt Burger",
    description: "Blend 180g, cebola roxa na chapa, queijo suíço e molho de alho assado.",
    price: 37,
    category: "hamburgueres",
    image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500&q=80",
    optionGroups: [
      {
        id: "ponto-carne",
        name: "Ponto da carne",
        type: "single",
        required: true,
        options: [
          { id: "ao-ponto", name: "Ao ponto" },
          { id: "bem-passado", name: "Bem passado" },
          { id: "mal-passado", name: "Mal passado" }
        ]
      },
      {
        id: "extras",
        name: "Adicionais",
        type: "multiple",
        maxSelections: 2,
        options: [
          { id: "queijo-extra", name: "Queijo extra", price: 5 },
          { id: "cebola-extra", name: "Cebola na chapa extra", price: 4 }
        ]
      }
    ]
  },
  {
    id: "veggie-coal",
    name: "Veggie Coal",
    description: "Burger de grão-de-bico e cogumelos, queijo meia cura, tomate assado e pesto de ervas.",
    price: 35,
    category: "hamburgueres",
    image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=500&q=80",
    optionGroups: [
      {
        id: "finalizacao",
        name: "Finalização",
        type: "single",
        required: true,
        options: [
          { id: "pesto", name: "Pesto de ervas" },
          { id: "maionese-defumada", name: "Maionese defumada veg" }
        ]
      },
      {
        id: "extras",
        name: "Adicionais",
        type: "multiple",
        maxSelections: 2,
        options: [
          { id: "queijo-extra", name: "Queijo meia cura extra", price: 5 },
          { id: "cogumelos-extra", name: "Cogumelos salteados", price: 6 }
        ]
      }
    ]
  },
  {
    id: "batata-frita-onix",
    name: "Batata Frita Ônix",
    description: "Batatas crocantes com páprica defumada, sal de ervas e maionese da casa.",
    price: 18,
    category: "acompanhamentos",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&q=80",
    optionGroups: [
      {
        id: "molho",
        name: "Molho",
        type: "single",
        required: true,
        options: [
          { id: "maionese-casa", name: "Maionese da casa" },
          { id: "barbecue", name: "Barbecue" },
          { id: "cheddar", name: "Cheddar", price: 4 }
        ]
      }
    ]
  },
  {
    id: "onion-rings-premium",
    name: "Onion Rings Premium",
    description: "Anéis de cebola empanados na farinha panko com molho barbecue artesanal.",
    price: 22,
    category: "acompanhamentos",
    image: "https://images.unsplash.com/photo-1639024471283-03518883512d?w=500&q=80",
    optionGroups: [
      {
        id: "molho",
        name: "Molho",
        type: "single",
        required: true,
        options: [
          { id: "barbecue", name: "Barbecue" },
          { id: "maionese-defumada", name: "Maionese defumada" },
          { id: "aioli", name: "Aioli tostado", price: 3 }
        ]
      }
    ]
  },
  {
    id: "cheddar-bacon-fries",
    name: "Cheddar Bacon Fries",
    description: "Batata frita com creme de cheddar, bacon crocante e cebolinha fresca.",
    price: 24,
    category: "acompanhamentos",
    image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&q=80",
    optionGroups: [
      {
        id: "extras",
        name: "Adicionais",
        type: "multiple",
        maxSelections: 2,
        options: [
          { id: "bacon-extra", name: "Bacon extra", price: 6 },
          { id: "cheddar-extra", name: "Cheddar extra", price: 5 }
        ]
      }
    ]
  },
  {
    id: "refrigerante-lata",
    name: "Refrigerante Lata",
    description: "Coca-Cola, Coca Zero, Guaraná ou Sprite servidos sempre gelados.",
    price: 8,
    category: "bebidas",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80",
    optionGroups: [
      {
        id: "sabor",
        name: "Sabor",
        type: "single",
        required: true,
        options: [
          { id: "coca-cola", name: "Coca-Cola" },
          { id: "coca-zero", name: "Coca Zero" },
          { id: "guarana", name: "Guaraná" },
          { id: "sprite", name: "Sprite" }
        ]
      }
    ]
  },
  {
    id: "suco-artesanal",
    name: "Suco Artesanal",
    description: "Sabores limão, maracujá e frutas vermelhas preparados na hora.",
    price: 12,
    category: "bebidas",
    image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&q=80",
    optionGroups: [
      {
        id: "sabor",
        name: "Sabor",
        type: "single",
        required: true,
        options: [
          { id: "limao", name: "Limão" },
          { id: "maracuja", name: "Maracujá" },
          { id: "frutas-vermelhas", name: "Frutas vermelhas" }
        ]
      }
    ]
  },
  {
    id: "milkshake-ovomaltine",
    name: "Milkshake de Ovomaltine",
    description: "Milkshake cremoso com sorvete de baunilha, Ovomaltine e chantilly.",
    price: 22,
    category: "bebidas",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80",
    optionGroups: [
      {
        id: "tamanho",
        name: "Tamanho",
        type: "single",
        required: true,
        options: [
          { id: "300ml", name: "300ml" },
          { id: "500ml", name: "500ml", price: 6 }
        ]
      }
    ]
  },
  {
    id: "cha-gelado-casa",
    name: "Chá Gelado da Casa",
    description: "Blend cítrico com hibisco, limão siciliano e toque de hortelã.",
    price: 11,
    category: "bebidas",
    image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=500&q=80",
    optionGroups: [
      {
        id: "gelo",
        name: "Gelo",
        type: "single",
        required: true,
        options: [
          { id: "normal", name: "Normal" },
          { id: "pouco-gelo", name: "Pouco gelo" },
          { id: "sem-gelo", name: "Sem gelo" }
        ]
      }
    ]
  },
  {
    id: "brownie-vulcao",
    name: "Brownie Vulcão",
    description: "Brownie de cacau intenso com calda quente de chocolate e sorvete.",
    price: 18,
    category: "sobremesas",
    image: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=500&q=80",
    optionGroups: [
      {
        id: "calda",
        name: "Calda",
        type: "single",
        required: true,
        options: [
          { id: "chocolate", name: "Chocolate" },
          { id: "doce-de-leite", name: "Doce de leite" }
        ]
      }
    ]
  },
  {
    id: "cheesecake-frutas-vermelhas",
    name: "Cheesecake de Frutas Vermelhas",
    description: "Base crocante, creme aveludado e cobertura artesanal de frutas vermelhas.",
    price: 19,
    category: "sobremesas",
    image: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=500&q=80",
    optionGroups: [
      {
        id: "cobertura",
        name: "Cobertura",
        type: "single",
        required: true,
        options: [
          { id: "frutas-vermelhas", name: "Frutas vermelhas" },
          { id: "caramelo", name: "Caramelo salgado" }
        ]
      }
    ]
  },
  {
    id: "cookie-frigideira",
    name: "Cookie de Frigideira",
    description: "Cookie assado na hora com gotas de chocolate e sorvete de creme.",
    price: 21,
    category: "sobremesas",
    image: "https://images.unsplash.com/photo-1564355808539-22fda35bed7e?w=500&q=80",
    optionGroups: [
      {
        id: "acompanhamento",
        name: "Acompanhamento",
        type: "single",
        required: true,
        options: [
          { id: "sorvete-creme", name: "Sorvete de creme" },
          { id: "chantilly", name: "Chantilly" }
        ]
      },
      {
        id: "extras",
        name: "Adicionais",
        type: "multiple",
        maxSelections: 2,
        options: [
          { id: "calda-chocolate", name: "Calda de chocolate", price: 3 },
          { id: "ovomaltine", name: "Ovomaltine", price: 4 }
        ]
      }
    ]
  }
];

export const featuredItems = menuItems.filter((item) =>
  ["onix-prime", "black-truffle-burger", "gold-bbq", "bourbon-bacon-jam"].includes(item.id)
);
