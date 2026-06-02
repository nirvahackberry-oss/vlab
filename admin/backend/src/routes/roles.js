import { Router } from "express";
import { asyncHandler } from "../lib/asyncHandler.js";
import { validateBody } from "../middleware/validate.js";
import { roleCreateSchema, roleUpdateSchema } from "../schemas/index.js";
import * as roleService from "../services/roleService.js";

const router = Router();

router.get(
  "/",
  asyncHandler(async (_req, res) => {
    res.json({ success: true, roles: roleService.listRoles() });
  }),
);

router.get(
  "/:roleId",
  asyncHandler(async (req, res) => {
    res.json({ success: true, role: roleService.getRoleById(req.params.roleId) });
  }),
);

router.post(
  "/",
  validateBody(roleCreateSchema),
  asyncHandler(async (req, res) => {
    const role = await roleService.createRole(req.validated);
    res.status(201).json({ success: true, role });
  }),
);

router.patch(
  "/:roleId",
  validateBody(roleUpdateSchema),
  asyncHandler(async (req, res) => {
    const role = await roleService.updateRole(req.params.roleId, req.validated);
    res.json({ success: true, role });
  }),
);

router.delete(
  "/:roleId",
  asyncHandler(async (req, res) => {
    await roleService.deleteRole(req.params.roleId);
    res.json({ success: true, message: "Role deleted" });
  }),
);

export default router;
