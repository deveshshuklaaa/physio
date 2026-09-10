const express = require("express");
const PDFDocument = require("pdfkit");
const ScreeningSession = require("../models/ScreeningSession");

const router = express.Router();

// GET /api/reports/screening/:id/pdf
// This endpoint is intentionally unauthenticated to simplify report download.
router.get("/screening/:id/pdf", async (req, res) => {
  try {
    const session = await ScreeningSession.findById(req.params.id);
    if (!session) {
      return res.status(404).json({ message: "Screening session not found" });
    }

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="hemophilia_screening_${session._id}.pdf"`
    );
    res.setHeader("Content-Type", "application/pdf");

    const doc = new PDFDocument();
    doc.pipe(res);

    doc.fontSize(18).text("Hemophilia Screening Report", { underline: true });
    doc.moveDown();

    doc.fontSize(12).text(`Date: ${session.createdAt.toISOString()}`);
    doc.moveDown();

    doc.text(`Risk Level: ${session.riskLevel}`);
    doc.text(`Total Score: ${session.totalScore}`);
    if (session.emergencyFlag) {
      doc.fillColor("red").text("Emergency symptoms were reported.", {
        continued: false,
      });
      doc.fillColor("black");
    }
    doc.moveDown();

    if (session.summaryText) {
      doc.text("Summary:", { underline: true });
      doc.text(session.summaryText);
      doc.moveDown();
    }

    if (session.recommendation) {
      doc.text("Recommendation:", { underline: true });
      doc.text(session.recommendation);
      doc.moveDown();
    }

    if (Array.isArray(session.suggestedTests) && session.suggestedTests.length) {
      doc.text("Suggested Tests:", { underline: true });
      session.suggestedTests.forEach((test) => {
        doc.text(`• ${test}`);
      });
      doc.moveDown();
    }

    doc.moveDown();
    doc.text(
      "Disclaimer: This chatbot provides screening guidance and does not replace medical diagnosis."
    );

    doc.end();
  } catch (err) {
    console.error("Report generation error:", err);
    res.status(500).json({ message: "Failed to generate report" });
  }
});

module.exports = router;

