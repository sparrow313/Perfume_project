import { Hono } from "hono";
import { jwt, verify, sign, decode } from "hono/jwt";
import { getPrisma } from "../prismaFunction";
import { number, string, z } from "zod";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { adminAuthMiddleware } from "../middlewares/authMiddleware";

export const perfumeRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    SECRET: string;
  };
}>();

const createPerfumeInput = z.object({
  name: z.string(),
  brand: z.string(),
  description: z.string(),
  notes: z.string(),
  rating: z.number(),
});

perfumeRouter.use("/*", async (c, next) => {
  const header = c.req.header("authorization") || "";
  const user = await verify(header, c.env.SECRET);

  try {
    if (user) {
      //@ts-ignore
      c.set("adminId", user.id);
      await next();
    } else {
      c.status(403);
      c.json({
        message: "You are not loggedIn",
      });
    }
  } catch (error) {
    c.status(403);
    c.json({
      message: "You are not loggedIn",
    });
  }
});

perfumeRouter.post("/", async (c) => {
  const body = await c.req.json();
  const { success } = createPerfumeInput.safeParse(body);
  if (!success) {
    c.status(400);
    return c.json({
      message: "Body is incorrect",
    });
  }
  //@ts-ignore
  const adminUserId = c.get("adminId");
  console.log("adminid", adminUserId);

  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const Perfume = await prisma.perfume.create({
    data: {
      name: body.name,
      brand: body.brand,
      description: body.description,
      notes: body.notes,
      rating: body.rating,
    },
  });

  return c.json({
    Perfume,
  });
});
