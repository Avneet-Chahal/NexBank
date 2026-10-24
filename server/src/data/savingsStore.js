/**
 * NexBank – In-Memory Savings Goals Store (Fallback for Offline/Dev Mode)
 */

let goals = [
  {
    id: "GOAL-201",
    userId: "NX-8801",
    name: "Emergency Reserve Fund",
    targetAmount: 100000,
    savedAmount: 65000,
    targetDate: "2026-12-31",
    category: "Emergency",
    isCompleted: false,
    currency: "INR",
    createdAt: "2026-01-10T00:00:00.000Z"
  },
  {
    id: "GOAL-202",
    userId: "NX-8801",
    name: "MacBook Pro M-Series",
    targetAmount: 150000,
    savedAmount: 112500,
    targetDate: "2026-10-15",
    category: "Gadgets",
    isCompleted: false,
    currency: "INR",
    createdAt: "2026-03-01T00:00:00.000Z"
  },
  {
    id: "GOAL-203",
    userId: "NX-8801",
    name: "Cloud Architect Certification",
    targetAmount: 35000,
    savedAmount: 35000,
    targetDate: "2026-08-30",
    category: "Education",
    isCompleted: true,
    currency: "INR",
    createdAt: "2026-04-15T00:00:00.000Z"
  }
];

export function getUserGoals(userId) {
  return goals.filter((g) => g.userId === userId);
}

export function createGoal(
  { name, targetAmount, savedAmount = 0, targetDate, category = "General", currency = "INR" },
  userId
) {
  const target = Number(targetAmount);
  const saved = Number(savedAmount || 0);

  const newGoal = {
    id: `GOAL-${Date.now().toString().slice(-4)}`,
    userId,
    name: name.trim(),
    targetAmount: target,
    savedAmount: saved,
    targetDate: targetDate,
    category: category.trim(),
    isCompleted: saved >= target,
    currency,
    createdAt: new Date().toISOString()
  };

  goals.push(newGoal);
  return newGoal;
}

export function updateGoal(id, updates, userId) {
  const index = goals.findIndex((g) => g.id === id && g.userId === userId);
  if (index === -1) return null;

  if (updates.name !== undefined) goals[index].name = updates.name.trim();
  if (updates.targetAmount !== undefined) goals[index].targetAmount = Number(updates.targetAmount);
  if (updates.targetDate !== undefined) goals[index].targetDate = updates.targetDate;
  if (updates.category !== undefined) goals[index].category = updates.category.trim();
  if (updates.savedAmount !== undefined) {
    goals[index].savedAmount = Math.max(0, Number(updates.savedAmount));
    goals[index].isCompleted = goals[index].savedAmount >= goals[index].targetAmount;
  }

  return goals[index];
}

export function contributeToGoal(id, deltaAmount, userId) {
  const index = goals.findIndex((g) => g.id === id && g.userId === userId);
  if (index === -1) return null;

  const current = goals[index].savedAmount;
  const newAmount = Math.max(0, current + Number(deltaAmount));
  goals[index].savedAmount = newAmount;
  goals[index].isCompleted = newAmount >= goals[index].targetAmount;

  return goals[index];
}

export function deleteGoal(id, userId) {
  const index = goals.findIndex((g) => g.id === id && g.userId === userId);
  if (index === -1) return false;

  goals.splice(index, 1);
  return true;
}

export function resetGoalStore() {
  goals = [];
}
