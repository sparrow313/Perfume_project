import { Hono } from "hono";
import { jwt, verify, sign, decode } from "hono/jwt";
import type { JwtVariables } from "hono/jwt";
import { getPrisma } from "../prismaFunction";
import { z } from "zod";
import { PrismaClient } from "@prisma/client/edge";
import { withAccelerate } from "@prisma/extension-accelerate";

const singupInput = z.object({
  username: z.string(),
  email: z.string(),
  password: z.string().min(6),
});
const singinInput = z.object({
  email: z.string(),
  password: z.string().min(6),
});

export const userRouter = new Hono<{
  Bindings: {
    DATABASE_URL: string;
    SECRET: string;
  };
}>();

userRouter.post("/signup", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const { success } = singupInput.safeParse(body);
  if (!success) {
    return c.json({
      message: "Inputs are not correct",
    }); // Ensures a response is returned if inputs are invalid
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      username: body.username,
    },
  });

  if (existingUser) {
    return c.json({
      message: "Username already taken",
    }); // Ensures a response is returned if username is taken
  }

  try {
    const User = await prisma.user.create({
      data: {
        username: body.username,
        email: body.email,
        password: body.password,
      },
    });

    const payload = {
      email: body.email,
      id: User.id,
    };

    const secret = c.env.SECRET;

    const token = await sign(payload, secret);
    return c.json({
      jwt: token,
    }); // Ensures a response is returned upon successful signup
  } catch (error) {
    console.error("Error creating user:", error);
    return c.json({ message: "Internal Server Error" }); // Catches any other errors during user creation
  }
});

userRouter.post("/signin", async (c) => {
  const prisma = new PrismaClient({
    datasourceUrl: c.env.DATABASE_URL,
  }).$extends(withAccelerate());

  const body = await c.req.json();
  const { success } = singinInput.safeParse(body);

  if (!success) {
    c.status(401);
    return c.json({
      message: "Incorrect emailId or password",
    });
  }

  const foundUser = await prisma.user.findUnique({
    where: {
      email: body.email,
    },
  });

  if (foundUser) {
    const token = await sign({ email: body.email }, c.env.SECRET);
    return c.json({
      message: "Logged in successfully!",
      token: token, // Send the token to the client
    });
  }
});
