import { Hono } from "hono";
import { jwt, verify, sign, decode } from "hono/jwt";
import type { JwtVariables } from "hono/jwt";
import { getPrisma } from "../prismaFunction";
import { z } from "zod";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";
import { adminAuthMiddleware } from "../middlewares/authMiddleware";

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
  return hashHex;
}

const singupInput = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string().min(6),
});
const singinInput = z.object({
  email: z.string(),
  password: z.string().min(6),
});

export const adminRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    SECRET: string;
  };
}>();

adminRouter.use("/*", adminAuthMiddleware);

adminRouter.post("/signup", async (c) => {
  try {
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const { success } = singupInput.safeParse(body);
    if (!success) {
      c.status(401);
      return c.json({
        message: "Inputs are incorrect",
      });
    }
    const hashedPassword = await hashPassword(body.password);
    const existingAdminUser = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (existingAdminUser) {
      c.status(401);
      c.json({
        message: "Email already registered",
      });
    }

    const adminUser = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email,
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    const payload = {
      email: body.email,
      id: adminUser.id,
    };

    const token = await sign(payload, c.env.SECRET);

    return c.json({
      jwt: token,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return c.json({ message: "Internal Server Error" }); // Catches any other errors during user creation
  }
});

adminRouter.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());
  const body = await c.req.json();
  const { success } = singinInput.safeParse(body);

  if (!success) {
    c.status(401);
    return c.json({
      message: "Inputs are invalid",
    });
  }

  const existingAdminUser = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });
  if (!existingAdminUser) {
    c.status(403);
    return c.json({
      message: "User Doesn't exist",
    });
  }

  const payload = {
    email: body.email,
    id: existingAdminUser.id,
  };

  const token = await sign(payload, c.env.SECRET);
  return c.json({
    jwt: token,
  });
});
