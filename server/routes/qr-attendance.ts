import { Express } from "express";
import { storage } from "../storage";
import { format } from "date-fns";
import { createHash } from "crypto";

// Secret for token generation — use env var or a stable default for dev
const TOKEN_SECRET = process.env.QR_TOKEN_SECRET || "gym-genie-qr-secret-change-in-production";

const TOKEN_WINDOW_MINUTES = 5;

function getTimeWindow(): string {
  const now = Date.now();
  const windowMs = TOKEN_WINDOW_MINUTES * 60 * 1000;
  const windowStart = Math.floor(now / windowMs) * windowMs;
  return windowStart.toString();
}

function generateToken(): string {
  const date = format(new Date(), "yyyy-MM-dd");
  const window = getTimeWindow();
  const hash = createHash("sha256")
    .update(`${TOKEN_SECRET}|${date}|${window}`)
    .digest("hex");
  return hash.slice(0, 16);
}

function validateToken(token: string): boolean {
  const date = format(new Date(), "yyyy-MM-dd");
  const currentWindow = getTimeWindow();

  // Check current window
  const currentHash = createHash("sha256")
    .update(`${TOKEN_SECRET}|${date}|${currentWindow}`)
    .digest("hex");
  if (currentHash.slice(0, 16) === token) return true;

  // Also accept previous window (grace period for edge cases)
  const windowMs = TOKEN_WINDOW_MINUTES * 60 * 1000;
  const prevWindow = (parseInt(currentWindow) - windowMs).toString();
  const prevHash = createHash("sha256")
    .update(`${TOKEN_SECRET}|${date}|${prevWindow}`)
    .digest("hex");
  if (prevHash.slice(0, 16) === token) return true;

  return false;
}

export function registerQRAttendanceRoutes(app: Express) {
  // Generate a fresh token for the current time window
  app.get("/api/qr-attendance/token", (_req, res) => {
    res.json({ token: generateToken() });
  });

  // Validate a token
  app.post("/api/qr-attendance/validate-token", (req, res) => {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ valid: false, error: "Token is required" });
    }
    const valid = validateToken(token);
    if (!valid) {
      return res.json({ valid: false, error: "This QR code has expired. Please scan a fresh QR code at the gym." });
    }
    res.json({ valid: true });
  });

  // Lookup member by phone for QR check-in
  app.post("/api/qr-attendance/lookup", async (req, res) => {
    try {
      const { phone, token } = req.body;

      // Validate token
      if (!token || !validateToken(token)) {
        return res.status(403).json({
          error: "This QR code has expired. Please scan a fresh QR code at the gym.",
        });
      }

      if (!phone) {
        return res.status(400).json({ error: "Phone number is required" });
      }

      const member = await storage.getMemberByPhone(phone);
      if (!member) {
        return res.status(404).json({ error: "No member found with this phone number" });
      }

      // Calculate age from DOB
      let age: number | null = null;
      if (member.dob) {
        const birthDate = new Date(member.dob);
        const today = new Date();
        age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
      }

      // Determine subscription status
      const today = format(new Date(), "yyyy-MM-dd");
      const isExpired = member.endDate && member.endDate < today;
      const subscriptionStatus = member.status === "Active"
        ? (isExpired ? "Expired" : "Active")
        : member.status;

      // Check for open (unchecked-out) attendance today
      const openAttendance = await storage.getOpenAttendance(member.id, today);

      // Check if already checked out today
      const todayRecords = await storage.getAttendanceByDate(today);
      const todayRecord = todayRecords.find(r => r.memberId === member.id);
      const alreadyCheckedOut = todayRecord?.checkOutTime != null;

      res.json({
        member: {
          id: member.id,
          name: `${member.firstName} ${member.lastName || ""}`.trim(),
          age,
          subscriptionStatus,
          plan: member.plan,
          startDate: member.startDate,
          endDate: member.endDate,
        },
        openAttendance,
        alreadyCheckedOut: !!alreadyCheckedOut,
      });
    } catch (error) {
      console.error("QR attendance lookup error:", error);
      res.status(500).json({ error: "Failed to look up member" });
    }
  });
}
