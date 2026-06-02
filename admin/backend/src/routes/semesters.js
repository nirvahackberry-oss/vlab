import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { semesterCreateSchema, semesterUpdateSchema } from "../schemas/index.js";
import * as semesterService from "../services/semesterService.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const semesters = semesterService.listSemesters({
      courseId: req.query.courseId,
    });
    res.json({ success: true, semesters });
  }),
);

router.get(
  "/:semesterId",
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      semester: semesterService.getSemesterById(req.params.semesterId),
    });
  }),
);

router.post(
  "/",
  validateBody(semesterCreateSchema),
  asyncHandler(async (req, res) => {
    const semester = await semesterService.createSemester(req.validated);
    res.status(201).json({ success: true, semester });
  }),
);

router.patch(
  "/:semesterId",
  validateBody(semesterUpdateSchema),
  asyncHandler(async (req, res) => {
    const semester = await semesterService.updateSemester(
      req.params.semesterId,
      req.validated,
    );
    res.json({ success: true, semester });
  }),
);

router.delete(
  "/:semesterId",
  asyncHandler(async (req, res) => {
    await semesterService.deleteSemester(req.params.semesterId);
    res.json({ success: true, message: "Semester deleted" });
  }),
);

export default router;
