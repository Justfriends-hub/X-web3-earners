import { Router } from "express";
import { getShibRate } from "../rates";

export const rateRouter = Router();

rateRouter.get("/rate", async (_req, res) => {
  const result = await getShibRate();
  res.json(result);
});
