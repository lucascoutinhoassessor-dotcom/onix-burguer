"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { MenuItem, MenuOptionGroup } from "@/data/menu";

type FulfillmentMode = "entrega" | "retirada" | "local";

type SelectedOption = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
};

export type CartItem = {
  key: string;
  itemId: string;
  name: string;
  image: string;
  quantity: number;
  unitPrice: number;
  selectedOptions: SelectedOption[];
};

type AddToCartPayload = {
  item: MenuItem;
  selectedOptions: SelectedOption[];
};

type CartContextValue = {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  total: number;
  isOpen: boolean;
  fulfillmentMode: FulfillmentMode;
  deliveryAddress: string;
  addItem: (payload: AddToCartPayload) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  openCart: () => void;
  closeCart: () => void;
  setFulfillmentMode: (mode: FulfillmentMode) => void;
  setDeliveryAddress: (address: string) => void;
  clearCart: () => void;
};

type StoredCartState = {
  items: CartItem[];
  fulfillmentMode: FulfillmentMode;
  deliveryAddress: string;
};

const STORAGE_KEY = "onix-burguer-cart";

const CartContext = createContext<CartContextValue | null>(null);

function buildCartKey(itemId: string, selectedOptions: SelectedOption[]) {
  const optionsKey = selectedOptions
    .map((option) => `${option.groupId}:${option.optionId}`)
    .sort()
    .join("|");

  return `${itemId}__${optionsKey || "padrao"}`;
}

function calculateUnitPrice(item: MenuItem, selectedOptions: SelectedOption[]) {
  const optionsTotal = selectedOptions.reduce((total, option) => total + option.price, 0);
  return item.price + optionsTotal;
}

export function getDefaultSelections(optionGroups?: MenuOptionGroup[]) {
  if (!optionGroups) {
    return [];
  }

  return optionGroups.flatMap((group) => {
    if (!group.required || group.options.length === 0) {
      return [];
    }

    const [firstOption] = group.options;
    return [
      {
        groupId: group.id,
        groupName: group.name,
        optionId: firstOption.id,
        optionName: firstOption.name,
        price: firstOption.price ?? 0
      }
    ];
  });
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [fulfillmentMode, setFulfillmentMode] = useState<FulfillmentMode>("entrega");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const rawState = window.localStorage.getItem(STORAGE_KEY);

    if (rawState) {
      try {
        const parsedState = JSON.parse(rawState) as StoredCartState;
        setItems(parsedState.items ?? []);
        setFulfillmentMode(parsedState.fulfillmentMode ?? "entrega");
        setDeliveryAddress(parsedState.deliveryAddress ?? "");
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const state: StoredCartState = {
      items,
      fulfillmentMode,
      deliveryAddress
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [deliveryAddress, fulfillmentMode, hydrated, items]);

  const value = useMemo<CartContextValue>(() => {
    const subtotal = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
    const itemCount = items.reduce((total, item) => total + item.quantity, 0);

    return {
      items,
      itemCount,
      subtotal,
      total: subtotal,
      isOpen,
      fulfillmentMode,
      deliveryAddress,
      addItem: ({ item, selectedOptions }) => {
        const key = buildCartKey(item.id, selectedOptions);
        const unitPrice = calculateUnitPrice(item, selectedOptions);

        setItems((currentItems) => {
          const existingItem = currentItems.find((cartItem) => cartItem.key === key);

          if (existingItem) {
            return currentItems.map((cartItem) =>
              cartItem.key === key ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem
            );
          }

          return [
            ...currentItems,
            {
              key,
              itemId: item.id,
              name: item.name,
              image: item.image,
              quantity: 1,
              unitPrice,
              selectedOptions
            }
          ];
        });

        setIsOpen(true);
      },
      removeItem: (key) => {
        setItems((currentItems) => currentItems.filter((item) => item.key !== key));
      },
      updateQuantity: (key, quantity) => {
        setItems((currentItems) =>
          currentItems.flatMap((item) => {
            if (item.key !== key) {
              return [item];
            }

            if (quantity <= 0) {
              return [];
            }

            return [{ ...item, quantity }];
          })
        );
      },
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      setFulfillmentMode,
      setDeliveryAddress,
      clearCart: () => setItems([])
    };
  }, [deliveryAddress, fulfillmentMode, isOpen, items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }

  return context;
}