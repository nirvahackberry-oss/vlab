import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { labCreateSchema, labUpdateSchema } from "../schemas/index.js";
import * as labService from "../services/labService.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const labs = labService.listLabs({
      courseId: req.query.courseId,
      semesterId: req.query.semesterId,
    });
    res.json({ success: true, labs });
  }),
);

router.get(
  "/:labId",
  asyncHandler(async (req, res) => {
    res.json({ success: true, lab: labService.getLabById(req.params.labId) });
  }),
);

router.post(
  "/",
  validateBody(labCreateSchema),
  asyncHandler(async (req, res) => {
    const lab = await labService.createLab(req.validated);
    res.status(201).json({ success: true, lab });
  }),
);

router.patch(
  "/:labId",
  validateBody(labUpdateSchema),
  asyncHandler(async (req, res) => {
    const lab = await labService.updateLab(req.params.labId, req.validated);
    res.json({ success: true, lab });
  }),
);

router.delete(
  "/:labId",
  asyncHandler(async (req, res) => {
    await labService.deleteLab(req.params.labId);
    res.json({ success: true, message: "Lab deleted" });
  }),
);

export default router;
