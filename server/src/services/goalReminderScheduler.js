import mongoose from "mongoose";
import { SavingsGoal } from "../models/SavingsGoal.js";
import { Notification } from "../models/Notification.js";
import { isDbConnected } from "../config/db.js";
import { getUserGoals } from "../data/savingsStore.js";
import { getUserNotifications, createNotification } from "../data/notificationStore.js";

let schedulerInterval = null;

function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Calculates remaining calendar days between a target date and a base reference date.
 * 
 * Date and Timezone Boundary Handling:
 * Both dates are converted to UTC midnight (00:00:00.000Z) using their UTC year, month, and date.
 * This eliminates timezone drift and intraday hour offsets.
 * 
 * @param {Date|string} targetDate - The goal completion target date
 * @param {Date|string} [baseDate=new Date()] - Reference date (defaults to current system time)
 * @returns {number|null} Whole integer number of calendar days remaining, or null if invalid
 */
export function calculateDaysRemaining(targetDate, baseDate = new Date()) {
  const target = new Date(targetDate);
  const base = new Date(baseDate);

  if (isNaN(target.getTime()) || isNaN(base.getTime())) {
    return null;
  }

  const targetUtc = Date.UTC(target.getUTCFullYear(), target.getUTCMonth(), target.getUTCDate());
  const baseUtc = Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((targetUtc - baseUtc) / msPerDay);
}

/**
 * Checks for incomplete savings goals falling within the 10-day milestone window
 * and creates persistent in-app notifications without duplicates.
 * 
 * Offline Catch-Up & Boundary Specification:
 * - A goal is eligible when 0 <= daysRemaining <= 10.
 * - When online, notifications trigger at exactly 10 days (daysRemaining === 10).
 * - If the server was offline when the 10-day mark hit, starting the backend
 *   processes eligible goals (daysRemaining <= 10 && >= 0) without creating duplicates.
 * - Double deduplication: checks goal.reminderSent10Day AND existing Notification records.
 * - Completed goals (isCompleted === true or savedAmount >= targetAmount) are strictly skipped.
 * 
 * @param {Date|string} [baseDate=new Date()] - Optional date for scheduled execution or deterministic unit tests
 * @returns {Promise<{ checked: number, remindersCreated: number, source: string }>}
 */
export async function checkSavingsGoalReminders(baseDate = new Date()) {
  let remindersCreated = 0;
  let checked = 0;

  // Case A: MongoDB Atlas connected
  if (isDbConnected()) {
    try {
      const incompleteGoals = await SavingsGoal.find({
        isCompleted: false,
        reminderSent10Day: { $ne: true }
      });

      checked = incompleteGoals.length;

      for (const goal of incompleteGoals) {
        // Skip if already completed by amount
        if (goal.isCompleted || Number(goal.savedAmount || 0) >= Number(goal.targetAmount)) {
          continue;
        }

        const daysRemaining = calculateDaysRemaining(goal.targetDate, baseDate);
        if (daysRemaining === null) continue;

        // 10-day reminder window: exactly 10 days away, or catch-up within 0 to 10 days if offline
        if (daysRemaining <= 10 && daysRemaining >= 0) {
          // Check if milestone notification already exists for this goal to prevent duplication across restarts
          const existingNotif = await Notification.findOne({
            user: goal.user,
            type: "goal_reminder",
            message: new RegExp(`10 days left to complete your savings goal ['"]${escapeRegex(goal.name)}['"]`, "i")
          });

          if (existingNotif) {
            goal.reminderSent10Day = true;
            await goal.save();
            continue;
          }

          // Persist the in-app reminder notification in MongoDB Atlas
          await Notification.create({
            user: goal.user,
            title: `Savings Goal Reminder: ${goal.name}`,
            message: `Only 10 days left to complete your savings goal '${goal.name}'! Keep saving to reach your target.`,
            type: "goal_reminder",
            isRead: false
          });

          goal.reminderSent10Day = true;
          await goal.save();
          remindersCreated++;
        }
      }

      return {
        checked,
        remindersCreated,
        source: "MongoDB Atlas",
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.error("[SAVINGS_REMINDER] Error checking goals in MongoDB:", err.message);
      throw err;
    }
  }

  // Case B: In-Memory Fallback Store (Offline/Dev mode)
  try {
    const defaultUserId = "NX-8801";
    const localGoals = getUserGoals(defaultUserId);
    checked = localGoals.length;

    for (const goal of localGoals) {
      if (goal.isCompleted || Number(goal.savedAmount || 0) >= Number(goal.targetAmount)) {
        continue;
      }
      if (goal.reminderSent10Day) continue;

      const daysRemaining = calculateDaysRemaining(goal.targetDate, baseDate);
      if (daysRemaining !== null && daysRemaining <= 10 && daysRemaining >= 0) {
        const existing = getUserNotifications(defaultUserId).find((n) =>
          n.type === "goal_reminder" &&
          n.message &&
          n.message.includes(`10 days left to complete your savings goal '${goal.name}'`)
        );

        if (!existing) {
          createNotification(
            {
              title: `Savings Goal Reminder: ${goal.name}`,
              message: `Only 10 days left to complete your savings goal '${goal.name}'! Keep saving to reach your target.`,
              type: "goal_reminder"
            },
            defaultUserId
          );
          goal.reminderSent10Day = true;
          remindersCreated++;
        } else {
          goal.reminderSent10Day = true;
        }
      }
    }

    return {
      checked,
      remindersCreated,
      source: "Development In-Memory Store",
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error("[SAVINGS_REMINDER] Error checking in-memory goals:", err.message);
    throw err;
  }
}

/**
 * Starts the background periodic scheduler for savings goal 10-day reminders
 * 
 * @param {number} [intervalMs=3600000] - Polling interval in ms (default: 1 hour)
 */
export function startGoalReminderScheduler(intervalMs = 3600000) {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  // Initial check on backend launch (handles offline catch-up automatically)
  checkSavingsGoalReminders().catch((err) => {
    console.warn("[SAVINGS_REMINDER] Initial scheduler check warning:", err.message);
  });

  schedulerInterval = setInterval(() => {
    checkSavingsGoalReminders().catch((err) => {
      console.error("[SAVINGS_REMINDER] Background scheduled check error:", err.message);
    });
  }, intervalMs);

  // Unref interval so it does not block Node process termination during graceful shutdown
  if (schedulerInterval && typeof schedulerInterval.unref === "function") {
    schedulerInterval.unref();
  }

  console.log(`[SAVINGS_REMINDER] Goal reminder background scheduler active (interval: ${intervalMs}ms).`);
}

/**
 * Stops the background scheduler
 */
export function stopGoalReminderScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("[SAVINGS_REMINDER] Goal reminder scheduler stopped.");
  }
}
