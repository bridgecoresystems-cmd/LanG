import { Elysia, t } from "elysia";
import { db } from "../db/index";
import { gemsWallets, gemsTransactions, gemsVendors, users } from "../db/schema";
import { eq, and } from "drizzle-orm";

/**
 * Terminal routes — used by ESP32 devices in the canteen/shop.
 * No session auth — uses terminalId + authToken instead.
 */
export const terminalRoutes = new Elysia({ prefix: "/terminal" })

  // POST /terminal/payment
  // ESP32 sends: { terminalId, authToken, rfidUid, amount }
  // Returns: student name + new balance (shown on display)
  .post("/payment", async (context: any) => {
    const { body, set } = context;
    const { terminalId, authToken, rfidUid, amount } = body;

    if (amount <= 0) {
      set.status = 400;
      return { status: "error", message: "Invalid amount" };
    }

    // 1. Validate terminal
    const [vendor] = await db
      .select({ id: gemsVendors.id, userId: gemsVendors.userId, name: gemsVendors.name, isActive: gemsVendors.isActive })
      .from(gemsVendors)
      .where(and(eq(gemsVendors.terminalId, terminalId), eq(gemsVendors.authToken, authToken)))
      .limit(1);

    if (!vendor || !vendor.isActive) {
      set.status = 403;
      return { status: "error", message: "Unknown or inactive terminal" };
    }

    // 2. Find student by RFID
    const [student] = await db
      .select({ id: users.id, first_name: users.first_name, last_name: users.last_name, rfid_uid: users.rfid_uid })
      .from(users)
      .where(eq(users.rfid_uid, rfidUid))
      .limit(1);

    if (!student) {
      set.status = 404;
      return { status: "error", message: "RFID not registered" };
    }

    // 3. Get / create student wallet
    let [studentWallet] = await db.select().from(gemsWallets).where(eq(gemsWallets.userId, student.id)).limit(1);
    if (!studentWallet) {
      [studentWallet] = await db.insert(gemsWallets).values({ userId: student.id }).returning();
    }

    if (Number(studentWallet.balance) < amount) {
      return {
        status: "error",
        message: "Insufficient gems",
        studentName: [student.first_name, student.last_name].filter(Boolean).join(" "),
        balance: Number(studentWallet.balance),
      };
    }

    // 4. Get / create vendor wallet
    let [vendorWallet] = await db.select().from(gemsWallets).where(eq(gemsWallets.userId, vendor.userId)).limit(1);
    if (!vendorWallet) {
      [vendorWallet] = await db.insert(gemsWallets).values({ userId: vendor.userId }).returning();
    }

    // 5. Deduct from student, add to vendor
    const newStudentBalance = Number(studentWallet.balance) - amount;
    const newVendorBalance = Number(vendorWallet.balance) + amount;

    await db.update(gemsWallets)
      .set({ balance: String(newStudentBalance), updatedAt: new Date() })
      .where(eq(gemsWallets.userId, student.id));

    await db.update(gemsWallets)
      .set({ balance: String(newVendorBalance), updatedAt: new Date() })
      .where(eq(gemsWallets.userId, vendor.userId));

    // 6. Record transaction
    await db.insert(gemsTransactions).values({
      senderId: student.id,
      receiverId: vendor.userId,
      amount: String(amount),
      type: "purchase",
      comment: `Покупка в "${vendor.name}" (терминал: ${terminalId})`,
    });

    return {
      status: "success",
      studentName: [student.first_name, student.last_name].filter(Boolean).join(" "),
      newBalance: newStudentBalance,
    };
  }, {
    body: t.Object({
      terminalId: t.String(),
      authToken: t.String(),
      rfidUid: t.String(),
      amount: t.Number(),
    }),
  })

  // GET /terminal/balance — check student balance by RFID (no deduction)
  .get("/balance", async (context: any) => {
    const { query, set } = context;
    const { terminalId, authToken, rfidUid } = query;

    if (!terminalId || !authToken || !rfidUid) {
      set.status = 400;
      return { status: "error", message: "Missing params" };
    }

    const [vendor] = await db
      .select({ id: gemsVendors.id, isActive: gemsVendors.isActive })
      .from(gemsVendors)
      .where(and(eq(gemsVendors.terminalId, terminalId), eq(gemsVendors.authToken, authToken)))
      .limit(1);

    if (!vendor || !vendor.isActive) {
      set.status = 403;
      return { status: "error", message: "Unknown terminal" };
    }

    const [student] = await db
      .select({ id: users.id, first_name: users.first_name, last_name: users.last_name })
      .from(users)
      .where(eq(users.rfid_uid, rfidUid))
      .limit(1);

    if (!student) {
      set.status = 404;
      return { status: "error", message: "RFID not registered" };
    }

    const [wallet] = await db.select({ balance: gemsWallets.balance })
      .from(gemsWallets).where(eq(gemsWallets.userId, student.id)).limit(1);

    return {
      status: "ok",
      studentName: [student.first_name, student.last_name].filter(Boolean).join(" "),
      balance: Number(wallet?.balance || 0),
    };
  });
