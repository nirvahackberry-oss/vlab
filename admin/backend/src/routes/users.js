import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../lib/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import {
  userCreateSchema,
  userUpdateSchema,
  creditAdjustSchema,
  bulkUploadOptionsSchema,
} from "../schemas/index.js";
import * as userService from "../services/userService.js";
import { parseBulkUserFile, buildBulkTemplateBuffer } from "../lib/parseBulkUsers.js";
import { badRequest } from "../lib/errors.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      /\.(xlsx|xls|csv)$/i.test(file.originalname) ||
      file.mimetype.includes("spreadsheet") ||
      file.mimetype.includes("excel") ||
      file.mimetype === "text/csv";
    if (!ok) return cb(new Error("Only .xlsx, .xls, or .csv files are allowed"));
    cb(null, true);
  },
});

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ success: true, users: userService.listUsers() });
  }),
);

router.get(
  "/bulk-template",
  asyncHandler(async (_req, res) => {
    const buffer = buildBulkTemplateBuffer();
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", 'attachment; filename="student-import-template.xlsx"');
    res.send(buffer);
  }),
);

router.post(
  "/bulk-upload",
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file?.buffer) {
      throw badRequest("Excel file is required (field name: file)");
    }

    const maxRows = Number(process.env.BULK_UPLOAD_MAX_ROWS || 500);
    const rows = parseBulkUserFile(req.file.buffer, maxRows);

    let options = {};
    if (req.body?.options) {
      try {
        options = JSON.parse(req.body.options);
      } catch {
        throw badRequest("Invalid options JSON");
      }
    } else if (req.body?.defaultRole || req.body?.defaultCourseId) {
      options = {
        defaultRole: req.body.defaultRole,
        defaultCourseId: req.body.defaultCourseId || null,
        defaultSemesterIds: req.body.defaultSemesterIds
          ? JSON.parse(req.body.defaultSemesterIds)
          : [],
      };
    }

    bulkUploadOptionsSchema.parse(options);

    const result = await userService.bulkCreateUsers(rows, options);
    res.status(201).json({ success: true, ...result });
  }),
);

router.get(
  "/:userId",
  asyncHandler(async (req, res) => {
    res.json({ success: true, user: userService.getUserById(req.params.userId) });
  }),
);

router.post(
  "/",
  validateBody(userCreateSchema),
  asyncHandler(async (req, res) => {
    const user = await userService.createUser(req.validated);
    res.status(201).json({ success: true, user });
  }),
);

router.patch(
  "/:userId",
  validateBody(userUpdateSchema),
  asyncHandler(async (req, res) => {
    const user = await userService.updateUser(req.params.userId, req.validated);
    res.json({ success: true, user });
  }),
);

router.patch(
  "/:userId/credits",
  validateBody(creditAdjustSchema),
  asyncHandler(async (req, res) => {
    const result = await userService.adjustUserCredits(
      req.params.userId,
      req.validated.amount,
      { reason: req.validated.reason, createdBy: req.auth.userId },
    );
    res.json({ success: true, ...result });
  }),
);

router.delete(
  "/:userId",
  asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.userId, { actorUserId: req.auth.userId });
    res.json({ success: true, message: "User deleted" });
  }),
);

export default router;
