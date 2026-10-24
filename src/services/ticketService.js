import { getAuthToken } from "./authService.js";
import { getStorageItem, setStorageItem } from "../utils/storage.js";

const LOCAL_TICKETS_KEY = "nexbank_local_support_tickets";

const INITIAL_DEMO_TICKETS = [
  {
    id: "TKT-2026-8801",
    category: "Transaction Query",
    subject: "Inquiry regarding Amazon debit transaction TX-901",
    description: "Requesting merchant verification code and tax invoice details for recent payment.",
    transactionReference: "TX-901",
    status: "In Review",
    priority: "Normal",
    createdAt: "2026-08-19T11:00:00.000Z"
  },
  {
    id: "TKT-2026-7740",
    category: "General Inquiry",
    subject: "International contactless spending inquiry",
    description: "Confirming whether contactless limits apply during foreign merchant transactions.",
    transactionReference: null,
    status: "Resolved",
    priority: "Normal",
    createdAt: "2026-08-10T14:30:00.000Z"
  }
];

function getLocalTickets() {
  const saved = getStorageItem(LOCAL_TICKETS_KEY);
  if (saved && Array.isArray(saved) && saved.length > 0) {
    return saved;
  }
  setStorageItem(LOCAL_TICKETS_KEY, INITIAL_DEMO_TICKETS);
  return INITIAL_DEMO_TICKETS;
}

function saveLocalTickets(list) {
  setStorageItem(LOCAL_TICKETS_KEY, list);
}

/**
 * Fetch customer support tickets
 */
export async function fetchTickets() {
  try {
    const token = getAuthToken();
    const headers = { Accept: "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("http://localhost:5000/api/tickets", { headers });
    if (res.ok) {
      const data = await res.json();
      return {
        tickets: data.data || [],
        source: data.source || "Express Backend"
      };
    }
  } catch (err) {
    console.warn("Backend tickets API unreachable, using local fallback:", err.message);
  }

  return {
    tickets: getLocalTickets(),
    source: "Resilient Demo Storage (Offline)"
  };
}

/**
 * Submit a new customer support ticket
 */
export async function createTicket(ticketData) {
  try {
    const token = getAuthToken();
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json"
    };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch("http://localhost:5000/api/tickets", {
      method: "POST",
      headers,
      body: JSON.stringify(ticketData)
    });

    if (res.ok) {
      const data = await res.json();
      return data.data;
    }
  } catch (err) {
    console.warn("Backend offline, saving ticket to local store:", err.message);
  }

  const local = getLocalTickets();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const newTicket = {
    id: `TKT-2026-${randomSuffix}`,
    category: ticketData.category,
    subject: ticketData.subject.trim(),
    description: ticketData.description.trim(),
    transactionReference: ticketData.transactionReference || null,
    status: "Open",
    priority: ticketData.priority || "Normal",
    createdAt: new Date().toISOString()
  };

  local.unshift(newTicket);
  saveLocalTickets(local);
  return newTicket;
}
