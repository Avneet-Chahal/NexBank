import { getAuthToken } from "./authService.js";
import { getStorageItem, setStorageItem } from "../utils/storage.js";

const LOCAL_CARD_KEY = "nexbank_local_card_settings";

const INITIAL_DEMO_CARD = {
  id: "CARD-8801",
  cardNumber: "4501 8820 9104 9104",
  cardHolder: "Demo Customer",
  expiryDate: "08/29",
  cvv: "842",
  cardType: "Visa Infinite Virtual",
  isFrozen: false,
  monthlyLimit: 50000,
  contactlessEnabled: true,
  internationalEnabled: false,
  onlineTransactionsEnabled: true
};

function getLocalCard() {
  const saved = getStorageItem(LOCAL_CARD_KEY);
  if (saved && typeof saved === "object") {
    return { ...INITIAL_DEMO_CARD, ...saved };
  }
  setStorageItem(LOCAL_CARD_KEY, INITIAL_DEMO_CARD);
  return INITIAL_DEMO_CARD;
}

function saveLocalCard(card) {
  setStorageItem(LOCAL_CARD_KEY, card);
}

/**
 * Fetch virtual card details & controls
 */
export async function fetchCard() {
  try {
    const token = getAuthToken();
    const headers = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("http://localhost:5000/api/cards", { headers });
    if (res.ok) {
      const data = await res.json();
      return {
        card: data.data,
        source: data.source || "Express Backend"
      };
    }
  } catch (err) {
    console.warn("Backend card API unreachable, using local fallback:", err.message);
  }

  return {
    card: getLocalCard(),
    source: "Resilient Demo Storage (Offline)"
  };
}

/**
 * Update card settings (freeze toggle, limit, contactless, etc.)
 */
export async function updateCardSettings(settings) {
  try {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("http://localhost:5000/api/cards/settings", {
      method: "PATCH",
      headers,
      body: JSON.stringify(settings)
    });

    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn("Backend offline, saving card settings locally:", err.message);
  }

  const local = getLocalCard();
  const updated = { ...local, ...settings };
  saveLocalCard(updated);
  return updated;
}

/**
 * Returns realistic demo activity specifically tied to the virtual card
 */
export function getDemoCardActivity() {
  return [
    {
      id: "CA-1",
      merchant: "Amazon Cloud Services",
      date: "Today, 10:14 AM",
      amount: 2499.0,
      channel: "Online Purchase",
      status: "Approved"
    },
    {
      id: "CA-2",
      merchant: "Starbucks Coffee Tap-to-Pay",
      date: "Yesterday, 04:30 PM",
      amount: 380.0,
      channel: "Contactless NFC",
      status: "Approved"
    },
    {
      id: "CA-3",
      merchant: "Apple Developer Subscription",
      date: "Aug 15, 09:00 AM",
      amount: 8900.0,
      channel: "Recurring Digital",
      status: "Approved"
    }
  ];
}
