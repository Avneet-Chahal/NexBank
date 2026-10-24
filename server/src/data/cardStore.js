/**
 * NexBank – In-Memory Virtual Card Store (Development / Fallback Mode)
 */

let cards = [
  {
    id: "CARD-8801",
    userId: "NX-8801",
    cardNumber: "4501 8820 9104 9104",
    cardHolder: "Demo Customer",
    expiryDate: "08/29",
    cvv: "842",
    cardType: "Visa Infinite Virtual",
    isFrozen: false,
    monthlyLimit: 50000,
    contactlessEnabled: true,
    internationalEnabled: false,
    onlineTransactionsEnabled: true,
    createdAt: "2024-01-15T08:30:00.000Z"
  }
];

export function getUserCard(userId, userName = "Demo Customer") {
  let card = cards.find((c) => c.userId === userId);
  if (!card) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    card = {
      id: `CARD-${Date.now().toString().slice(-4)}`,
      userId,
      cardNumber: `4501 8820 9104 ${randomSuffix}`,
      cardHolder: userName,
      expiryDate: "08/29",
      cvv: String(Math.floor(100 + Math.random() * 900)),
      cardType: "Visa Infinite Virtual",
      isFrozen: false,
      monthlyLimit: 50000,
      contactlessEnabled: true,
      internationalEnabled: false,
      onlineTransactionsEnabled: true,
      createdAt: new Date().toISOString()
    };
    cards.push(card);
  }
  return card;
}

export function updateCardSettings(userId, settings = {}) {
  const card = getUserCard(userId);
  if (!card) return null;

  if (settings.isFrozen !== undefined) card.isFrozen = Boolean(settings.isFrozen);
  if (settings.monthlyLimit !== undefined) card.monthlyLimit = Number(settings.monthlyLimit);
  if (settings.contactlessEnabled !== undefined) card.contactlessEnabled = Boolean(settings.contactlessEnabled);
  if (settings.internationalEnabled !== undefined) card.internationalEnabled = Boolean(settings.internationalEnabled);
  if (settings.onlineTransactionsEnabled !== undefined) card.onlineTransactionsEnabled = Boolean(settings.onlineTransactionsEnabled);

  return card;
}
