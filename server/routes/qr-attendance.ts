import { Express } from "express";
import { storage } from "../storage";
import { format } from "date-fns";

export function registerQRAttendanceRoutes(app: Express) {
  // Lookup member by phone for QR check-in
  app.post("/api/qr-attendance/lookup", async (req, res) => {
    try {
      const { phone } = req.body;
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
