const PDFDocument = require("pdfkit");

// ============================================================
// HEMOPHILIA PATIENT CLINICAL SUMMARY PDF
// ============================================================

const generatePatientReport = (data, res) => {
  const patient = data?.patient || {};
  const hemophilia = data?.hemophilia || {};
  const bleeding = data?.bleedingHistory || {};
  const family = data?.familyGeneticHistory || {};
  const treatment = data?.treatment || {};
  const emergencyContact = data?.emergencyContact || {};

  const assessments = Array.isArray(data?.assessmentHistory)
    ? data.assessmentHistory
    : [];

  const latest =
    data?.latestAssessment ||
    (assessments.length ? assessments[assessments.length - 1] : null);

  const timeline = Array.isArray(data?.timeline) ? data.timeline : [];

  // ============================================================
  // HELPERS
  // ============================================================

  const safe = (value, fallback = "Not available") => {
    if (value === null || value === undefined || value === "") {
      return fallback;
    }

    return String(value);
  };

  const yesNo = (value) => {
    if (value === true) return "Yes";
    if (value === false) return "No";

    const v = String(value || "").toLowerCase().trim();

    if (v === "yes") return "Yes";
    if (v === "no") return "No";

    return safe(value);
  };

  const formatDate = (value) => {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const scoreOf = (assessment) => {
    const n = Number(assessment?.score);

    return Number.isFinite(n) ? n : null;
  };

  const riskOf = (assessment) => {
    return safe(
      assessment?.riskLevel,
      "Not available"
    );
  };

  // ============================================================
  // RISK DATA
  // ============================================================

  const scoreHistory = assessments
    .map((a) => ({
      score: scoreOf(a),
      date: a?.createdAt || a?.updatedAt,
    }))
    .filter((x) => x.score !== null);

  const latestScore = scoreOf(latest);
  const latestRisk = riskOf(latest);

  const firstScore = scoreHistory.length
    ? scoreHistory[0].score
    : null;

  let trend = "Not available";

  if (scoreHistory.length >= 2) {
    const last =
      scoreHistory[scoreHistory.length - 1].score;

    if (last > firstScore) {
      trend = "Increasing";
    } else if (last < firstScore) {
      trend = "Decreasing";
    } else {
      trend = "Stable";
    }
  }

  // ============================================================
  // CLINICAL ALERTS
  // ============================================================

  const alerts = [];

  const risk = String(latestRisk).toLowerCase();

  if (
    risk === "high" ||
    risk === "emergency"
  ) {
    alerts.push({
      level: "HIGH",
      text: `Latest assessment indicates ${latestRisk} risk.`,
    });
  }

  if (latest?.strongSuspicionFlag === true) {
    alerts.push({
      level: "HIGH",
      text: "Strong clinical suspicion flag is recorded.",
    });
  }

  if (latest?.emergencyFlag === true) {
    alerts.push({
      level: "HIGH",
      text: "Emergency symptoms were flagged during the latest assessment.",
    });
  }

  if (
    String(
      bleeding.bloodUrineStool
    ).toLowerCase() === "yes"
  ) {
    alerts.push({
      level: "HIGH",
      text: "Blood in urine/stool was reported.",
    });
  }

  if (
    String(
      bleeding.jointSwelling
    ).toLowerCase() === "yes"
  ) {
    alerts.push({
      level: "MEDIUM",
      text: "Repeated joint swelling was reported.",
    });
  }

  if (
    String(
      bleeding.muscleSwelling
    ).toLowerCase() === "yes"
  ) {
    alerts.push({
      level: "MEDIUM",
      text: "Deep muscle swelling was reported.",
    });
  }

  if (
    treatment.mobilityLimitation &&
    String(
      treatment.mobilityLimitation
    ).toLowerCase() !== "none"
  ) {
    alerts.push({
      level: "MEDIUM",
      text: `Mobility limitation recorded: ${treatment.mobilityLimitation}.`,
    });
  }

  if (treatment.underPhysiotherapy === false) {
    alerts.push({
      level: "MEDIUM",
      text: "Physiotherapy is currently recorded as No.",
    });
  }

  // ============================================================
  // DOCUMENT SETUP
  // ============================================================

  const doc = new PDFDocument({
    size: "A4",
    margin: 45,
    bufferPages: true,

    info: {
      Title: `Hemophilia Clinical Report - ${patient.patientId}`,
      Author: "Hemophilia Care",
      Subject: "Clinical Patient Summary",
    },
  });

  res.setHeader(
    "Content-Type",
    "application/pdf"
  );

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="Patient_Record_${patient.patientId}.pdf"`
  );

  doc.pipe(res);

  // ============================================================
  // COLORS & METRICS
  // ============================================================

  const C = {
    navy: "#16324F",
    slate: "#33475B",
    blue: "#2C5CE0",
    lightBlue: "#EEF4FB",
    text: "#152233",
    secondary: "#5B6B7F",
    border: "#D7E0EA",
    rule: "#C7D2DE",

    red: "#B3261E",
    redBg: "#FBE9E7",

    orange: "#A15C00",
    orangeBg: "#FBF0DD",

    green: "#1E7A46",
    greenBg: "#E9F6EE",

    white: "#FFFFFF",
    panel: "#F8FAFC",
  };

  const MARGIN = 45;

  const PAGE_W = doc.page.width;
  const PAGE_H = doc.page.height;

  const CONTENT_W =
    PAGE_W - MARGIN * 2;

  const FOOTER_Y =
    PAGE_H - 62;

  const CONTENT_BOTTOM =
    FOOTER_Y - 18;

  const TOP_FIRST = 132;
  const TOP_OTHER = 92;

  const GAP = 14;

  const COL2 =
    (CONTENT_W - GAP) / 2;

  const COL3 =
    (CONTENT_W - GAP * 2) / 3;

  // ============================================================
  // PAGE FURNITURE
  // ============================================================

  const drawMasthead = () => {
    doc
      .rect(0, 0, PAGE_W, 100)
      .fill(C.navy);

    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor(C.white)
      .text(
        "HEMOPHILIA CARE",
        MARGIN,
        26,
        {
          lineBreak: false,
        }
      );

    doc
      .font("Helvetica")
      .fontSize(9.5)
      .fillColor("#CBDCEF")
      .text(
        "Patient Clinical Summary Report",
        MARGIN,
        48,
        {
          lineBreak: false,
        }
      );

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor("#9FB6D2")
      .text(
        "Confidential \u2013 For Clinical Use Only",
        MARGIN,
        63,
        {
          lineBreak: false,
        }
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(10)
      .fillColor(C.white)
      .text(
        safe(patient.fullName, "Patient"),
        MARGIN,
        26,
        {
          width: CONTENT_W,
          align: "right",
        }
      );

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor("#CBDCEF")
      .text(
        `ID: ${safe(patient.patientId)}`,
        MARGIN,
        41,
        {
          width: CONTENT_W,
          align: "right",
        }
      );

    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor("#9FB6D2")
      .text(
        `Generated ${formatDate(new Date())}`,
        MARGIN,
        54,
        {
          width: CONTENT_W,
          align: "right",
        }
      );

    doc.y = TOP_FIRST;
  };

  const drawContinuationHeader = () => {
    doc
      .font("Helvetica-Bold")
      .fontSize(8.5)
      .fillColor(C.navy)
      .text(
        "HEMOPHILIA CARE \u2014 Patient Clinical Summary",
        MARGIN,
        40,
        {
          lineBreak: false,
        }
      );

    doc
      .font("Helvetica")
      .fontSize(8.5)
      .fillColor(C.secondary)
      .text(
        `${safe(patient.fullName, "Patient")}  \u00b7  ID ${safe(patient.patientId)}`,
        MARGIN,
        40,
        {
          width: CONTENT_W,
          align: "right",
          lineBreak: false,
        }
      );

    doc
      .moveTo(MARGIN, 58)
      .lineTo(PAGE_W - MARGIN, 58)
      .strokeColor(C.rule)
      .lineWidth(0.75)
      .stroke();

    doc.y = TOP_OTHER;
  };

  const drawFooter = (
    pageNumber,
    totalPages
  ) => {
    doc.save();

    doc
      .strokeColor(C.border)
      .lineWidth(0.6)
      .moveTo(MARGIN, FOOTER_Y)
      .lineTo(PAGE_W - MARGIN, FOOTER_Y)
      .stroke();

    doc
      .font("Helvetica")
      .fontSize(7)
      .fillColor(C.secondary)
      .text(
        "Hemophilia Care \u2022 Clinical Summary \u2022 Authorized Clinical Access",
        MARGIN,
        FOOTER_Y + 8,
        {
          width: 350,
          lineBreak: false,
        }
      );

    doc.text(
      `Page ${pageNumber} of ${totalPages}`,
      PAGE_W - MARGIN - 100,
      FOOTER_Y + 8,
      {
        width: 100,
        align: "right",
        lineBreak: false,
      }
    );

    doc.restore();
  };

  // ============================================================
  // PAGE SPACE
  // ============================================================

  const ensureSpace = (height) => {
    if (
      doc.y + height >
      CONTENT_BOTTOM
    ) {
      doc.addPage();
      drawContinuationHeader();
    }
  };

  // ============================================================
  // SECTION
  // ============================================================

  const section = (
    title,
    subtitle = "",
    reserve = 60
  ) => {
    ensureSpace(reserve);

    const titleY = doc.y;

    doc
      .font("Helvetica-Bold")
      .fontSize(12.5)
      .fillColor(C.navy)
      .text(
        title,
        MARGIN,
        titleY,
        {
          lineBreak: false,
        }
      );

    const ruleY = titleY + 18;

    doc
      .moveTo(MARGIN, ruleY)
      .lineTo(PAGE_W - MARGIN, ruleY)
      .strokeColor(C.rule)
      .lineWidth(0.75)
      .stroke();

    doc.y = ruleY + 8;

    if (subtitle) {
      doc
        .font("Helvetica-Oblique")
        .fontSize(8)
        .fillColor(C.secondary)
        .text(
          subtitle,
          MARGIN,
          doc.y,
          {
            width: CONTENT_W,
          }
        );

      doc.y += 4;
    }

    doc.y += 6;
  };

  // ============================================================
  // CARDS
  // ============================================================

  const CARD_H = 54;

  const card = (
    x,
    y,
    w,
    h,
    label,
    value,
    bg = C.white
  ) => {
    doc
      .roundedRect(x, y, w, h, 5)
      .fillColor(bg)
      .fill()
      .strokeColor(C.border)
      .lineWidth(0.75)
      .stroke();

    doc
      .font("Helvetica-Bold")
      .fontSize(6.75)
      .fillColor(C.secondary)
      .text(
        label.toUpperCase(),
        x + 10,
        y + 9,
        {
          width: w - 20,
          characterSpacing: 0.3,
        }
      );

    doc
      .font("Helvetica-Bold")
      .fontSize(10.5)
      .fillColor(C.text)
      .text(
        safe(value),
        x + 10,
        y + 24,
        {
          width: w - 20,
          lineBreak: false,
          ellipsis: true,
        }
      );
  };

  const cardRow = (
    items,
    height = CARD_H
  ) => {
    ensureSpace(height + 6);

    const y = doc.y;

    const n = items.length;

    const w =
      n === 2
        ? COL2
        : n === 3
        ? COL3
        : (CONTENT_W -
            GAP * (n - 1)) /
          n;

    items.forEach(
      (item, i) => {
        const x =
          MARGIN +
          i * (w + GAP);

        card(
          x,
          y,
          w,
          height,
          item.label,
          item.value,
          item.bg
        );
      }
    );

    doc.y =
      y +
      height +
      10;
  };

  // ============================================================
  // PAGE 1
  // ============================================================

  drawMasthead();

  // ============================================================
  // PATIENT INFORMATION
  // ============================================================

  section(
    "Patient Information",
    "Basic identification information required for clinical reference.",
    90
  );

  cardRow([
    {
      label: "Patient Name",
      value: patient.fullName,
    },
    {
      label: "Patient ID",
      value: patient.patientId,
    },
  ]);

  cardRow([
    {
      label: "Age",
      value: patient.age,
    },
    {
      label: "Gender",
      value: patient.gender,
    },
    {
      label: "Blood Group",
      value: patient.bloodGroup,
    },
  ]);

  // ============================================================
  // EMERGENCY CONTACT
  // ============================================================

  section(
    "Emergency Contact",
    "Emergency contact information recorded for the patient.",
    100
  );

  cardRow([
    {
      label: "Name",
      value: emergencyContact.name,
    },
    {
      label: "Relationship",
      value: emergencyContact.relationship,
    },
    {
      label: "Mobile Number",
      value: emergencyContact.phone,
    },
  ]);

  // ============================================================
  // CLINICAL SUMMARY
  // ============================================================

  section(
    "Clinical Summary",
    "Key disease and current risk information.",
    130
  );

  const riskBg =
    risk.includes("high") ||
    risk.includes("emergency")
      ? C.redBg
      : risk.includes("moderate")
      ? C.orangeBg
      : C.greenBg;

  cardRow([
    {
      label: "Hemophilia Type",
      value: hemophilia.type,
    },
    {
      label: "Severity",
      value: hemophilia.severity,
    },
    {
      label: "Latest Risk",
      value: latestRisk,
      bg: riskBg,
    },
  ]);

  cardRow([
    {
      label: "Latest Score",
      value: latestScore,
    },
    {
      label: "Assessment Date",
      value: latest
        ? formatDate(latest.createdAt)
        : null,
    },
    {
      label: "Risk Trend",
      value: trend,
    },
  ]);

  // ============================================================
  // CLINICAL ATTENTION
  // ============================================================

  if (alerts.length) {
    section(
      "Clinical Attention",
      "Issues from the available clinical record that may require review.",
      70
    );

    alerts.forEach(
      (alert) => {
        ensureSpace(36);

        const bg =
          alert.level === "HIGH"
            ? C.redBg
            : C.orangeBg;

        const color =
          alert.level === "HIGH"
            ? C.red
            : C.orange;

        const y = doc.y;

        doc
          .roundedRect(
            MARGIN,
            y,
            CONTENT_W,
            30,
            5
          )
          .fillColor(bg)
          .fill();

        doc
          .font("Helvetica-Bold")
          .fontSize(7.5)
          .fillColor(color)
          .text(
            alert.level === "HIGH"
              ? "HIGH"
              : "ATTENTION",
            MARGIN + 10,
            y + 11,
            {
              width: 65,
            }
          );

        doc
          .font("Helvetica")
          .fontSize(8.5)
          .fillColor(C.text)
          .text(
            alert.text,
            MARGIN + 78,
            y + 10,
            {
              width:
                CONTENT_W - 90,
            }
          );

        doc.y = y + 38;
      }
    );
  }

  // ============================================================
  // RISK TREND
  // ============================================================

  if (scoreHistory.length) {
    section(
      "Risk Assessment Trend",
      "Progression of recorded assessment scores over time.",
      230
    );

    const chartX = MARGIN + 20;
    const chartY = doc.y;

    const chartW =
      CONTENT_W - 40;

    const chartH = 175;

    doc
      .roundedRect(
        chartX,
        chartY,
        chartW,
        chartH,
        5
      )
      .fillColor(C.panel)
      .fill()
      .strokeColor(C.border)
      .stroke();

    const scores =
      scoreHistory.map(
        (x) => x.score
      );

    const maxScore =
      Math.max(
        10,
        Math.ceil(
          Math.max(...scores) / 5
        ) * 5
      );

    const graphX =
      chartX + 42;

    const graphY =
      chartY + 16;

    const graphW =
      chartW - 60;

    const graphH =
      chartH - 46;

    for (
      let i = 0;
      i <= 5;
      i++
    ) {
      const y =
        graphY +
        graphH -
        (graphH * i) / 5;

      const value =
        Math.round(
          (maxScore * i) / 5
        );

      doc
        .moveTo(
          graphX,
          y
        )
        .lineTo(
          graphX + graphW,
          y
        )
        .strokeColor(C.border)
        .lineWidth(0.5)
        .stroke();

      doc
        .font("Helvetica")
        .fontSize(6.5)
        .fillColor(C.secondary)
        .text(
          String(value),
          chartX + 6,
          y - 3,
          {
            width: 30,
            align: "right",
          }
        );
    }

    const points =
      scoreHistory.map(
        (item, i) => {
          const x =
            scoreHistory.length === 1
              ? graphX +
                graphW / 2
              : graphX +
                (graphW * i) /
                  (scoreHistory.length - 1);

          const y =
            graphY +
            graphH -
            (item.score /
              maxScore) *
              graphH;

          return {
            x,
            y,
            score: item.score,
          };
        }
      );

    for (
      let i = 1;
      i < points.length;
      i++
    ) {
      doc
        .moveTo(
          points[i - 1].x,
          points[i - 1].y
        )
        .lineTo(
          points[i].x,
          points[i].y
        )
        .strokeColor(C.blue)
        .lineWidth(1.75)
        .stroke();
    }

    points.forEach(
      (point, i) => {
        doc
          .circle(
            point.x,
            point.y,
            3.25
          )
          .fillColor(C.blue)
          .fill();

        doc
          .font("Helvetica-Bold")
          .fontSize(6.75)
          .fillColor(C.text)
          .text(
            String(point.score),
            point.x - 12,
            point.y - 15,
            {
              width: 24,
              align: "center",
            }
          );

        doc
          .font("Helvetica")
          .fontSize(6.75)
          .fillColor(C.secondary)
          .text(
            `A${i + 1}`,
            point.x - 12,
            chartY +
              chartH -
              22,
            {
              width: 24,
              align: "center",
            }
          );
      }
    );

    doc.y =
      chartY +
      chartH +
      12;

    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(C.secondary)
      .text(
        `First recorded score: ${firstScore}   |   Latest score: ${
          latestScore ??
          "Not available"
        }   |   Trend: ${trend}`,
        MARGIN,
        doc.y,
        {
          width: CONTENT_W,
        }
      );

    doc.y += 14;
  }

  // ============================================================
  // BLEEDING PROFILE
  // ============================================================

  section(
    "Bleeding Profile",
    "Current bleeding-related findings available in the clinical record.",
    170
  );

  cardRow([
    {
      label: "Bleeding Frequency",
      value: bleeding.bleedFrequency,
    },
    {
      label: "Last Bleeding Event",
      value: formatDate(
        bleeding.lastBleedDate
      ),
    },
    {
      label: "Affected Joints",
      value: Array.isArray(
        bleeding.jointsAffected
      )
        ? bleeding.jointsAffected.length
        : 0,
    },
  ]);

  const bleedingRows = [
    [
      "Minor-cut Bleeding",
      bleeding.bleedingAfterMinorCuts,
    ],
    [
      "Dental / Surgery Bleeding",
      bleeding.dentalSurgeryBleeding,
    ],
    [
      "Bruising",
      bleeding.bruising,
    ],
    [
      "Muscle Swelling",
      bleeding.muscleSwelling,
    ],
    [
      "Joint Swelling",
      bleeding.jointSwelling,
    ],
    [
      "Blood in Urine / Stool",
      bleeding.bloodUrineStool,
    ],
  ];

  ensureSpace(100);

  const bStartY =
    doc.y;

  bleedingRows.forEach(
    (item, index) => {
      const r =
        Math.floor(index / 3);

      const c =
        index % 3;

      const x =
        MARGIN +
        c * (COL3 + GAP);

      const y =
        bStartY +
        r * 46;

      doc
        .font("Helvetica")
        .fontSize(7.5)
        .fillColor(C.secondary)
        .text(
          item[0],
          x,
          y,
          {
            width: COL3,
          }
        );

      doc
        .font("Helvetica-Bold")
        .fontSize(9.5)
        .fillColor(C.text)
        .text(
          yesNo(item[1]),
          x,
          y + 13,
          {
            width: COL3,
            lineBreak: false,
          }
        );
    }
  );

  doc.y =
    bStartY + 96;

  // ============================================================
  // MUSCULOSKELETAL STATUS
  // ============================================================

  section(
    "Musculoskeletal Status",
    "Joint involvement and mobility-related findings.",
    220
  );

  const joints =
    Array.isArray(
      bleeding.jointsAffected
    )
      ? bleeding.jointsAffected
      : [];

  cardRow([
    {
      label: "Affected Joints",
      value: joints.length
        ? joints.join(", ")
        : "None recorded",
    },
    {
      label: "Target Joint",
      value: (Array.isArray(bleeding.targetJoint)
        ? bleeding.targetJoint
        : [bleeding.targetJoint]
      )
        .filter(Boolean)
        .join(", ") || "None recorded",
    },
  ]);

  cardRow([
    {
      label: "Joint Swelling",
      value: yesNo(
        bleeding.jointSwelling
      ),
    },
    {
      label: "Muscle Swelling",
      value: yesNo(
        bleeding.muscleSwelling
      ),
    },
    {
      label: "Mobility",
      value:
        treatment.mobilityLimitation,
    },
  ]);

  cardRow([
    {
      label: "Physiotherapy",
      value: yesNo(
        treatment.underPhysiotherapy
      ),
    },
    {
      label: "Assistive Devices",
      value:
        treatment.assistiveDevices,
    },
  ]);

  // ============================================================
  // FAMILY & GENETIC HISTORY
  // ============================================================

  section(
    "Family & Genetic History",
    "Relevant family-history and testing information recorded during assessment.",
    150
  );

  cardRow([
    {
      label: "Family History",
      value:
        family.familyHistory,
    },
    {
      label: "Male Relative",
      value: yesNo(
        family.maleRelativeFlag
      ),
    },
    {
      label: "Previous Testing",
      value:
        family.previousTesting,
    },
  ]);

  cardRow([
    {
      label: "Factor Level History",
      value:
        family.factorLow,
    },
  ]);

  // ============================================================
  // CURRENT TREATMENT
  // ============================================================

  section(
    "Current Treatment",
    "Current therapy and medication information.",
    100
  );

  cardRow(
    [
      {
        label: "Factor Therapy",
        value:
          treatment.currentFactorTherapy,
      },
      {
        label: "Other Medications",
        value:
          treatment.otherMedications,
      },
    ],
    62
  );

  // ============================================================
  // CLINICAL TIMELINE
  // ============================================================

  const timelineItems = [];

  if (timeline.length) {
    timeline
      .slice(0, 2)
      .forEach((e) =>
        timelineItems.push(e)
      );

    if (assessments.length) {
      timelineItems.push({
        title:
          "Initial Risk Assessment",

        description:
          `Risk: ${riskOf(
            assessments[0]
          )} | Score: ${scoreOf(
            assessments[0]
          )}`,

        date:
          assessments[0].createdAt,
      });
    }

    if (assessments.length > 1) {
      timelineItems.push({
        title:
          "Latest Risk Assessment",

        description:
          `Risk: ${riskOf(
            latest
          )} | Score: ${scoreOf(
            latest
          )}`,

        date:
          latest.createdAt,
      });
    }

    const hemEvent =
      timeline.find(
        (e) =>
          e.type ===
          "hemophilia_record"
      );

    if (hemEvent) {
      timelineItems.push(
        hemEvent
      );
    }
  }

  const seen =
    new Set();

  const uniqueTimeline =
    timelineItems.filter(
      (event) => {
        const key =
          `${event.title}|${event.date}`;

        if (seen.has(key)) {
          return false;
        }

        seen.add(key);

        return true;
      }
    );

  if (uniqueTimeline.length) {
    section(
      "Clinical Timeline",
      "Important clinical milestones rather than individual assessment responses.",
      90
    );

    uniqueTimeline
      .sort(
        (a, b) =>
          new Date(a.date) -
          new Date(b.date)
      )
      .forEach(
        (event) => {
          ensureSpace(44);

          const y =
            doc.y;

          doc
            .circle(
              MARGIN + 4,
              y + 6,
              3.5
            )
            .fillColor(C.blue)
            .fill();

          doc
            .font("Helvetica-Bold")
            .fontSize(9)
            .fillColor(C.text)
            .text(
              safe(event.title),
              MARGIN + 18,
              y,
              {
                width:
                  CONTENT_W - 130,
              }
            );

          doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor(C.secondary)
            .text(
              formatDate(
                event.date
              ),
              MARGIN,
              y,
              {
                width:
                  CONTENT_W,
                align:
                  "right",
              }
            );

          doc
            .font("Helvetica")
            .fontSize(8)
            .fillColor(C.secondary)
            .text(
              safe(
                event.description
              ),
              MARGIN + 18,
              y + 14,
              {
                width:
                  CONTENT_W - 20,
              }
            );

          doc.y =
            y + 40;
        }
      );
  }

  // ============================================================
  // CLINICAL SUMMARY FOR REVIEW
  // ============================================================

  const summaryPoints = [];

  if (
    latestRisk !==
    "Not available"
  ) {
    summaryPoints.push(
      `Latest recorded risk is ${latestRisk}${
        latestScore !== null
          ? ` with a score of ${latestScore}`
          : ""
      }.`
    );
  }

  if (
    trend ===
    "Increasing"
  ) {
    summaryPoints.push(
      "The recorded assessment trend is increasing and should be reviewed alongside the patient's clinical history."
    );
  }

  if (joints.length) {
    summaryPoints.push(
      `Joint involvement is recorded in ${joints.join(
        ", "
      )}.`
    );
  }

  if (
    treatment.mobilityLimitation
  ) {
    summaryPoints.push(
      `Mobility limitation is recorded as ${treatment.mobilityLimitation}.`
    );
  }

  if (
    treatment.currentFactorTherapy
  ) {
    summaryPoints.push(
      `Current factor therapy recorded: ${treatment.currentFactorTherapy}.`
    );
  }

  if (!summaryPoints.length) {
    summaryPoints.push(
      "No additional clinical summary could be derived from the available recorded information."
    );
  }

  section(
    "Clinical Summary for Review",
    "Concise interpretation of the information currently recorded in the system.",
    70 +
      summaryPoints.length * 4
  );

  summaryPoints.forEach(
    (text) => {
      ensureSpace(18);

      doc
        .font("Helvetica")
        .fontSize(9)
        .fillColor(C.text)
        .text(
          `\u2022 ${text}`,
          MARGIN + 10,
          doc.y,
          {
            width:
              CONTENT_W - 10,
          }
        );

      doc.y += 4;
    }
  );

  // ============================================================
  // FOOTERS
  // ============================================================

  const range =
    doc.bufferedPageRange();

  const totalPages =
    range.count;

  for (
    let i = 0;
    i < totalPages;
    i++
  ) {
    doc.switchToPage(i);

    drawFooter(
      i + 1,
      totalPages
    );
  }

  doc.end();
};

// ============================================================
// EXPORT
// ============================================================

module.exports =
  generatePatientReport;