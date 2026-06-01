import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { courseCreateSchema, courseUpdateSchema } from "../schemas/index.js";
import * as courseService from "../services/courseService.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ success: true, courses: courseService.listCourses() });
  }),
);

router.get(
  "/:courseId",
  asyncHandler(async (req, res) => {
    res.json({ success: true, course: courseService.getCourseById(req.params.courseId) });
  }),
);

router.post(
  "/",
  validateBody(courseCreateSchema),
  asyncHandler(async (req, res) => {
    const course = await courseService.createCourse(req.validated);
    res.status(201).json({ success: true, course });
  }),
);

router.patch(
  "/:courseId",
  validateBody(courseUpdateSchema),
  asyncHandler(async (req, res) => {
    const course = await courseService.updateCourse(req.params.courseId, req.validated);
    res.json({ success: true, course });
  }),
);

router.delete(
  "/:courseId",
  asyncHandler(async (req, res) => {
    await courseService.deleteCourse(req.params.courseId);
    res.json({ success: true, message: "Course deleted" });
  }),
);

export default router;
