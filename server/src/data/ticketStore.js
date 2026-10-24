/**
 * NexBank – In-Memory Support Ticket Data Store (Development / Fallback Mode)
 */

let tickets = [
  {
    id: "TKT-2026-8801",
    userId: "NX-8801",
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
    userId: "NX-8801",
    category: "General Inquiry",
    subject: "International contactless spending inquiry",
    description: "Confirming whether contactless limits apply during foreign merchant transactions.",
    transactionReference: null,
    status: "Resolved",
    priority: "Normal",
    createdAt: "2026-08-10T14:30:00.000Z"
  }
];

export function getUserTickets(userId) {
  return tickets
    .filter((t) => t.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getTicketById(id, userId) {
  return tickets.find((t) => (t.id === id || t._id === id) && t.userId === userId) || null;
}

export function createTicket(
  { category, subject, description, transactionReference = null, priority = "Normal" },
  userId
) {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const ticketId = `TKT-2026-${randomSuffix}`;

  const newTicket = {
    id: ticketId,
    userId,
    category: category.trim(),
    subject: subject.trim(),
    description: description.trim(),
    transactionReference: transactionReference ? transactionReference.trim() : null,
    status: "Open",
    priority: priority || "Normal",
    createdAt: new Date().toISOString()
  };

  tickets.unshift(newTicket);
  return newTicket;
}
